"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { money } from "@/lib/format";
import type { LocationDetail } from "@/lib/queries";

const STATUS: Record<string, { label: string; color: string }> = {
  matched: { label: "Reconciled · matched", color: "var(--success)" },
  pending: { label: "Not yet reconciled", color: "var(--warn)" },
  flagged: { label: "Variance flagged", color: "var(--danger)" },
};

export function LocationDetailView({ d }: { d: LocationDetail }) {
  const router = useRouter();
  const maxCat = Math.max(1, ...d.byCategory.map((c) => c.value));
  const st = STATUS[d.reconStatus] ?? STATUS.pending;

  return (
    <>
      <button className="back-link" onClick={() => router.push("/")}>
        <Icons.ChevL size={15} /> Franchise
      </button>

      <div className="recon-summary" style={{ marginTop: 12 }}>
        <div className="lab">Craig&apos;s {d.name} · {d.date}</div>
        <div className="big">
          <span className="cur">$</span>
          {d.revenue.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "rgba(243,235,227,0.7)" }}>Today&apos;s takings at this saloon.</div>
        <div className="sp">
          <div className="it">
            Clients<b>{d.clients}</b>
          </div>
          <div className="it">
            Appointments<b>{d.appts}</b>
          </div>
          <div className="it">
            Stations<b>{d.stations}</b>
          </div>
        </div>
      </div>

      {/* reconciliation status → reconcile this saloon */}
      <Link
        href={`/close?location=${d.id}`}
        className="thera-row card"
        style={{ marginTop: 14, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: st.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm">End-of-day reconciliation</div>
          <div className="ro">{st.label}</div>
        </div>
        <Icons.Chevron size={15} style={{ color: "var(--ink-faint)" }} />
      </Link>

      {/* revenue by category */}
      <div className="block" style={{ marginTop: 18 }}>
        <div className="block-head">
          <div className="section-title">Revenue by category</div>
        </div>
        <div className="card">
          {d.byCategory.length === 0 ? (
            <div className="faint" style={{ fontSize: 13 }}>No services logged yet today.</div>
          ) : (
            <div className="bar-row">
              {d.byCategory.map((c) => (
                <div className="bar" key={c.key}>
                  <span className="lab">{c.label}</span>
                  <span className="val">{money(c.value)}</span>
                  <div className="track">
                    <div className={"fill c-" + c.key} style={{ width: (c.value / maxCat) * 100 + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* technicians working today at this saloon */}
      {d.byTechnician.length > 0 && (
        <div className="block">
          <div className="block-head">
            <div className="section-title">Technicians today</div>
          </div>
          <div className="card">
            {d.byTechnician.map((t, i) => (
              <div className="thera-row" key={t.id}>
                <div className={"avatar " + t.avatar}>{t.short[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="nm">
                    {t.short}
                    {i === 0 && d.byTechnician.length > 1 && (
                      <span className="mini-course" style={{ marginLeft: 7 }}>
                        Top
                      </span>
                    )}
                  </div>
                  <div className="ro">
                    {t.clients} client{t.clients === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="amt">{money(t.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
