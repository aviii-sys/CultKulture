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
 * Formats a timestamp into DD/MM/YYYY in Asia/Kolkata timezone.
 * Example: 21/09/2026
 */
export function formatISTDateNumeric(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(d);

  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;

  return `${day}/${month}/${year}`;
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
  }).format(d).toUpperCase();
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

/**
 * Formats YYYY-MM string to human-readable month.
 * Example: '2026-09' -> 'September 2026'
 */
export function formatMonthLabel(monthStr: string | null | undefined): string {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return formatMonthLabel(getCurrentISTMonthString());
  }
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1;

  // Use 15th of the month to avoid any timezone edge overlap
  const d = new Date(Date.UTC(year, month, 15));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Generates a list of recent months for dropdown selection.
 * Defaults to current month + previous 11 months.
 */
export function getRecentMonthsList(count: number = 12): Array<{ value: string; label: string }> {
  const currentMonthStr = getCurrentISTMonthString();
  const [curYearStr, curMonthStr] = currentMonthStr.split('-');
  let year = parseInt(curYearStr, 10);
  let month = parseInt(curMonthStr, 10); // 1-indexed

  const list: Array<{ value: string; label: string }> = [];

  for (let i = 0; i < count; i++) {
    const val = `${year}-${String(month).padStart(2, '0')}`;
    list.push({
      value: val,
      label: formatMonthLabel(val),
    });

    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return list;
}

/**
 * Returns exact IST start (00:00:00) and end (00:00:00 of 1st of next month) ISO strings.
 * Used for strict half-open interval queries: >= start AND < end.
 */
export function getISTStartAndEndOfMonth(monthStr: string): { startISO: string; endISO: string } {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1 to 12

  // 00:00:00 IST is 18:30:00 UTC on the previous day
  // Asia/Kolkata is UTC+05:30 (without DST)
  const startUTC = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  // Subtract 5 hours 30 mins to get corresponding UTC instant for 00:00 IST
  const startInstant = new Date(startUTC.getTime() - (5 * 60 + 30) * 60 * 1000);

  // Next month 1st
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const nextMonthUTC = new Date(Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0));
  const endInstant = new Date(nextMonthUTC.getTime() - (5 * 60 + 30) * 60 * 1000);

  return {
    startISO: startInstant.toISOString(),
    endISO: endInstant.toISOString(),
  };
}

/**
 * Returns today's exact start (00:00:00 IST) and tomorrow's start (00:00:00 IST) in ISO.
 */
export function getISTStartAndEndOfToday(): { startISO: string; endISO: string } {
  const todayStr = getCurrentISTDateString();
  const [yearStr, monthStr, dayStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const todayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const startInstant = new Date(todayUTC.getTime() - (5 * 60 + 30) * 60 * 1000);
  const endInstant = new Date(startInstant.getTime() + 24 * 60 * 60 * 1000);

  return {
    startISO: startInstant.toISOString(),
    endISO: endInstant.toISOString(),
  };
}
