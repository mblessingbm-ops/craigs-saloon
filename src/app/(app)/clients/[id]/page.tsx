import { notFound } from "next/navigation";
import { ClientCard } from "@/components/screens/ClientCard";
import { getClientCard } from "@/lib/queries";
import { getProfile, isOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c, profile] = await Promise.all([getClientCard(id), getProfile()]);
  if (!c) notFound();
  return <ClientCard c={c} canDelete={isOwner(profile?.role)} />;
}
