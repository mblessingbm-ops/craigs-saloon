/* Studio timezone helpers. Harare is a fixed UTC+2 (no DST), so day
   boundaries can be anchored with a constant offset — this keeps revenue,
   diary, and reconciliation buckets aligned to the studio's local day even
   for late-evening transactions. */

export const STUDIO_TZ = "Africa/Harare";
const OFFSET = "+02:00";

/** Current (or given) date as a studio-local YYYY-MM-DD key. */
export function localDateKey(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TZ }).format(d);
}

/** The studio-local calendar date of an ISO timestamp (for bucketing). */
export function localDayOf(iso: string): string {
  return localDateKey(new Date(iso));
}

/** UTC instant for the start (00:00) of a studio-local day. */
export function dayStart(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00${OFFSET}`);
}

/** Weekday of a local date key, Monday = 0 … Sunday = 6. */
export function weekdayMon0(dateKey: string): number {
  const dow = new Date(`${dateKey}T12:00:00${OFFSET}`).getUTCDay(); // 0=Sun
  return (dow + 6) % 7;
}

/** Add days to a local date key, returning a new key. */
export function addDaysKey(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T12:00:00${OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return localDateKey(d);
}

/** First-of-month local date key. */
export function monthStartKey(dateKey: string): string {
  return dateKey.slice(0, 8) + "01";
}

/** {year, monthIndex0} of a local date key. */
export function ymOf(dateKey: string): { year: number; month: number } {
  return { year: Number(dateKey.slice(0, 4)), month: Number(dateKey.slice(5, 7)) - 1 };
}
