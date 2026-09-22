import { Bill } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { getRawIndianPhoneDigits } from '@/lib/utils/phone';

/**
 * Shop contact & bill-sender WhatsApp number (+91 81928 47496).
 * Note: A standard wa.me link opens WhatsApp on the user's active device;
 * it does not programmatically hijack third-party senders.
 */
export const SHOP_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER ||
  process.env.SHOP_WHATSAPP_NUMBER ||
  '+91 81928 47496';

export const NORMALIZED_SHOP_WHATSAPP_NUMBER =
  getRawIndianPhoneDigits(SHOP_WHATSAPP_NUMBER) ? `91${getRawIndianPhoneDigits(SHOP_WHATSAPP_NUMBER)}` : '918192847496';

/**
 * Generates customer-facing WhatsApp message text.
 * Strictly plain retail cash memo, without internal cost or profit.
 */
export function formatWhatsAppBillMessage(
  bill: Pick<Bill, 'bill_number' | 'customer_name' | 'total' | 'payment_mode'>,
  shopName: string = 'Cult Kulture'
): string {
  const customerName = bill.customer_name?.trim() || 'Valued Customer';
  const totalAmount = formatIndianRupees(bill.total);

  return (
    `Hello ${customerName},\n\n` +
    `Thank you for shopping with ${shopName}.\n\n` +
    `Bill: ${bill.bill_number}\n` +
    `Amount: ${totalAmount}\n` +
    `Payment: ${bill.payment_mode || 'Cash'}\n\n` +
    `Thank you for shopping with us!`
  );
}

/**
 * Constructs a wa.me URL.
 * If phone is a valid Indian number, normalizes to 91XXXXXXXXXX.
 * If phone is missing/invalid, returns wa.me/?text=... without target recipient.
 */
export function getWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const encodedMessage = encodeURIComponent(message);

  if (!phone) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  // Check for clean 10-digit Indian phone
  const rawDigits = getRawIndianPhoneDigits(phone);
  if (rawDigits) {
    return `https://wa.me/91${rawDigits}?text=${encodedMessage}`;
  }

  // If phone already starts with +, clean it and check
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    const onlyDigits = trimmed.replace(/\D/g, '');
    if (onlyDigits.length >= 10 && onlyDigits.length <= 15) {
      return `https://wa.me/${onlyDigits}?text=${encodedMessage}`;
    }
  }

  // If number cannot be safely validated, avoid sending to wrong recipient
  return `https://wa.me/?text=${encodedMessage}`;
}

export interface WebShareResult {
  success: boolean;
  fileShared: boolean;
  message?: string;
  error?: string;
}

/**
 * Triggers native Web Share API with PDF File object if supported.
 * Falls back gracefully if file sharing is not supported by browser.
 */
export async function shareBillPdf({
  signedUrl,
  fileName,
  title,
  text,
}: {
  signedUrl: string;
  fileName: string;
  title: string;
  text: string;
}): Promise<WebShareResult> {
  if (typeof window === 'undefined') {
    return { success: false, fileShared: false, error: 'Web Share is only available in browser' };
  }

  try {
    // 1. Check if navigator.share is available at all
    if (!navigator.share) {
      return {
        success: false,
        fileShared: false,
        fallbackReason: 'share_unsupported',
        message: 'Native Web Share is not supported on this device/browser.',
      } as any;
    }

    // 2. Fetch the PDF blob
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // 3. Test if file sharing is supported
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return { success: true, fileShared: true, message: 'Shared PDF successfully' };
    }

    // 4. Fallback: Share text & URL if file sharing is not supported
    await navigator.share({
      title,
      text,
      url: signedUrl,
    });
    return { success: true, fileShared: false, message: 'Shared bill link successfully' };
  } catch (err: unknown) {
    // Check for user cancellation (AbortError)
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, fileShared: false, message: 'Share was cancelled by user' };
    }

    return {
      success: false,
      fileShared: false,
      error: err instanceof Error ? err.message : 'Failed to share',
    };
  }
}
