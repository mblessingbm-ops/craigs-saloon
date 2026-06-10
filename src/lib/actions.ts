"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/database.types";
import { localDateKey, dayStart, addDaysKey, weekdayMon0 } from "@/lib/tz";
import { slotError, asHours } from "@/lib/hours";
import { normalizePhone } from "@/lib/format";
import { sendText } from "@/lib/whatsapp/send";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/database.types";
import crypto from "node:crypto";

type SB = Awaited<ReturnType<typeof createClient>>;

/** Append an entry to the audit trail (best-effort). */
async function logAudit(
  supabase: SB,
  actor: string,
  action: string,
  entity: string,
  entityId: string | null,
  detail?: Record<string, unknown>
) {
  try {
    await supabase
      .from("audit_log")
      .insert({ actor, action, entity, entity_id: entityId, detail: (detail ?? null) as Json });
  } catch (e) {
    console.error("[audit] failed", action, e);
  }
}

/* ---------- Diary: create an appointment ---------- */
export async function createAppointment(input: {
  serviceId: string;
  roomId: string;
  therapistId: string;
  clientId?: string;
  newClientName?: string;
  newClientPhone?: string;
  time: string; // "HH:MM"
  date?: string; // "YYYY-MM-DD" (studio-local); defaults to today
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // The appointment's location is the station's location — never assume "the
  // first location". (RLS also requires location_id to match the admin's saloon.)
  const { data: room } = await supabase
    .from("rooms")
    .select("location_id, locations(operating_hours)")
    .eq("id", input.roomId)
    .single();
  if (!room) return { error: "Pick a station for this appointment." };
  const hours = asHours((room.locations as { operating_hours?: unknown } | null)?.operating_hours);

  const { data: svc } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", input.serviceId)
    .single();
  const duration = svc?.duration_minutes ?? 30;

  // resolve / create the client (normalize phone to avoid duplicates)
  let clientId = input.clientId;
  if (!clientId && input.newClientName && input.newClientPhone) {
    const phone = normalizePhone(input.newClientPhone);
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle();
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: created, error: cErr } = await supabase
        .from("clients")
        .insert({ name: input.newClientName, phone_number: phone })
        .select("id")
        .single();
      if (cErr) return { error: cErr.message };
      clientId = created.id;
    }
  }
  if (!clientId) return { error: "Pick a client or enter a walk-in name and number" };

  const tKey = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : localDateKey();
  const start = new Date(`${tKey}T${input.time}:00+02:00`);
  const end = new Date(start.getTime() + duration * 60000);

  const se = slotError(start, hours, duration);
  if (se) return { error: se };

  const { error } = await supabase.from("appointments").insert({
    location_id: room.location_id,
    room_id: input.roomId,
    therapist_id: input.therapistId,
    client_id: clientId,
    service_id: input.serviceId,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    status: "booked",
    source: "walk_in",
  });
  if (error) return { error: bookingError(error) };

  revalidatePath("/diary");
  return {};
}

/** Translate a Postgres exclusion-constraint violation into a friendly message. */
function bookingError(error: { code?: string; message?: string }): string {
  const msg = error.message ?? "";
  if (msg.includes("appointments_no_therapist_overlap")) {
    return "That technician is already booked for an overlapping time. Pick another time or technician.";
  }
  if (error.code === "23P01" || msg.includes("appointments_no_room_overlap")) {
    return "That station is already booked for an overlapping time. Pick another time or station.";
  }
  return msg || "Could not save the appointment.";
}

/* ---------- Diary: reschedule (time / room) ---------- */
export async function rescheduleAppointment(input: {
  id: string;
  time: string; // "HH:MM"
  roomId: string;
  durationMin: number;
  date?: string; // "YYYY-MM-DD" (studio-local); defaults to today
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("locations(operating_hours)")
    .eq("id", input.roomId)
    .single();
  const hours = asHours((room?.locations as { operating_hours?: unknown } | null)?.operating_hours);
  const tKey = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : localDateKey();
  const start = new Date(`${tKey}T${input.time}:00+02:00`);
  const end = new Date(start.getTime() + input.durationMin * 60000);
  const se = slotError(start, hours, input.durationMin);
  if (se) return { error: se };
  const { error } = await supabase
    .from("appointments")
    .update({
      room_id: input.roomId,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: "booked",
    })
    .eq("id", input.id);
  if (error) return { error: bookingError(error) };
  revalidatePath("/diary");
  return {};
}

/* ---------- Diary: cancel ---------- */
export async function cancelAppointment(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: error.message };
  if (user) await logAudit(supabase, user.id, "cancel_appointment", "appointment", id);
  revalidatePath("/diary");
  revalidatePath("/");
  return {};
}

