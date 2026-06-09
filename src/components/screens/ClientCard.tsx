"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { initials, money, avatarClass } from "@/lib/format";
import { Sheet } from "@/components/Sheet";
import { deleteClient } from "@/lib/actions";
import { useToast } from "@/lib/toast";
import type { ClientCardData } from "@/lib/queries";

export function ClientCard({ c, canDelete }: { c: ClientCardData; canDelete: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const onDelete = () => {
    startDelete(async () => {
      const res = await deleteClient(c.id);
      if (res.error) toast(res.error, "error");
      else {
        toast("Client record deleted", "success");
        router.push("/clients");
      }
    });
  };

  return (
    <>
      <button className="back-link" onClick={() => router.push("/clients")}>
        <Icons.ChevL size={15} /> Clients
      </button>

      <div className="cl-hero">
        <div className={"av " + avatarClass(c.id)}>{initials(c.name)}</div>
        <div className="cl-hero-txt">
          <div className="nm">{c.name}</div>
          <div className="meta">{c.phone}</div>
          <div className="meta">Client since {c.since}</div>
        </div>
      </div>

      <div className="cl-stat-row">
        <div className="cl-stat">
          <div className="v">{c.visits}</div>
          <div className="k">Visits</div>
        </div>
        <div className="cl-stat">
          <div className="v">{c.lastVisit}</div>
          <div className="k">Last visit</div>
        </div>
        <div className="cl-stat">
          <div className="v">{c.preferredTech ?? "—"}</div>
          <div className="k">Usual stylist</div>
        </div>
      </div>

      {c.preferredLocation && (
        <div className="note-card" style={{ marginTop: 14 }}>
          <Icons.Home size={18} style={{ color: "var(--accent)" }} className="ic" />
          <div>
            <div className="tt">Usual saloon</div>
            <div className="tx">Craig&apos;s {c.preferredLocation}</div>
          </div>
        </div>
      )}

      {c.notes && (
        <div className="note-card sensitive" style={{ marginTop: 14 }}>
          <Icons.Star size={18} style={{ color: "var(--warn)" }} className="ic" />
          <div>
            <div className="tt">Notes</div>
            <div className="tx">{c.notes}</div>
          </div>
        </div>
      )}

      {/* visit history */}
      <div className="block" style={{ marginTop: 22 }}>
        <div className="section-title" style={{ marginBottom: 6 }}>
          Visit history
        </div>
        {c.history.length === 0 ? (
          <div className="faint" style={{ fontSize: 13 }}>No visits logged yet.</div>
        ) : (
          <div className="hist">
            {c.history.map((h, i) => (
              <div className="hist-item" key={i}>
                <div className="hist-d">{h.date}</div>
                <div className="hist-s">
                  {h.service}
                  <span className="hist-tag">{money(h.amount)}</span>
                </div>
                <div className="hist-n">
                  {h.who}
                  {h.location ? " · " + h.location : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canDelete && (
        <button
          className="btn-ghost"
          style={{ marginTop: 24, color: "var(--danger)" }}
          onClick={() => setConfirmDelete(true)}
        >
          Delete client record
        </button>
      )}

      {confirmDelete && (
        <Sheet onClose={() => setConfirmDelete(false)}>
          <div className="sheet-title">Delete {c.name}?</div>
          <div className="sheet-sub">
            This removes the client and their WhatsApp history. Past appointments stay on record but are de-identified. This cannot be undone.
          </div>
          <div className="sheet-actions">
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn-primary" style={{ background: "var(--danger)", boxShadow: "none" }} onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
