/**
 * Normalizes Indian phone numbers into clean 10-digit format or +91 standard.
 * Accepts formats: 9876543210, +919876543210, 09876543210, 98765 43210, etc.
 */
export function normalizeIndianPhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Strip all non-digit characters except leading plus
  const cleaned = input.trim().replace(/[^\d+]/g, '');

  if (!cleaned) return null;

  // Extract pure digits
  let digits = cleaned.replace(/\D/g, '');

  // Remove leading '0' if 11 digits (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Remove leading '91' if 12 digits (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // If valid 10-digit Indian mobile number
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // Return original trimmed if it doesn't match standard 10-digit (to avoid dropping arbitrary inputs)
  return cleaned;
}

/**
 * Returns raw 10-digit mobile string for database search or wa.me links
 */
export function getRawIndianPhoneDigits(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.trim().replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.length === 10 ? digits : null;
}
