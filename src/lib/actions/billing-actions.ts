'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createBillSchema,
  voidBillSchema,
  type CreateBillInput,
  type VoidBillInput,
} from '@/lib/validations/bill';
import { normalizeIndianPhone } from '@/lib/utils/phone';

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface CreateBillResponse {
  bill_id: string;
  bill_number: string;
  subtotal: number;
  total_item_discount: number;
  bill_discount: number;
  total_discount: number;
  total: number;
  total_cost: number;
  profit: number;
}

export interface BillDetailData {
  id: string;
  bill_number: string;
  customer_name: string;
  phone: string | null;
  payment_mode: 'Cash' | 'UPI' | 'Card' | 'Split';
  subtotal: number;
  total_item_discount: number;
  bill_discount: number;
  total_discount: number;
  total: number;
  total_cost: number;
  profit: number;
  status: 'active' | 'voided';
  notes: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  items: Array<{
    id: string;
    variant_id: string;
    product_name: string;
    colour: string | null;
    size: string | null;
    qty: number;
    unit_selling_price: number;
    line_gross: number;
    line_discount: number;
    allocated_bill_discount: number;
    unit_cost_price: number;
    line_total: number;
    line_cost: number;
    line_profit: number;
  }>;
}

/**
 * Server action to create a new bill atomically via PostgreSQL create_bill() RPC
 */
export async function createBillAction(
  rawInput: CreateBillInput
): Promise<ActionResult<CreateBillResponse>> {
  try {
    const validated = createBillSchema.safeParse(rawInput);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Invalid bill input';
      return { error: firstError };
    }

    const {
      customer_name,
      phone,
      payment_mode,
      bill_discount,
      notes,
      items,
    } = validated.data;

    const supabase = (await createClient()) as any;

    // Normalize phone number if present
    const normalizedPhone = phone ? normalizeIndianPhone(phone) : null;
    const finalCustomerName = customer_name?.trim() || 'Walk-in Customer';

    // Format items payload for PostgreSQL function
    const p_items = items.map((item) => ({
      variant_id: item.variant_id,
      qty: item.qty,
      unit_selling_price: item.unit_selling_price,
      line_discount: item.line_discount || 0,
    }));

    const { data, error } = await supabase.rpc('create_bill', {
      p_customer_name: finalCustomerName,
      p_phone: normalizedPhone || '',
      p_payment_mode: payment_mode,
      p_bill_discount: bill_discount,
      p_notes: notes ? notes.trim() : '',
      p_items: p_items,
    });

    if (error) {
      console.error('create_bill RPC error:', error);
      const msg = error.message || '';
      if (msg.includes('Insufficient stock')) {
        // Return clear friendly message directly matching requirement
        return { error: msg.replace(/ERROR:\s*/i, '').trim() };
      }
      if (msg.includes('Unauthorized')) {
        return { error: 'Unauthorized: Only the shop owner can create bills.' };
      }
      if (msg.includes('Variant') && msg.includes('not found')) {
        return { error: 'One or more items are no longer available in inventory.' };
      }
      if (msg.includes('exceed')) {
        return { error: msg.replace(/ERROR:\s*/i, '').trim() };
      }
      return { error: 'Failed to complete sale. ' + (msg ? `(${msg})` : 'Please try again.') };
    }

    const res = data as CreateBillResponse;

    revalidatePath('/billing');
    revalidatePath('/bills');
    revalidatePath('/billing/history');
    revalidatePath('/inventory');

    return {
      success: true,
      data: res,
    };
  } catch (err: unknown) {
    console.error('Unexpected error in createBillAction:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred during sale creation.',
    };
  }
}

/**
 * Server action to void an existing bill atomically via PostgreSQL void_bill() RPC
 */
export async function voidBillAction(
  rawInput: VoidBillInput
): Promise<ActionResult<{ bill_id: string; bill_number?: string }>> {
  try {
    const validated = voidBillSchema.safeParse(rawInput);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid void parameters' };
    }

    const { bill_id, reason } = validated.data;
    const supabase = (await createClient()) as any;

    const { data, error } = await supabase.rpc('void_bill', {
      p_bill_id: bill_id,
      p_reason: reason ? reason.trim() : null,
    });

    if (error) {
      console.error('void_bill RPC error:', error);
      const msg = error.message || '';
      if (msg.includes('already voided')) {
        return { error: 'This bill has already been cancelled.' };
      }
      if (msg.includes('Unauthorized')) {
        return { error: 'Unauthorized: Only the shop owner can void bills.' };
      }
      return { error: 'Failed to cancel bill. ' + (msg ? `(${msg})` : 'Please try again.') };
    }

    revalidatePath('/bills');
    revalidatePath('/billing/history');
    revalidatePath('/billing');
    revalidatePath('/inventory');

    return {
      success: true,
      data: data as { bill_id: string; bill_number?: string },
    };
  } catch (err: unknown) {
    console.error('Unexpected error in voidBillAction:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred while cancelling bill.',
    };
  }
}

/**
 * Server action to fetch full bill details with items
 */
export async function getBillDetailAction(
  billId: string
): Promise<ActionResult<BillDetailData>> {
  try {
    if (!billId) {
      return { error: 'Bill ID is required' };
    }

    const supabase = (await createClient()) as any;

    // Fetch bill header
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .maybeSingle();

    if (billError || !bill) {
      return { error: billError?.message || 'Bill not found' };
    }

    // Fetch bill items
    const { data: items, error: itemsError } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return { error: itemsError.message || 'Failed to load bill items' };
    }

    return {
      success: true,
      data: {
        ...bill,
        items: items || [],
      },
    };
  } catch (err: unknown) {
    console.error('Error fetching bill detail:', err);
    return {
      error: err instanceof Error ? err.message : 'Failed to fetch bill detail',
    };
  }
}
