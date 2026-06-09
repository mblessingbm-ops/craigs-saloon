/* Pure revenue-aggregation logic — no DB/server imports, so it's unit-testable.
   getDashboard() in queries.ts fetches rows, maps them to Txn[], then calls
   buildPeriod() for each period. */
import { CATEGORY_LABEL, PAYMENT_LABEL, avatarClass } from "@/lib/format";

export interface DashTherapist {
  id: string;
  short: string;
  role: string;
  avatar: string;
  value: number;
}
export interface DashPeriod {
  label: string;
  sub: string;
  total: number;
  services: number;
  delta: number;
  deltaLabel: string;
  clients: number;
  avgSpend: number;
  newClients: number;
  byCategory: { key: string; label: string; value: number }[];
  byPayment: { key: string; label: string; value: number }[];
  byTherapist: DashTherapist[];
  byLocation: { id: string; name: string; value: number; clients: number; avg: number }[];
  series: number[];
  seriesLabels: string[];
}
export type DashboardData = Record<"today" | "week" | "month", DashPeriod>;

export interface Txn {
  date: string; // yyyy-mm-dd (studio-local)
  ts: string; // iso
  amount: number;
  kind: "service";
  category?: string;
  payment?: string;
  therapistId?: string | null;
  therapistShort?: string;
  therapistRole?: string;
  locationId?: string | null;
  locationName?: string;
  clientId?: string | null;
}

export interface Range {
  start: Date;
  end: Date;
}

export function buildPeriod(
  txns: Txn[],
  range: Range,
  prev: Range,
  meta: { label: string; sub: string; deltaLabel: string },
  newClients: number,
  series: { values: number[]; labels: string[] }
): DashPeriod {
  const inRange = (t: Txn, r: Range) => {
    const d = new Date(t.ts).getTime();
    return d >= r.start.getTime() && d < r.end.getTime();
  };
  const cur = txns.filter((t) => inRange(t, range));
  const prevTxns = txns.filter((t) => inRange(t, prev));

  const sum = (list: Txn[]) => list.reduce((a, t) => a + t.amount, 0);
  const total = sum(cur);
  const prevTotal = sum(prevTxns);
  const services = sum(cur.filter((t) => t.kind === "service"));

  // by service category
  const catMap = new Map<string, number>();
  cur
    .filter((t) => t.kind === "service" && t.category)
    .forEach((t) => catMap.set(t.category!, (catMap.get(t.category!) ?? 0) + t.amount));
  const byCategory = [...catMap.entries()]
    .map(([key, value]) => ({ key, label: CATEGORY_LABEL[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);

  // payment mix (cash/card/mobile only)
  const payOrder = ["cash", "card", "mobile_money"];
  const payMap = new Map<string, number>();
  cur
    .filter((t) => t.payment && payOrder.includes(t.payment))
    .forEach((t) => payMap.set(t.payment!, (payMap.get(t.payment!) ?? 0) + t.amount));
  const byPayment = payOrder
    .map((key) => ({ key: key === "mobile_money" ? "mobile" : key, label: PAYMENT_LABEL[key], value: payMap.get(key) ?? 0 }))
    .filter((p) => p.value > 0);

  // top therapists (service revenue)
  const therMap = new Map<string, DashTherapist>();
  cur
    .filter((t) => t.kind === "service" && t.therapistId)
    .forEach((t) => {
      const ex = therMap.get(t.therapistId!) ?? {
        id: t.therapistId!,
        short: t.therapistShort ?? "—",
        role: t.therapistRole ?? "",
        avatar: avatarClass(t.therapistId!),
        value: 0,
      };
      ex.value += t.amount;
      therMap.set(t.therapistId!, ex);
    });
  const byTherapist = [...therMap.values()].sort((a, b) => b.value - a.value).slice(0, 4);

  // by location (franchise view — owner sees all, admin sees their own)
  const locMap = new Map<string, { id: string; name: string; value: number; clients: Set<string> }>();
  cur
    .filter((t) => t.kind === "service" && t.locationId)
    .forEach((t) => {
      const ex = locMap.get(t.locationId!) ?? { id: t.locationId!, name: t.locationName ?? "—", value: 0, clients: new Set<string>() };
      ex.value += t.amount;
      if (t.clientId) ex.clients.add(t.clientId);
      locMap.set(t.locationId!, ex);
    });
  const byLocation = [...locMap.values()]
    .map((l) => ({ id: l.id, name: l.name, value: l.value, clients: l.clients.size, avg: l.clients.size ? Math.round(l.value / l.clients.size) : 0 }))
    .sort((a, b) => b.value - a.value);

  const clientIds = new Set(cur.filter((t) => t.kind === "service" && t.clientId).map((t) => t.clientId));
  const clients = clientIds.size;
  const avgSpend = clients ? Math.round(total / clients) : 0;
  const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  return {
    ...meta,
    total,
    services,
    delta,
    clients,
    avgSpend,
    newClients,
    byCategory,
    byPayment,
    byTherapist,
    byLocation,
    series: series.values,
    seriesLabels: series.labels,
  };
}
