"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { initials, avatarClass } from "@/lib/format";
import type { ClientListRow } from "@/lib/queries";

// Open WhatsApp with a pre-filled re-booking message — staff review and send it
// themselves (no automatic send). Phone is E.164; wa.me wants bare digits.
function reengageLink(phone: string, name: string): string {
  const first = name.split(" ")[0] || "there";
  const msg = `Hi ${first}, we've missed you at Craig's Saloon! It's been a little while — reply here whenever you'd like to book your next visit. 💈`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}

export function ClientsList({
  rows,
  initialFilter = "all",
}: {
  rows: ClientListRow[];
  initialFilter?: "all" | "due";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const dueCount = rows.filter((c) => c.due).length;
  // honour a ?filter=due deep-link, but only if there's actually something to show
  const [filter, setFilter] = useState<"all" | "due">(initialFilter === "due" && dueCount > 0 ? "due" : "all");

  const filtered = rows
    .filter((c) => filter === "all" || c.due)
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="cl-search">
        <Icons.Search size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients by name or number"
        />
      </div>

      {dueCount > 0 && (
        <div className="cl-filter">
          <button className="chip" data-on={filter === "all" ? "1" : "0"} onClick={() => setFilter("all")}>
            All clients
          </button>
          <button className="chip" data-on={filter === "due" ? "1" : "0"} onClick={() => setFilter("due")}>
            Due for a visit · {dueCount}
          </button>
        </div>
      )}

      <div
        className="faint"
        style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "16px 4px 2px" }}
      >
        {filtered.length} {filter === "due" ? "due for a visit" : "clients"}
      </div>

      {filter === "due" && filtered.length === 0 && (
        <div className="faint" style={{ fontSize: 13, padding: "8px 4px" }}>
          No clients are due for a nudge right now.
        </div>
      )}

      <div className="cl-list">
        {filtered.map((cl) => (
          <div
            className="cl-li"
            key={cl.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/clients/${cl.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/clients/${cl.id}`);
              }
            }}
          >
            <div className={"av " + avatarClass(cl.id)}>{initials(cl.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nm">{cl.name}</div>
              <div className="mt">
                {cl.visits} visit{cl.visits === 1 ? "" : "s"}
                {cl.lastVisit ? " · last " + cl.lastVisit : ""}
              </div>
            </div>
            {cl.due && cl.phone ? (
              <a
                className="cl-wa"
                href={reengageLink(cl.phone, cl.name)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Message ${cl.name} on WhatsApp`}
                onClick={(e) => e.stopPropagation()}
              >
                <Icons.Chat size={15} />
                Nudge
              </a>
            ) : (
              cl.hasNotes && <span className="mini-flag">Notes</span>
            )}
            <Icons.Chevron size={16} style={{ color: "var(--ink-faint)" }} />
          </div>
        ))}
      </div>
    </>
  );
}
