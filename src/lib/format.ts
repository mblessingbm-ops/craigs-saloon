export const money = (n: number) => "$" + Math.round(Number(n)).toLocaleString("en-US");

export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Stable 0..3 bucket from a string id — used to pick an avatar gradient. */
export function avatarClass(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return "a-" + (h % 4);
}

/** Normalize a phone number to E.164 (Zimbabwe default +263) so the same
 *  person isn't created as multiple clients. */
export function normalizePhone(raw: string): string {
  const cleaned = (raw || "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  let s = cleaned;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) return s;
  if (s.startsWith("0")) return "+263" + s.slice(1);
  if (s.startsWith("263")) return "+" + s;
  if (/^7\d{8}$/.test(s)) return "+263" + s; // bare local mobile
  return "+" + s;
}

/** Stock status for a retail product relative to its reorder level. */
export function stockLevel(stock: number, reorder: number): "low" | "warn" | "ok" {
  if (stock <= reorder - 2 || stock <= 2) return "low";
  if (stock <= reorder) return "warn";
  return "ok";
}

export const CATEGORY_LABEL: Record<string, string> = {
  hair: "Hair",
  nails: "Nails",
  barber: "Barber",
  beauty: "Beauty",
  general: "Other",
  other: "Other",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mobile_money: "EcoCash",
};

/** Format an ISO timestamp as h:mm am/pm in the studio's timezone (Africa/Harare),
 *  so times read correctly regardless of the viewer's device timezone. */
export function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Harare",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s/g, "")
    .toLowerCase();
}
