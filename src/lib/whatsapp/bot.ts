import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText, sendButtons, sendList } from "@/lib/whatsapp/send";
import { normalizePhone } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type Convo = Database["public"]["Enums"]["convo_state"];

const CATEGORIES: { key: string; label: string }[] = [
  { key: "hair", label: "Hair" },
  { key: "nails", label: "Nails" },
  { key: "barber", label: "Barber" },
  { key: "beauty", label: "Beauty" },
];

const money = (n: number) => "$" + Math.round(Number(n));
const shortLoc = (name?: string | null) => (name ?? "").replace("Craig's Saloon — ", "");

/** Selection state is threaded through interactive reply IDs as
 *  `loc:service:iso`. UUIDs contain no colons, so we split on the first two. */
function parseSel(rest: string): { locId: string; serviceId: string; iso: string } {
  const i1 = rest.indexOf(":");
  const locId = rest.slice(0, i1);
  const r2 = rest.slice(i1 + 1);
  const i2 = r2.indexOf(":");
  return { locId, serviceId: r2.slice(0, i2), iso: r2.slice(i2 + 1) };
}

async function ensureClient(rawPhone: string, name?: string) {
  const db = createAdminClient();
  const phone = normalizePhone(rawPhone);
  const { data: existing } = await db.from("clients").select("*").eq("phone_number", phone).maybeSingle();
  if (existing) return existing;
  const { data: created } = await db
    .from("clients")
    .insert({ phone_number: phone, name: name ?? null })
    .select("*")
    .single();
  return created;
}

async function log(clientId: string | null, direction: "inbound" | "outbound", content: string, state: Convo) {
  const db = createAdminClient();
  await db.from("whatsapp_conversations").insert({
    client_id: clientId,
    direction,
    message_type: "text",
    content,
    conversation_state: state,
    handled_by: "bot",
  });
}

/** Generate the next few bookable slots (10:00 & 14:00, next 5 days). */
function nextSlots(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const base = new Date();
  for (let d = 1; d <= 5 && out.length < 8; d++) {
    const day = new Date(base);
    day.setDate(day.getDate() + d);
    if (day.getDay() === 0) continue; // closed Sunday
    for (const t of ["10:00", "14:00"]) {
      const iso = `${day.toISOString().slice(0, 10)}T${t}:00+02:00`;
      out.push({ iso, label: `${days[day.getDay()]} ${day.getDate()} ${mon[day.getMonth()]} · ${t === "10:00" ? "10:00 AM" : "2:00 PM"}` });
    }
  }
  return out.slice(0, 8);
}

/** Create a booking at a specific saloon: pick a station at that location that
 *  matches the service category, and a technician (assigned to the station, or
 *  one trained in the category at that location). */
async function createBooking(locationId: string, serviceId: string, iso: string, clientId: string) {
  const db = createAdminClient();
  const [{ data: loc }, { data: svc }] = await Promise.all([
    db.from("locations").select("name").eq("id", locationId).maybeSingle(),
    db.from("services").select("category, duration_minutes, name").eq("id", serviceId).maybeSingle(),
  ]);
  if (!loc || !svc) return null;

  const { data: room } = await db
    .from("rooms")
    .select("id, assigned_therapist_id")
    .eq("location_id", locationId)
    .eq("service_category", svc.category)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let therapistId = room?.assigned_therapist_id ?? null;
  if (!therapistId) {
    const { data: tech } = await db
      .from("profiles")
      .select("id")
      .eq("location_id", locationId)
      .neq("role", "client")
      .contains("services_trained", [svc.category])
      .limit(1)
      .maybeSingle();
    therapistId = tech?.id ?? null;
  }

  const start = new Date(iso);
  const end = new Date(start.getTime() + (svc.duration_minutes ?? 30) * 60000);
  const { data: appt, error } = await db
    .from("appointments")
    .insert({
      location_id: locationId,
      room_id: room?.id ?? null,
      therapist_id: therapistId,
      client_id: clientId,
      service_id: serviceId,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: "booked",
      source: "whatsapp",
    })
    .select("id")
    .single();
  if (error || !appt) return null; // e.g. slot/station overlap rejected by exclusion constraint
  return { id: appt.id, serviceName: svc.name, locationName: shortLoc(loc.name) };
}

const isGreeting = (t: string) => /\b(hi|hello|hey|book|menu|start|hie)\b/i.test(t);