/* ---------- Diary: advance / complete an appointment ---------- */
export async function updateAppointmentStatus(
  id: string,
  status: "checked_in" | "in_progress" | "completed" | "no_show" | "cancelled",
  extra?: { amount?: number; payment?: "cash" | "card" | "mobile_money"; notes?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const patch: TablesUpdate<"appointments"> = { status };
  if (status === "completed") {
    // clamp: takings are never negative; cap absurd values (guards reconciliation/revenue)
    const amt = Number(extra?.amount);
    patch.amount_charged = Number.isFinite(amt) ? Math.min(Math.max(amt, 0), 100000) : 0;
    patch.payment_method = extra?.payment ?? "cash";
    if (extra?.notes) patch.notes = extra.notes;
  }
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  if (error) return { error: error.message };

  if (status === "completed" && user) {
    await logAudit(supabase, user.id, "complete_appointment", "appointment", id, {
      amount: extra?.amount ?? 0,
      payment: extra?.payment ?? "cash",
    });
  }

  revalidatePath("/diary");
  revalidatePath("/");
  revalidatePath("/close");
  return {};
}

/* ---------- Clients: right-to-erasure (owner only) ---------- */
export async function deleteClient(clientId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "owner") return { error: "Only the owner can delete a client record." };

  // deleting the client cascades WhatsApp conversations; appointments keep the
  // row but are de-identified (client_id -> null).
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { error: error.message };

  await logAudit(supabase, user.id, "delete_client", "client", clientId);
  revalidatePath("/clients");
  return {};
}

/* ---------- Staff: owner-only onboarding (unique credentials) ---------- */
export async function createStaff(input: {
  fullName: string;
  email: string;
  role: "admin" | "technician";
  services: Database["public"]["Enums"]["service_category"][];
}): Promise<{ error?: string; password?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { data: me } = await supabase.from("profiles").select("role, location_id").eq("id", user.id).single();
  if (me?.role !== "owner") return { error: "Only the owner can add staff" };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Server not configured for staff creation (missing service role key)." };
  }

  const short = input.fullName.trim().split(" ")[0];
  const password = "CS-" + crypto.randomUUID().slice(0, 8) + "!";
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, short_name: short, role: input.role },
  });
  if (error) return { error: error.message };

  await admin
    .from("profiles")
    .update({ location_id: me?.location_id ?? null, services_trained: input.services })
    .eq("id", created.user.id);

  await logAudit(supabase, user.id, "create_staff", "profile", created.user.id, {
    email: input.email,
    role: input.role,
  });

  revalidatePath("/staff");
  return { password };
}

/* ---------- Analytics: export the period's transactions as CSV ---------- */
export async function exportReport(
  period: "today" | "week" | "month"
): Promise<{ csv?: string; filename?: string; error?: string }> {
  const supabase = await createClient();
  const tKey = localDateKey();
  let start: Date;
  if (period === "today") {
    start = dayStart(tKey);
  } else if (period === "week") {
    start = dayStart(addDaysKey(tKey, -weekdayMon0(tKey)));
  } else {
    start = dayStart(`${tKey.slice(0, 7)}-01`);
  }
  const startIso = start.toISOString();

  const [apptRes, salesRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("scheduled_start, amount_charged, payment_method, clients(name), services(name), profiles(short_name, full_name)")
      .eq("status", "completed")
      .gte("scheduled_start", startIso)
      .order("scheduled_start"),
    supabase
      .from("product_sales")
      .select("created_at, quantity, total, payment_method, products(name), profiles(short_name, full_name)")
      .gte("created_at", startIso)
      .order("created_at"),
  ]);

  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: string[] = ["Date,Type,Item,Client/Qty,Staff,Payment,Amount"];

  for (const a of apptRes.data ?? []) {
    const cl = a.clients as unknown as { name?: string } | null;
    const sv = a.services as unknown as { name?: string } | null;
    const pr = a.profiles as unknown as { short_name?: string; full_name?: string } | null;
    rows.push(
      [
        a.scheduled_start.slice(0, 16).replace("T", " "),
        "Treatment",
        esc(sv?.name),
        esc(cl?.name),
        esc(pr?.short_name ?? pr?.full_name),
        a.payment_method ?? "",
        Number(a.amount_charged).toFixed(2),
      ].join(",")
    );
  }
  for (const s of salesRes.data ?? []) {
    const pd = s.products as unknown as { name?: string } | null;
    const pr = s.profiles as unknown as { short_name?: string; full_name?: string } | null;
    rows.push(
      [
        s.created_at.slice(0, 16).replace("T", " "),
        "Retail",
        esc(pd?.name),
        `${s.quantity}`,
        esc(pr?.short_name ?? pr?.full_name),
        s.payment_method ?? "",
        Number(s.total).toFixed(2),
      ].join(",")
    );
  }

  return {
    csv: rows.join("\n"),
    filename: `craigs-saloon-${period}-${tKey}.csv`,
  };
}

