import { ClientsList } from "@/components/screens/ClientsList";
import { getClients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = await getClients();
  return <ClientsList rows={rows} />;
}
