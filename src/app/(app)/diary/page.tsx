import { Diary } from "@/components/screens/Diary";
import { getDiary, getBookingOptions } from "@/lib/queries";
import { localDateKey } from "@/lib/tz";

export const dynamic = "force-dynamic";

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dateKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localDateKey();
  const [{ rooms, appts }, options] = await Promise.all([getDiary(dateKey), getBookingOptions()]);
  return <Diary rooms={rooms} appts={appts} options={options} dateKey={dateKey} today={localDateKey()} />;
}