/* ---------- Station-level reconciliation (Phase 1) ---------- */
export async function saveStationReconciliation(input: {
  locationId: string;
  lines: { stationId: string; till: number; note?: string }[];
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: me } = await supabase.from("profiles").select("role, location_id").eq("id", user.id).single();
  const allowed = me?.role === "owner" || (me?.role === "admin" && me?.location_id === input.locationId);
  if (!allowed) return { error: "You can only reconcile your own saloon." };

  const tKey = localDateKey();
  const start = dayStart(tKey).toISOString();
  const end = dayStart(addDaysKey(tKey, 1)).toISOString();

  // recompute system totals per station server-side (never trust the client)
  const { data: appts } = await supabase
    .from("appointments")
    .select("amount_charged, room_id, payment_method")
    .eq("status", "completed")
    .eq("location_id", input.locationId)
    .gte("scheduled_start", start)
    .lt("scheduled_start", end);
  const sysByStation = new Map<string, number>();
  let systemTotal = 0;
  // electronic methods (card / mobile money) auto-reconcile to the system figure;
  // the physical till count is the cash drawer, so any variance lands on cash
  let cardSystem = 0;
  let mobileSystem = 0;
  for (const a of appts ?? []) {
    const amt = Number(a.amount_charged) || 0;
    systemTotal += amt;
    if (a.payment_method === "card") cardSystem += amt;
    else if (a.payment_method === "mobile_money") mobileSystem += amt;
    if (a.room_id) sysByStation.set(a.room_id, (sysByStation.get(a.room_id) ?? 0) + amt);
  }

  // every station that took money today must be counted — otherwise its takings
  // could be silently dropped and the day closed "matched" with a hidden variance
  const submitted = new Set(input.lines.map((l) => l.stationId));
  for (const [stationId, sys] of sysByStation) {
    if (sys > 0 && !submitted.has(stationId)) {
      return { error: "Every station with takings must be counted before closing the day." };
    }
  }

  // every station with a variance needs a resolution note
  for (const l of input.lines) {
    const sys = sysByStation.get(l.stationId) ?? 0;
    if ((Number(l.till) || 0) !== sys && (!l.note || l.note.trim().length < 3)) {
      return { error: "Add a note to each station with a variance before closing." };
    }
  }
  const tillTotal = input.lines.reduce((s, l) => s + (Number(l.till) || 0), 0);
  const allMatched = input.lines.every((l) => (Number(l.till) || 0) === (sysByStation.get(l.stationId) ?? 0));

  const { data: parent, error: pErr } = await supabase
    .from("daily_reconciliation")
    .upsert(
      {
        location_id: input.locationId,
        business_date: tKey,
        service_total: systemTotal,
        retail_total: 0,
        system_total: systemTotal,
        // preserve the cash/card/mobile split: electronic at system value, the
        // remainder (and any variance) attributed to the counted cash drawer
        counted_cash: tillTotal - cardSystem - mobileSystem,
        counted_card: cardSystem,
        counted_mobile: mobileSystem,
        variance_status: allMatched ? "matched" : "resolved",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "location_id,business_date" }
    )
    .select("id")
    .single();
  if (pErr || !parent) return { error: pErr?.message ?? "Could not save reconciliation" };

  const rows = input.lines.map((l) => {
    const sys = sysByStation.get(l.stationId) ?? 0;
    const matched = (Number(l.till) || 0) === sys;
    return {
      reconciliation_id: parent.id,
      station_id: l.stationId,
      system_total: sys,
      till_total: Number(l.till) || 0,
      variance_status: (matched ? "matched" : "resolved") as "matched" | "resolved",
      resolution_note: matched ? null : l.note ?? null,
    };
  });
  if (rows.length) {
    const { error: lErr } = await supabase.from("reconciliation_lines").upsert(rows, { onConflict: "reconciliation_id,station_id" });
    if (lErr) return { error: lErr.message };
  }

  // best-effort owner summary
  try {
    const variance = tillTotal - systemTotal;
    const { data: owner } = await supabase.from("profiles").select("phone").eq("role", "owner").not("phone", "is", null).maybeSingle();
    if (owner?.phone) {
      const m = (n: number) => "$" + Math.round(n);
      await sendText(
        owner.phone,
        `Craig's Saloon — ${tKey} reconciliation saved.\nSystem ${m(systemTotal)}, Till ${m(tillTotal)}.\n${allMatched ? "All stations matched ✓" : `Variance ${m(variance)} — flagged`}`
      );
    }
  } catch (e) {
    console.error("[saveStationReconciliation] summary send failed", e);
  }

  await logAudit(supabase, user.id, "close_day", "daily_reconciliation", input.locationId, {
    business_date: tKey,
    system_total: systemTotal,
    till_total: tillTotal,
    matched: allMatched,
  });
  revalidatePath("/close");
  return {};
}

export async function reopenStationDay(locationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { data: me } = await supabase.from("profiles").select("role, location_id").eq("id", user.id).single();
  const allowed = me?.role === "owner" || (me?.role === "admin" && me?.location_id === locationId);
  if (!allowed) return { error: "You can only reopen your own saloon." };
  const tKey = localDateKey();
  const { data: parent, error } = await supabase
    .from("daily_reconciliation")
    .update({ confirmed_at: null })
    .eq("location_id", locationId)
    .eq("business_date", tKey)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  // clear the saved station lines so re-counting starts fresh against the
  // (possibly changed) system totals — otherwise stale till counts persist.
  if (parent) await supabase.from("reconciliation_lines").delete().eq("reconciliation_id", parent.id);
  await logAudit(supabase, user.id, "reopen_day", "daily_reconciliation", locationId, { business_date: tKey });
  revalidatePath("/close");
  return {};
}
