/* Per-location operating hours + slot validation.
   operating_hours JSON shape: { mon:["08:00","18:00"], …, sun:null }.
   A null/absent day means the saloon is closed that day. All checks run in
   the studio timezone (Africa/Harare) so they match what staff see. */

import { STUDIO_TZ } from "@/lib/tz";

export type DayHours = [string, string] | null;
export type OperatingHours = Record<string, DayHours>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Fallback when a location has no hours configured (Mon–Sat 08:00–18:00, closed Sun). */
export const DEFAULT_HOURS: OperatingHours = {
  mon: ["08:00", "18:00"],
  tue: ["08:00", "18:00"],
  wed: ["08:00", "18:00"],
  thu: ["08:00", "18:00"],
  fri: ["08:00", "18:00"],
  sat: ["08:00", "18:00"],
  sun: null,
};

/** Coerce arbitrary JSON from the DB into a well-formed OperatingHours. */
export function asHours(json: unknown): OperatingHours {
  if (!json || typeof json !== "object") return DEFAULT_HOURS;
  const src = json as Record<string, unknown>;
  const out: OperatingHours = {};
  let any = false;
  for (const k of DAY_KEYS) {
    const v = src[k];
    if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
      out[k] = [v[0], v[1]];
      any = true;
    } else {
      out[k] = null;
    }
  }
  return any ? out : DEFAULT_HOURS;
}

const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const fmtMin = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Open/close window (in minutes from midnight) for a studio-local date key, or
 *  null if the saloon is closed that day. Drives the diary's per-day time slots. */
export function dayWindow(hours: OperatingHours, dateKey: string): { open: number; close: number } | null {
  const dow = new Date(`${dateKey}T12:00:00+02:00`).getUTCDay(); // 0=Sun
  const dh = hours[DAY_KEYS[dow]] ?? null;
  if (!dh) return null;
  return { open: toMin(dh[0]), close: toMin(dh[1]) };
}

/** Validate an appointment start (and its end) against past-time + the
 *  location's operating hours. Returns a friendly message, or null if OK. */
export function slotError(start: Date, hours: OperatingHours, durationMin = 30): string | null {
  if (start.getTime() < Date.now() - 60_000) return "That time is in the past.";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(start);
  const wdShort = (parts.find((p) => p.type === "weekday")?.value ?? "").toLowerCase().slice(0, 3);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  const dayIdx = DAY_KEYS.indexOf(wdShort as (typeof DAY_KEYS)[number]);
  const dh = hours[wdShort] ?? null;
  if (!dh) return `The saloon is closed on ${dayIdx >= 0 ? DAY_NAMES[dayIdx] + "s" : "that day"}.`;
  const open = toMin(dh[0]);
  const close = toMin(dh[1]);
  const startMin = h * 60 + m;
  if (startMin < open) return `That's before opening (${fmtMin(open)}).`;
  if (startMin >= close) return `That's after closing (${fmtMin(close)}).`;
  if (startMin + durationMin > close) return `That service would run past closing (${fmtMin(close)}).`;
  return null;
}
