import { Diary } from "@/components/screens/Diary";
import { getDiary, getBookingOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const [{ rooms, appts }, options] = await Promise.all([getDiary(), getBookingOptions()]);
  return <Diary rooms={rooms} appts={appts} options={options} />;
}
