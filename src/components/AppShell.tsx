"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons, type IconName } from "@/components/icons";
import { useTheme } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";

const SCREEN_META: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "Good evening", title: "The franchise" },
  "/diary": { eyebrow: "Today", title: "Calendar" },
  "/clients": { eyebrow: "Client records", title: "Clients" },
  "/close": { eyebrow: "End of day", title: "Reconcile" },
  "/staff": { eyebrow: "The team", title: "Team" },
};

// Each tab lists the roles that may see it. Reconcile + Team are manager-only;
// technicians get Dashboard, Calendar, and Clients.
const NAV: [string, string, IconName, string[]][] = [
  ["/", "Dashboard", "Home", ["owner", "admin", "technician"]],
  ["/diary", "Calendar", "Calendar", ["owner", "admin", "technician"]],
  ["/close", "Reconcile", "Check", ["owner", "admin"]],
  ["/staff", "Team", "Users", ["owner", "admin"]],
  ["/clients", "Clients", "Chat", ["owner", "admin", "technician"]],
];

export function AppShell({
  children,
  firstName,
  role,
}: {
  children: ReactNode;
  firstName?: string;
  role?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const nav = NAV.filter(([, , , roles]) => !role || roles.includes(role));
  // match the nav entry whose route is the active section
  const activeKey =
    nav
      .map(([k]) => k)
      .filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";
  // header title can come from a non-nav route too (e.g. /staff)
  const metaKey =
    Object.keys(SCREEN_META)
      .filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";
  const meta = SCREEN_META[metaKey] ?? SCREEN_META["/"];
  // technicians see a personal "Your day" home rather than the franchise view
  const title = metaKey === "/" && role === "technician" ? "Your day" : meta.title;
  const eyebrow =
    activeKey === "/" && firstName ? `${meta.eyebrow}, ${firstName}` : meta.eyebrow;

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <div className="ga-header">
        <div className="ga-header-row">
          <div className="ga-h-text" key={pathname}>
            <div className="ga-h-eyebrow">{eyebrow}</div>
            <div className="ga-h-title">{title}</div>
          </div>
          <div className="ga-h-actions">
            <button className="ga-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
              {theme === "light" ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
            </button>
            <button className="ga-icon-btn" aria-label="WhatsApp" onClick={() => router.push("/chat")}>
              <Icons.Chat size={19} />
            </button>
            <button className="ga-icon-btn" aria-label="Sign out" onClick={signOut}>
              <Icons.LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="ga-screen">
        <div className="ga-screen-pad" key={pathname}>{children}</div>
      </div>

      <nav className="ga-nav">
        {nav.map(([k, label, icon]) => {
          const Ico = Icons[icon];
          const on = k === activeKey;
          return (
            <Link key={k} href={k} data-on={on ? "1" : "0"}>
              <span className="navico">
                <Ico size={22} sw={on ? 2.1 : 1.7} />
              </span>
              <span className="lab">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
