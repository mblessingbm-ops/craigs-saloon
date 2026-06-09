import { redirect } from "next/navigation";
import { StaffScreen } from "@/components/screens/StaffScreen";
import { getStaff } from "@/lib/queries";
import { getProfile, isManager, isOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const profile = await getProfile();
  if (!isManager(profile?.role)) redirect("/");
  const staff = await getStaff();
  return <StaffScreen staff={staff} canAdd={isOwner(profile?.role)} />;
}
