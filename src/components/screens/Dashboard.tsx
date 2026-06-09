"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { Spark, Donut } from "@/components/charts";
import { money, avatarClass } from "@/lib/format";
import { exportReport } from "@/lib/actions";
import { LiveStatus } from "@/components/LiveStatus";
import { useToast } from "@/lib/toast";
import type { DashboardData } from "@/lib/queries";

const payColors: Record<string, string> = {
  cash: "#8a6630",
  card: "var(--accent)",
  mobile: "#6d9077",
};

export function Dashboard({ periods, role }: { periods: DashboardData; role: string | null }) {
  const isManager = role === "owner" || role === "admin";
  const isOwner = role === "owner";
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [isExporting, startExport] = useTransition();
  const toast = useToast();
  const d = periods[period];
  const maxCat = Math.max(1, ...d.byCategory.map((c) => c.value));

  const doExport = () => {
    startExport(async () => {
      const res = await exportReport(period);
      if (res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename ?? "report.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast("Report downloaded", "success");
      } else {
        toast(res.error ?? "Export failed", "error");
      }
    });
  };

  return (
    <>
      <div className="dash-top">
        <div className="dash-period">
          {(["today", "week", "month"] as const).map((p) => (
            <button key={p} data-on={period === p ? "1" : "0"} onClick={() => setPeriod(p)}>
              {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <LiveStatus />
      </div>

      {/* hero */}
      <div className="hero">
        <div className="hero-lab">
          {d.label} · {d.sub}
        </div>
        <div className="hero-num">
          <span className="cur">$</span>
          {d.total.toLocaleString()}
        </div>
        <div className={"hero-delta" + (d.delta < 0 ? " down" : "")}>
          <span className="ar">{d.delta < 0 ? "▼" : "▲"}</span> {Math.abs(d.delta)}%{" "}
          <span style={{ opacity: 0.7, fontWeight: 500 }}>{d.deltaLabel}</span>
        </div>
        <div className="hero-split">
          <div className="it">
            <div className="k">Services</div>
            <div className="v">{money(d.services)}</div>
          </div>
          <div className="it">
            <div className="k">Avg ticket</div>
            <div className="v">{money(d.avgSpend)}</div>
          </div>
        </div>
        <div className="hero-spark">
          <Spark data={d.series.length ? d.series : [0, 0]} color="#c9a06c" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            {d.seriesLabels.map((l, i) => (
              <span key={i} style={{ fontSize: 9, color: "rgba(243,235,227,0.5)", fontWeight: 600 }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="stat-row">
        <div className="stat">
          <div className="v">{d.clients}</div>
          <div className="k">Clients served</div>
        </div>
        <div className="stat">
          <div className="v">{money(d.avgSpend)}</div>
          <div className="k">Avg. spend</div>
        </div>
        <div className="stat">
          <div className="v">+{d.newClients}</div>
          <div className="k">New clients</div>
        </div>
      </div>

      {/* by location — the franchise view (owner sees all 4; admin sees their own; hidden for technicians) */}
      {isManager && d.byLocation.length > 0 && (
        <div className="block">
          <div className="block-head">
            <div className="section-title">By location</div>
          </div>
          <div className="card">
            {d.byLocation.map((l, i) => {
              const inner = (
                <>
                  <div className={"avatar " + avatarClass(l.id)}>{l.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nm">
                      {l.name}
                      {i === 0 && d.byLocation.length > 1 && (
                        <span className="mini-course" style={{ marginLeft: 7 }}>
                          Top
                        </span>
                      )}
                    </div>
                    <div className="ro">
                      {l.clients} client{l.clients === 1 ? "" : "s"} · avg {money(l.avg)}
                    </div>
                  </div>
                  <div className="amt">{money(l.value)}</div>
                  {isOwner && <Icons.Chevron size={15} style={{ color: "var(--ink-faint)", marginLeft: 6 }} />}
                </>
              );
              return isOwner ? (
                <Link key={l.id} href={`/location/${l.id}`} className="thera-row" style={{ textDecoration: "none", color: "inherit" }}>
                  {inner}
                </Link>
              ) : (
                <div key={l.id} className="thera-row">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* by category */}
      <div className="block">
        <div className="block-head">
          <div className="section-title">Revenue by category</div>
        </div>
        <div className="card">
          {d.byCategory.length === 0 ? (
            <div className="faint" style={{ fontSize: 13 }}>No services logged yet.</div>
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

      {/* payment mix */}
      {d.byPayment.length > 0 && (
        <div className="block">
          <div className="block-head">
            <div className="section-title">Payment mix</div>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Donut size={92} stroke={13} segments={d.byPayment.map((p) => ({ value: p.value, color: payColors[p.key] }))} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {d.byPayment.map((p) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: payColors[p.key] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{p.label}</span>
                  <span
                    className="tnum"
                    style={{ marginLeft: "auto", fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}
                  >
                    {money(p.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* top technicians — manager view only */}
      {isManager && d.byTherapist.length > 0 && (
        <div className="block">
          <div className="block-head">
            <div className="section-title">Top technicians</div>
            <Link href="/staff">All team →</Link>
          </div>
          <div className="card">
            {d.byTherapist.map((t, i) => (
              <div className="thera-row" key={t.id}>
                <div className={"avatar " + t.avatar}>{t.short[0]}</div>
                <div>
                  <div className="nm">
                    {t.short}
                    {i === 0 && (
                      <span className="mini-course" style={{ marginLeft: 7 }}>
                        Top
                      </span>
                    )}
                  </div>
                  <div className="ro">{t.role}</div>
                </div>
                <div className="amt">{money(t.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* export — financial report, managers only */}
      {isManager && (
        <div className="block">
          <button className="btn-ghost" onClick={doExport} disabled={isExporting}>
            <Icons.Export size={17} /> {isExporting ? "Preparing…" : "Export report — CSV"}
          </button>
        </div>
      )}
    </>
  );
}
