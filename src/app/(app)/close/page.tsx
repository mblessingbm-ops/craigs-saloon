import { redirect } from "next/navigation";
import { StationReconciliation, ReconOverview } from "@/components/screens/Reconciliation";
import { getProfile, isManager } from "@/lib/auth";
import { getReconOverview, getStationReconciliation } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClosePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const [{ location }, profile] = await Promise.all([searchParams, getProfile()]);
  // Reconciliation is a manager function — technicians don't reconcile.
  if (!isManager(profile?.role)) redirect("/");
  const isOwner = profile?.role === "owner";

  // Owner with no location selected → franchise overview of all saloons.
  if (isOwner && !location) {
    const overview = await getReconOverview();
    return <ReconOverview locations={overview} />;
  }

  // Admin reconciles their own saloon; owner drills into the one they picked (read-only).
  const locationId = isOwner ? location! : profile?.location_id ?? null;
  if (!locationId) {
    return (
      <div className="faint" style={{ padding: 24, fontSize: 14 }}>
        No saloon is assigned to your account, so there&apos;s nothing to reconcile.
      </div>
    );
  }

  const data = await getStationReconciliation(locationId);
  return <StationReconciliation data={data} readOnly={isOwner} />;
}
