import { describe, it, expect } from "vitest";
import { buildPeriod, type Txn } from "@/lib/analytics";

const range = { start: new Date("2026-06-05T00:00:00Z"), end: new Date("2026-06-06T00:00:00Z") };
const prev = { start: new Date("2026-06-04T00:00:00Z"), end: new Date("2026-06-05T00:00:00Z") };
const meta = { label: "Today", sub: "Fri 5 Jun", deltaLabel: "vs yesterday" };
const series = { values: [0, 180], labels: ["9", "now"] };

const t = (over: Partial<Txn>): Txn => ({
  date: "2026-06-05",
  ts: "2026-06-05T10:00:00Z",
  amount: 0,
  kind: "service",
  ...over,
});

describe("buildPeriod", () => {
  const txns: Txn[] = [
    t({ amount: 100, kind: "service", category: "hair", payment: "cash", therapistId: "RM", therapistShort: "Rumbi", clientId: "A" }),
    t({ amount: 50, kind: "service", category: "nails", payment: "card", therapistId: "CM", therapistShort: "Chiedza", clientId: "B" }),
    // previous-day txn for the delta
    t({ ts: "2026-06-04T10:00:00Z", amount: 200, kind: "service", category: "hair", payment: "cash", therapistId: "RM", clientId: "A" }),
  ];
  const d = buildPeriod(txns, range, prev, meta, 2, series);

  it("totals services in range only", () => {
    expect(d.total).toBe(150);
    expect(d.services).toBe(150);
  });
  it("breaks down by category, sorted desc", () => {
    expect(d.byCategory).toEqual([
      { key: "hair", label: "Hair", value: 100 },
      { key: "nails", label: "Nails", value: 50 },
    ]);
  });
  it("breaks down payment mix", () => {
    const cash = d.byPayment.find((p) => p.key === "cash");
    const card = d.byPayment.find((p) => p.key === "card");
    expect(cash?.value).toBe(100);
    expect(card?.value).toBe(50);
  });
  it("ranks therapists by service revenue", () => {
    expect(d.byTherapist[0]).toMatchObject({ id: "RM", value: 100 });
    expect(d.byTherapist[1]).toMatchObject({ id: "CM", value: 50 });
  });
  it("counts clients served + average spend", () => {
    expect(d.clients).toBe(2);
    expect(d.avgSpend).toBe(75);
  });
  it("computes delta vs the previous period", () => {
    // 150 vs 200 = -25%
    expect(d.delta).toBe(-25);
  });
});

describe("buildPeriod — by location (franchise view)", () => {
  const txns: Txn[] = [
    t({ amount: 100, kind: "service", locationId: "L1", locationName: "Avondale", clientId: "A" }),
    t({ amount: 60, kind: "service", locationId: "L1", locationName: "Avondale", clientId: "B" }),
    t({ amount: 200, kind: "service", locationId: "L2", locationName: "Borrowdale", clientId: "C" }),
  ];
  const d = buildPeriod(txns, range, prev, meta, 0, series);

  it("groups revenue + clients per location, sorted desc", () => {
    expect(d.byLocation).toEqual([
      { id: "L2", name: "Borrowdale", value: 200, clients: 1, avg: 200 },
      { id: "L1", name: "Avondale", value: 160, clients: 2, avg: 80 },
    ]);
  });
});
