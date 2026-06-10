import { Dashboard } from "@/components/screens/Dashboard";
import { getDashboard, getReengageCount } from "@/lib/queries";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [periods, profile, dueClients] = await Promise.all([
    getDashboard(),
    getProfile(),
    getReengageCount(),
  ]);
  return <Dashboard periods={periods} role={profile?.role ?? null} dueClients={dueClients} />;
}
