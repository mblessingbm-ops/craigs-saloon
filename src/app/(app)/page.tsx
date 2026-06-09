import { Dashboard } from "@/components/screens/Dashboard";
import { getDashboard } from "@/lib/queries";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [periods, profile] = await Promise.all([getDashboard(), getProfile()]);
  return <Dashboard periods={periods} role={profile?.role ?? null} />;
}
