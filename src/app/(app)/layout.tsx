import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const firstName = profile.short_name || profile.full_name?.split(" ")[0];

  return (
    <AppFrame>
      <AppShell firstName={firstName} role={profile.role}>{children}</AppShell>
    </AppFrame>
  );
}
