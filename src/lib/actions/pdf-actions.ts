'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBillPdfBuffer } from '@/lib/pdf/generate-bill-pdf';
import { Bill, BillItem, ShopSettings } from '@/types';

export interface GeneratePdfResult {
  success?: boolean;
  signedUrl?: string;
  fileName?: string;
  bill?: {
    id: string;
    bill_number: string;
    total: number;
    customer_name: string | null;
    phone: string | null;
    payment_mode: string;
    status: 'active' | 'voided';
    created_at: string;
  };
  error?: string;
}

const BUCKET_NAME = 'bills-pdf';
const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour

/**
 * Server action to retrieve an existing bill PDF signed URL or generate it on demand.
 * Verifies authentication, owner status, and maintains void-aware cache correctness.
 */
export async function getOrGenerateBillPdfAction(
  billId: string
): Promise<GeneratePdfResult> {
  try {
    // 1. Validate bill ID input
    if (!billId || typeof billId !== 'string') {
      return { error: 'Invalid bill ID' };
    }

    // 2. Authenticate user & verify owner
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized: Authentication required.' };
    }

    const { data: isOwner, error: ownerError } = await supabase.rpc('is_owner');
    if (ownerError || !isOwner) {
      return { error: 'Unauthorized: Only the shop owner can access or generate bill PDFs.' };
    }

    // 3. Fetch persisted bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .maybeSingle();

    if (billError || !bill) {
      return { error: billError?.message || 'Bill not found' };
    }

    // Deterministic storage path based on server-verified bill data
    const storagePath = `bills/${bill.bill_number}_${bill.id}.pdf`;
    const fileName = `${bill.bill_number}.pdf`;

    // Admin client for secure server-side storage operations
    const adminClient = createAdminClient();

    // 4. Check if PDF already exists in storage and matches current bill status
    let needsGeneration = true;

    if (bill.pdf_path) {
      // Check file existence in storage
      const fileDir = 'bills';
      const fileTarget = `${bill.bill_number}_${bill.id}.pdf`;

      const { data: fileList, error: listError } = await adminClient.storage
        .from(BUCKET_NAME)
        .list(fileDir, { search: fileTarget });

      const existingFile = fileList?.find((f) => f.name === fileTarget);

      if (existingFile && !listError) {
        // If bill is active, existing file is valid
        if (bill.status === 'active') {
          needsGeneration = false;
        } else if (bill.status === 'voided') {
          // If bill is voided, verify if the PDF was uploaded AFTER it was voided
          const voidedTime = bill.voided_at ? new Date(bill.voided_at).getTime() : 0;
          const fileUpdatedTime = existingFile.updated_at
            ? new Date(existingFile.updated_at).getTime()
            : existingFile.created_at
            ? new Date(existingFile.created_at).getTime()
            : 0;

          // If file was updated after or at voided timestamp, it contains the voided watermark
          if (fileUpdatedTime >= voidedTime && voidedTime > 0) {
            needsGeneration = false;
          }
        }
      }
    }

    // 5. Generate PDF if needed
    if (needsGeneration) {
      // Fetch persisted bill items (never current inventory)
      const { data: items, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (itemsError || !items) {
        return { error: itemsError?.message || 'Failed to fetch bill items' };
      }

      // Fetch shop settings
      const { data: settings } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      // Generate PDF buffer
      const pdfBytes = await generateBillPdfBuffer({
        bill: bill as Bill,
        items: (items || []) as BillItem[],
        settings: (settings || null) as ShopSettings | null,
      });

      // Upload/overwrite in private Supabase bucket
      const { error: uploadError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(storagePath, Buffer.from(pdfBytes), {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error for bill PDF:', uploadError);
        return { error: 'Failed to save bill PDF to storage: ' + uploadError.message };
      }

      // Update bill record with pdf_path if not set
      if (bill.pdf_path !== storagePath) {
        await supabase
          .from('bills')
          .update({ pdf_path: storagePath })
          .eq('id', billId);
      }
    }

    // 6. Generate short-lived signed URL for secure owner download
    const { data: signedData, error: signError } = await adminClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN, {
        download: fileName,
      });

    if (signError || !signedData?.signedUrl) {
      console.error('Failed to create signed URL:', signError);
      return { error: 'Failed to generate secure download link: ' + (signError?.message || '') };
    }

    return {
      success: true,
      signedUrl: signedData.signedUrl,
      fileName,
      bill: {
        id: bill.id,
        bill_number: bill.bill_number,
        total: bill.total,
        customer_name: bill.customer_name,
        phone: bill.phone,
        payment_mode: bill.payment_mode,
        status: bill.status,
        created_at: bill.created_at,
      },
    };
  } catch (err: unknown) {
    console.error('Unexpected error in getOrGenerateBillPdfAction:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred while processing PDF.',
    };
  }
}
