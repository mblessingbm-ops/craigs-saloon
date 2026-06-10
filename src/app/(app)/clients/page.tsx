import { ClientsList } from "@/components/screens/ClientsList";
import { getClients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ filter }, rows] = await Promise.all([searchParams, getClients()]);
  return <ClientsList rows={rows} initialFilter={filter === "due" ? "due" : "all"} />;
}
