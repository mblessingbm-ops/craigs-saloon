import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/send";

export const dynamic = "force-dynamic";

/* Scheduled reminders. Trigger hourly via Vercel Cron (see vercel.json) or any
   scheduler. Protected by CRON_SECRET. Sends:
   - 24h-before appointment reminders
   - 1h-before "see you soon" nudges
   Outbound WhatsApp uses pre-approved templates in production; here we use plain
   text (only delivered to users inside the 24h customer-service window). */
export async function GET(req: NextRequest) {
  // Accept the secret via query, custom header, or Vercel Cron's Authorization bearer.
  const auth = req.headers.get("authorization");
  const secret =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("x-cron-secret") ??
    (auth?.startsWith("Bearer ") ? auth.slice(7) : null);
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const db = createAdminClient();
  const now = new Date();
  const sent: Record<string, number> = { reminder24h: 0, reminder1h: 0, expired: 0 };

  // expire active courses past their validity
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Harare" }).format(now);
  const { data: expired } = await db
    .from("course_enrolments")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expiry_date", todayKey)
    .select("id");
  sent.expired = expired?.length ?? 0;

  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  // only un-sent reminders in the window are returned (dedup)
  const windowQuery = async (fromMin: number, toMin: number, sentCol: "reminder_24h_sent_at" | "reminder_1h_sent_at") => {
    const from = new Date(now.getTime() + fromMin * 60000).toISOString();
    const to = new Date(now.getTime() + toMin * 60000).toISOString();
    const { data } = await db
      .from("appointments")
      .select("id, scheduled_start, clients(name, phone_number), services(name)")
      .eq("status", "booked")
      .is(sentCol, null)
      .gte("scheduled_start", from)
      .lt("scheduled_start", to);
    return data ?? [];
  };

  const logOut = (apptId: string, label: string) =>
    db.from("whatsapp_conversations").insert({
      direction: "outbound",
      message_type: "template",
      content: `${label} · appt ${apptId}`,
      conversation_state: "reminder",
      related_appointment_id: apptId,
      handled_by: "bot",
    });

  // 24h reminders
  for (const a of await windowQuery(23 * 60, 24 * 60, "reminder_24h_sent_at")) {
    const cl = a.clients as unknown as { name?: string; phone_number?: string } | null;
    const sv = a.services as unknown as { name?: string } | null;
    if (!cl?.phone_number) continue;
    await sendText(
      cl.phone_number,
      `Reminder: you have ${sv?.name ?? "an appointment"} at Craig's Saloon on ${fmt(a.scheduled_start)}. Reply CONFIRM or CHANGE.`
    );
    await db.from("appointments").update({ reminder_24h_sent_at: new Date().toISOString() }).eq("id", a.id);
    await logOut(a.id, "24h reminder");
    sent.reminder24h++;
  }

  // 1h reminders
  for (const a of await windowQuery(0, 60, "reminder_1h_sent_at")) {
    const cl = a.clients as unknown as { name?: string; phone_number?: string } | null;
    if (!cl?.phone_number) continue;
    await sendText(cl.phone_number, `See you in about an hour at Craig's Saloon 💈 If you're running late, reply LATE.`);
    await db.from("appointments").update({ reminder_1h_sent_at: new Date().toISOString() }).eq("id", a.id);
    await logOut(a.id, "1h reminder");
    sent.reminder1h++;
  }

  return NextResponse.json({ ok: true, sent });
}
