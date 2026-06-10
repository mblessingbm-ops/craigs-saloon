"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { initials, avatarClass } from "@/lib/format";
import type { ClientListRow } from "@/lib/queries";

export function ClientsList({ rows }: { rows: ClientListRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filtered = rows.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

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
      <div
        className="faint"
        style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "16px 4px 2px" }}
      >
        {filtered.length} clients
      </div>
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
            <div style={{ flex: 1 }}>
              <div className="nm">{cl.name}</div>
              <div className="mt">
                {cl.visits} visit{cl.visits === 1 ? "" : "s"}
                {cl.lastVisit ? " · last " + cl.lastVisit : ""}
              </div>
            </div>
            {cl.hasNotes && <span className="mini-flag">Notes</span>}
            <Icons.Chevron size={16} style={{ color: "var(--ink-faint)" }} />
          </div>
        ))}
      </div>
    </>
  );
}
