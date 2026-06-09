import { redirect } from "next/navigation";

// Craig's Saloon has no retail. This route is retired — it redirects to the
// dashboard. (The file is kept as a redirect because the environment blocks
// deleting it; safe to remove the folder entirely once permissions allow.)
export default function RetailPage() {
  redirect("/");
}
