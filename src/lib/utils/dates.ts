const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a timestamp or date string into a human-readable date in Asia/Kolkata timezone.
 * Example: 21 Sep 2026
 */
export function formatISTDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats a timestamp into a 12-hour time in Asia/Kolkata timezone.
 * Example: 04:30 PM
 */
export function formatISTTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats date and time together in Asia/Kolkata timezone.
 * Example: 21 Sep 2026, 04:30 PM
 */
export function formatISTDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return `${formatISTDate(d)}, ${formatISTTime(d)}`;
}

/**
 * Returns today's date in IST formatted as YYYY-MM-DD.
 */
export function getCurrentISTDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Returns current month in IST formatted as YYYY-MM.
 */
export function getCurrentISTMonthString(): string {
  return getCurrentISTDateString().slice(0, 7);
}
