import { notFound, redirect } from "next/navigation";
import { LocationDetailView } from "@/components/screens/LocationDetail";
import { getLocationDetail } from "@/lib/queries";
import { getProfile, isOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, profile] = await Promise.all([params, getProfile()]);
  // Franchise drill-down is owner-only; admins already see their own saloon.
  if (!isOwner(profile?.role)) redirect("/");
  const d = await getLocationDetail(id);
  if (!d) notFound();
  return <LocationDetailView d={d} />;
}