export async function handleInbound(input: { from: string; name?: string; text?: string; replyId?: string }) {
  const { from, name, text, replyId } = input;
  const db = createAdminClient();
  const client = await ensureClient(from, name);
  const clientId = client?.id ?? null;
  await log(clientId, "inbound", replyId ?? text ?? "", "booking_flow");

  const welcome = async () => {
    await sendButtons(from, `Welcome to Craig's Saloon 💈\nHow can I help you today, ${client?.name?.split(" ")[0] ?? "there"}?`, [
      { id: "menu_book", title: "Book Appointment" },
      { id: "menu_bookings", title: "My Bookings" },
      { id: "menu_help", title: "Talk to Us" },
    ]);
    await log(clientId, "outbound", "welcome menu", "booking_flow");
  };

  // ---- interactive replies ----
  if (replyId) {
    // 1) start booking → choose a saloon
    if (replyId === "menu_book") {
      const { data: locs } = await db.from("locations").select("id, name, address").eq("status", "active").order("name");
      const rows = (locs ?? []).map((l) => ({ id: `loc:${l.id}`, title: shortLoc(l.name), description: l.address ?? undefined }));
      if (!rows.length) {
        await sendText(from, "We're setting up our saloons — please try again soon.");
        return;
      }
      await sendList(from, "Which saloon would you like to visit?", "Choose a saloon", rows);
      return;
    }

    if (replyId === "menu_help") {
      await sendText(from, "No problem — one of our team will get back to you shortly. You can also reply BOOK anytime to make an appointment.");
      await log(clientId, "outbound", "human handoff requested", "human_handoff");
      return;
    }

    if (replyId === "menu_bookings") {
      const { data: appts } = await db
        .from("appointments")
        .select("scheduled_start, services(name), locations(name)")
        .eq("client_id", clientId!)
        .gte("scheduled_start", new Date().toISOString())
        .order("scheduled_start")
        .limit(5);
      if (appts && appts.length) {
        const lines = appts.map((a) => {
          const s = a.services as unknown as { name?: string } | null;
          const l = a.locations as unknown as { name?: string } | null;
          return `• ${new Date(a.scheduled_start).toLocaleString()} — ${s?.name ?? "Appointment"} at ${shortLoc(l?.name)}`;
        });
        await sendText(from, `Your upcoming visits:\n${lines.join("\n")}`);
      } else {
        await sendText(from, "You have no upcoming bookings. Reply BOOK to schedule one.");
      }
      await log(clientId, "outbound", "my bookings", "self_service");
      return;
    }

    // 2) saloon chosen → choose a category
    if (replyId.startsWith("loc:")) {
      const locId = replyId.slice(4);
      await sendList(from, "Great. What would you like done?", "Choose a category", CATEGORIES.map((c) => ({ id: `cat:${locId}:${c.key}`, title: c.label })));
      return;
    }

    // 3) category chosen → choose a service
    if (replyId.startsWith("cat:")) {
      const [locId, cat] = replyId.slice(4).split(":");
      const { data: services } = await db
        .from("services")
        .select("id, name, base_price, duration_minutes")
        .eq("category", cat as Database["public"]["Enums"]["service_category"])
        .eq("is_active", true);
      const rows = (services ?? []).map((s) => ({ id: `svc:${locId}:${s.id}`, title: s.name, description: `${money(Number(s.base_price))} · ${s.duration_minutes} min` }));
      if (!rows.length) {
        await sendText(from, "No services available in that category yet.");
        return;
      }
      await sendList(from, "Here's what we offer:", "Select a service", rows);
      return;
    }

    // 4) service chosen → choose a time
    if (replyId.startsWith("svc:")) {
      const [locId, serviceId] = replyId.slice(4).split(":");
      const slots = nextSlots();
      await sendList(from, "Great choice 💈 Pick a time:", "Available times", slots.map((s) => ({ id: `slot:${locId}:${serviceId}:${s.iso}`, title: s.label })));
      return;
    }

    // 5) slot chosen → confirm
    if (replyId.startsWith("slot:")) {
      const { locId, serviceId, iso } = parseSel(replyId.slice(5));
      await sendButtons(from, `Confirm your booking for ${new Date(iso).toLocaleString()}?`, [
        { id: `confirm:${locId}:${serviceId}:${iso}`, title: "Confirm booking" },
        { id: `svc:${locId}:${serviceId}`, title: "Change time" },
      ]);
      return;
    }

    // 6) confirmed → create the booking
    if (replyId.startsWith("confirm:")) {
      const { locId, serviceId, iso } = parseSel(replyId.slice(8));
      const booking = await createBooking(locId, serviceId, iso, clientId!);
      if (booking) {
        await sendText(
          from,
          `You're booked! 🎉 ${booking.serviceName} at Craig's ${booking.locationName} on ${new Date(iso).toLocaleString()}. You'll get a reminder 24 hours and 1 hour before. Reply CHANGE to reschedule or CANCEL anytime.`
        );
        await log(clientId, "outbound", `booked ${booking.id}`, "completed");
      } else {
        await sendText(from, "Sorry, that time just became unavailable. Please reply BOOK to pick another slot, or call the saloon.");
      }
      return;
    }
  }

  // ---- free text ----
  if (text && isGreeting(text)) {
    await welcome();
    return;
  }

  // fallback → offer the menu, flag for human if needed
  await sendText(from, "I can help you book an appointment or check your bookings. Reply BOOK to begin, or we'll connect you with the saloon.");
  await log(clientId, "outbound", "fallback", "human_handoff");
}
