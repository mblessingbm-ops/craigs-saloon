"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { money } from "@/lib/format";
import { saveStationReconciliation, reopenStationDay } from "@/lib/actions";
import { useToast } from "@/lib/toast";
import type { StationReconData, LocationReconStatus } from "@/lib/queries";

const headStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "var(--ink-faint)",
  borderBottom: "1px solid var(--line)",
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 12px",
  borderBottom: "1px solid var(--line)",
  fontSize: 14,
};
const numStyle: React.CSSProperties = { width: 62, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const inputStyle: React.CSSProperties = {
  width: 62,
  textAlign: "right",
  padding: "5px 7px",
  border: "1px solid var(--line-strong)",
  borderRadius: 8,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
};

/* ---------- Owner: franchise reconciliation overview ---------- */
export function ReconOverview({ locations }: { locations: LocationReconStatus[] }) {
  const dotColor = (s: string) => (s === "matched" ? "var(--success)" : s === "flagged" ? "var(--danger)" : "var(--warn)");
  const label = (s: string) => (s === "matched" ? "Matched" : s === "flagged" ? "Flagged" : "Pending");
  const total = locations.reduce((a, l) => a + l.systemTotal, 0);

  return (
    <>
      <div className="recon-summary">
        <div className="lab">End of day · all saloons</div>
        <div className="big">
          <span className="cur">$</span>
          {total.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "rgba(243,235,227,0.7)" }}>Reconciliation status across the franchise.</div>
      </div>

      <div className="block" style={{ marginTop: 18 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>
          By saloon
        </div>
        <div className="card">
          {locations.map((l) => (
            <Link key={l.locationId} href={`/close?location=${l.locationId}`} className="thera-row" style={{ textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: dotColor(l.status), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{l.name}</div>
                <div className="ro">
                  {money(l.systemTotal)} logged · {l.clients} client{l.clients === 1 ? "" : "s"}
                </div>
              </div>
              <span className="mini-course" style={{ background: "transparent", color: dotColor(l.status), border: `1px solid ${dotColor(l.status)}` }}>
                {label(l.status)}
              </span>
              <Icons.Chevron size={15} style={{ color: "var(--ink-faint)", marginLeft: 4 }} />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Admin (editable) / Owner (read-only): station table ---------- */
export function StationReconciliation({ data, readOnly }: { data: StationReconData; readOnly?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [till, setTill] = useState<Record<string, number>>(() => Object.fromEntries(data.stations.map((s) => [s.stationId, s.tillTotal])));
  const [notes, setNotes] = useState<Record<string, string>>(() => Object.fromEntries(data.stations.map((s) => [s.stationId, s.note ?? ""])));
  const [isPending, startTransition] = useTransition();

  const editable = !readOnly && !data.closed;
  const rows = data.stations.map((s) => {
    const t = editable ? till[s.stationId] ?? 0 : s.tillTotal;
    return { ...s, till: t, variance: t - s.systemTotal };
  });
  const tillTotal = rows.reduce((a, r) => a + r.till, 0);
  const variance = tillTotal - data.systemTotal;
  const flagged = rows.filter((r) => r.variance !== 0);
  const missingNote = flagged.some((r) => (notes[r.stationId] ?? "").trim().length < 3);

  const onSave = () => {
    startTransition(async () => {
      const res = await saveStationReconciliation({
        locationId: data.locationId,
        lines: rows.map((r) => ({ stationId: r.stationId, till: r.till, note: notes[r.stationId] })),
      });
      if (res.error) toast(res.error, "error");
      else {
        toast(variance === 0 ? "Day closed — all matched" : "Day closed with noted variances", "success");
        router.refresh();
      }
    });
  };
  const onReopen = () => {
    startTransition(async () => {
      const res = await reopenStationDay(data.locationId);
      if (res.error) toast(res.error, "error");
      else router.refresh();
    });
  };

  return (
    <>
      {readOnly && (
        <button className="back-link" onClick={() => router.push("/close")}>
          <Icons.ChevL size={15} /> All saloons
        </button>
      )}

      <div className="recon-summary" style={{ marginTop: readOnly ? 12 : 0 }}>
        <div className="lab">
          {data.locationName} · {data.date}
        </div>
        <div className="big">
          <span className="cur">$</span>
          {data.systemTotal.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "rgba(243,235,227,0.7)" }}>
          {data.closed ? "Day closed and locked." : "The system already knows what each station logged. Just confirm the till."}
        </div>
        <div className="sp">
          <div className="it">
            Stations<b>{data.stations.length}</b>
          </div>
          <div className="it">
            Clients<b>{data.clients}</b>
          </div>
          <div className="it">
            Variance
            <b style={{ color: variance === 0 ? "var(--success)" : "var(--danger)" }}>
              {variance > 0 ? "+" : ""}
              {money(variance)}
            </b>
          </div>
        </div>
      </div>

      <div className="block" style={{ marginTop: 18 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>
          Stations
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={headStyle}>
            <span style={{ flex: 1 }}>Station</span>
            <span style={numStyle}>System</span>
            <span style={numStyle}>Till</span>
            <span style={numStyle}>Var</span>
          </div>
          {rows.map((r, i) => {
            const v = r.variance;
            const last = i === rows.length - 1;
            return (
              <div key={r.stationId}>
                <div style={last && !(v !== 0) ? { ...rowStyle, borderBottom: 0 } : rowStyle}>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)" }}>{r.name}</span>
                  <span style={numStyle}>{money(r.systemTotal)}</span>
                  <span style={numStyle}>
                    {editable ? (
                      <input
                        style={inputStyle}
                        type="number"
                        inputMode="decimal"
                        aria-label={`Till total for ${r.name}`}
                        value={r.till}
                        onChange={(e) => setTill((c) => ({ ...c, [r.stationId]: Math.max(0, Number(e.target.value) || 0) }))}
                      />
                    ) : (
                      money(r.till)
                    )}
                  </span>
                  <span style={{ ...numStyle, color: v === 0 ? "var(--ink-faint)" : "var(--danger)", fontWeight: 700 }}>
                    {v === 0 ? "—" : (v > 0 ? "+" : "") + money(v)}
                  </span>
                </div>
                {editable && v !== 0 && (
                  <textarea
                    className="note-input"
                    style={{ margin: "0 12px 11px", width: "calc(100% - 24px)" }}
                    rows={1}
                    placeholder={`Note for ${r.name} variance…`}
                    value={notes[r.stationId] ?? ""}
                    onChange={(e) => setNotes((c) => ({ ...c, [r.stationId]: e.target.value }))}
                  />
                )}
                {!editable && v !== 0 && r.note && (
                  <div className="muted" style={{ fontSize: 12, padding: "0 12px 11px" }}>
                    ↳ {r.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly &&
        (data.closed ? (
          <button className="btn-ghost" onClick={onReopen} disabled={isPending}>
            Reopen day
          </button>
        ) : (
          <button className="btn-primary" disabled={missingNote || isPending} onClick={onSave}>
            {isPending
              ? "Saving…"
              : missingNote
                ? "Add notes to variances to close"
                : variance === 0
                  ? "Close the day — all matched"
                  : "Close with noted variances"}
          </button>
        ))}
    </>
  );
}
