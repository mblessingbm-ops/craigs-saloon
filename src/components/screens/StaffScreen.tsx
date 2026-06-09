"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { money, CATEGORY_LABEL } from "@/lib/format";
import { createStaff } from "@/lib/actions";
import { Sheet } from "@/components/Sheet";
import type { StaffPerf } from "@/lib/queries";
import type { Database } from "@/lib/database.types";

const roleLabel: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  technician: "Technician",
};

export function StaffScreen({ staff, canAdd }: { staff: StaffPerf[]; canAdd: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <button className="back-link" onClick={() => router.push("/")}>
        <Icons.ChevL size={15} /> Dashboard
      </button>

      <div className="faint" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "16px 4px 10px" }}>
        This month · {staff.length} team members
      </div>

      {canAdd && (
        <button className="btn-ghost" style={{ marginBottom: 14 }} onClick={() => setAdding(true)}>
          <Icons.Plus size={16} /> Add team member
        </button>
      )}

      {adding && <AddStaffSheet onClose={() => setAdding(false)} onDone={() => { setAdding(false); router.refresh(); }} />}

      {staff.map((s) => (
        <div className="card" key={s.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={"avatar " + s.avatar}>{s.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="thera-row" style={{ padding: 0, border: 0 }}>
                <div>
                  <div className="nm" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                  <div className="ro" style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{roleLabel[s.role] ?? s.role}</div>
                </div>
              </div>
            </div>
          </div>

          {s.services.length > 0 && (
            <div className="chip-row" style={{ marginTop: 12 }}>
              {s.services.map((sv) => (
                <span key={sv} className="chip" style={{ cursor: "default" }}>
                  {CATEGORY_LABEL[sv] ?? sv}
                </span>
              ))}
            </div>
          )}

          <div className="cl-stat-row" style={{ marginTop: 12 }}>
            <div className="cl-stat">
              <div className="v">{money(s.revenue)}</div>
              <div className="k">Revenue</div>
            </div>
            <div className="cl-stat">
              <div className="v">{s.clients}</div>
              <div className="k">Clients</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

const ALL_SERVICES: Database["public"]["Enums"]["service_category"][] = ["hair", "nails", "barber", "beauty"];

function AddStaffSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"technician" | "admin">("technician");
  const [services, setServices] = useState<Database["public"]["Enums"]["service_category"][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (s: Database["public"]["Enums"]["service_category"]) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createStaff({ fullName, email, role, services });
      if (res.error) setError(res.error);
      else if (res.password) setPassword(res.password);
    });
  };

  return (
    <Sheet onClose={onClose}>
        {password ? (
          <>
            <div className="sheet-title">Team member added</div>
            <div className="sheet-sub">Share these credentials securely. They should change the password on first sign-in.</div>
            <div className="appt-detail">
              <span className="k">Email</span>
              <span className="v">{email}</span>
            </div>
            <div className="appt-detail">
              <span className="k">Temp password</span>
              <span className="v" style={{ fontFamily: "ui-monospace, monospace" }}>{password}</span>
            </div>
            <div className="sheet-actions">
              <button className="btn-primary" onClick={onDone}>
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="sheet-title">Add team member</div>
            <div className="sheet-sub">Create a login for a new staff member.</div>
            {error && <div className="login-error">{error}</div>}
            <div className="field">
              <label>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Tariro Moyo" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@craigssaloon.co.zw" />
            </div>
            <div className="field">
              <label>Role</label>
              <div className="chip-row">
                {(
                  [
                    ["technician", "Technician"],
                    ["admin", "Admin"],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} className="chip" data-on={role === k ? "1" : "0"} onClick={() => setRole(k)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {role === "technician" && (
              <div className="field">
                <label>Trained in</label>
                <div className="chip-row">
                  {ALL_SERVICES.map((s) => (
                    <button key={s} className="chip" data-on={services.includes(s) ? "1" : "0"} onClick={() => toggle(s)}>
                      {CATEGORY_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sheet-actions">
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submit} disabled={isPending || !fullName || !email}>
                {isPending ? "Creating…" : "Create login"}
              </button>
            </div>
          </>
        )}
    </Sheet>
  );
}
