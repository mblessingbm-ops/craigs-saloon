import { createClient } from "@/lib/supabase/server";
import { avatarClass, CATEGORY_LABEL } from "@/lib/format";
import { localDateKey, localDayOf, dayStart, addDaysKey, weekdayMon0, ymOf, STUDIO_TZ } from "@/lib/tz";
import { buildPeriod, type Txn, type DashboardData, type DashPeriod, type DashTherapist } from "@/lib/analytics";

export type { DashboardData, DashPeriod, DashTherapist };


/* ---------- date helpers (studio-local, Africa/Harare) ---------- */
const dayKey = (iso: string) => localDayOf(iso);
const todayKey = () => localDateKey();
const harareHour = (iso: string) =>
  Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TZ, hour: "2-digit", hour12: false }).format(
      new Date(iso)
    )
  );


// all display dates render in the studio's timezone (Africa/Harare), so labels
// never show the wrong day near midnight or shift for an out-of-zone viewer
const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TZ, day: "numeric", month: "short" }).format(d);
const fmtMonthYear = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: STUDIO_TZ, month: "long", year: "numeric" }).format(d);

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 70);
  const sinceIso = since.toISOString();

  const [apptRes, clientsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("amount_charged, payment_method, scheduled_start, therapist_id, client_id, location_id, services(category), profiles(short_name, full_name, role), locations(name)")
      .eq("status", "completed")
      .gte("scheduled_start", sinceIso),
    supabase.from("clients").select("created_at").gte("created_at", sinceIso),
  ]);

  const appts = apptRes.data ?? [];
  const clientRows = clientsRes.data ?? [];

  const txns: Txn[] = [];
  for (const a of appts) {
    const svc = a.services as { category?: string } | null;
    const ther = a.profiles as { short_name?: string; full_name?: string; role?: string } | null;
    const loc = a.locations as { name?: string } | null;
    txns.push({
      date: dayKey(a.scheduled_start),
      ts: a.scheduled_start,
      amount: Number(a.amount_charged) || 0,
      kind: "service",
      category: svc?.category,
      payment: a.payment_method ?? undefined,
      therapistId: a.therapist_id,
      therapistShort: ther?.short_name ?? ther?.full_name?.split(" ")[0],
      therapistRole: ther?.role,
      locationId: a.location_id,
      locationName: loc?.name?.replace("Craig's Saloon — ", ""),
      clientId: a.client_id,
    });
  }

  // ranges (all anchored to the studio's local day, Africa/Harare)
  const now = new Date();
  const tKey = todayKey();
  const todayStart = dayStart(tKey);
  const todayEnd = dayStart(addDaysKey(tKey, 1));
  const ydayStart = dayStart(addDaysKey(tKey, -1));

  const weekStartKey = addDaysKey(tKey, -weekdayMon0(tKey));
  const weekStart = dayStart(weekStartKey);
  const weekEnd = dayStart(addDaysKey(weekStartKey, 7));
  const prevWeekStart = dayStart(addDaysKey(weekStartKey, -7));

  const { year, month } = ymOf(tKey);
  const monthStartKeyStr = `${tKey.slice(0, 7)}-01`;
  const monthStart = dayStart(monthStartKeyStr);
  const nextMonthKey = `${month === 11 ? year + 1 : year}-${String((month + 1) % 12 + 1).padStart(2, "0")}-01`;
  const monthEnd = dayStart(nextMonthKey);
  const prevMonthKey = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}-01`;
  const prevMonthStart = dayStart(prevMonthKey);

  const newClientsIn = (start: Date, end: Date) =>
    clientRows.filter((c) => {
      const d = new Date(c.created_at).getTime();
      return d >= start.getTime() && d < end.getTime();
    }).length;

  // series: today cumulative by Harare hour 9..18
  const todayTx = txns.filter((t) => t.date === tKey).sort((a, b) => a.ts.localeCompare(b.ts));
  const hourLabels = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
  let run = 0;
  let ti = 0;
  const todaySeries = hourLabels.map((_, i) => {
    const hourEnd = 9 + i + 1;
    while (ti < todayTx.length && harareHour(todayTx[ti].ts) < hourEnd) {
      run += todayTx[ti].amount;
      ti++;
    }
    return run;
  });

  // series: week daily Mon..Sun
  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const weekSeries = weekLabels.map((_, i) => {
    const k = addDaysKey(weekStartKey, i);
    return txns.filter((t) => t.date === k).reduce((a, t) => a + t.amount, 0);
  });

  // series: month weekly buckets
  const monthTx = txns.filter((t) => {
    const d = new Date(t.ts).getTime();
    return d >= monthStart.getTime() && d < monthEnd.getTime();
  });
  const weekBuckets: number[] = [];
  const weekBucketLabels: string[] = [];
  {
    let cursorKey = addDaysKey(monthStartKeyStr, -weekdayMon0(monthStartKeyStr));
    let wk = 1;
    while (dayStart(cursorKey).getTime() < monthEnd.getTime()) {
      const nextKey = addDaysKey(cursorKey, 7);
      const cur = dayStart(cursorKey).getTime();
      const nxt = dayStart(nextKey).getTime();
      weekBuckets.push(
        monthTx
          .filter((t) => {
            const d = new Date(t.ts).getTime();
            return d >= cur && d < nxt;
          })
          .reduce((a, t) => a + t.amount, 0)
      );
      weekBucketLabels.push("W" + wk);
      cursorKey = nextKey;
      wk++;
    }
  }

  return {
    today: buildPeriod(
      txns,
      { start: todayStart, end: todayEnd },
      { start: ydayStart, end: todayStart },
      { label: "Today", sub: fmtDay(now), deltaLabel: "vs yesterday" },
      newClientsIn(todayStart, todayEnd),
      { values: todaySeries, labels: hourLabels }
    ),
    week: buildPeriod(
      txns,
      { start: weekStart, end: weekEnd },
      { start: prevWeekStart, end: weekStart },
      { label: "This Week", sub: `${fmtDay(weekStart)}–${fmtDay(new Date(weekEnd.getTime() - 86400000))}`, deltaLabel: "vs last week" },
      newClientsIn(weekStart, weekEnd),
      { values: weekSeries, labels: weekLabels }
    ),
    month: buildPeriod(
      txns,
      { start: monthStart, end: monthEnd },
      { start: prevMonthStart, end: monthStart },
      { label: "This Month", sub: fmtMonthYear(now), deltaLabel: "vs last month" },
      newClientsIn(monthStart, monthEnd),
      { values: weekBuckets, labels: weekBucketLabels }
    ),
  };
}

/* ============================================================
   DIARY
   ============================================================ */
export interface DiaryRoom {
  id: string;
  name: string;
  cat: string;
  location: string; // saloon short name — lets the owner tell stations apart across locations
}
export interface DiaryAppt {
  id: string;
  clientId: string | null;
  start: string;
  end: string;
  client: string;
  service: string;
  cat: string;
  roomId: string;
  therapistShort: string;
  therapistAvatar: string;
  status: string;
  price: number;
}

export async function getDiary(): Promise<{ rooms: DiaryRoom[]; appts: DiaryAppt[] }> {
  const supabase = await createClient();
  const tKey = todayKey();
  const start = dayStart(tKey).toISOString();
  const end = dayStart(addDaysKey(tKey, 1)).toISOString();

  const [roomsRes, apptRes] = await Promise.all([
    supabase.from("rooms").select("id, name, service_category, location_id, locations(name)").order("location_id").order("created_at"),
    supabase
      .from("appointments")
      .select(
        "id, client_id, scheduled_start, scheduled_end, status, room_id, clients(name), services(name, category, base_price), profiles(short_name, full_name, id)"
      )
      .gte("scheduled_start", start)
      .lt("scheduled_start", end)
      .order("scheduled_start"),
  ]);

  const rooms: DiaryRoom[] = (roomsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    cat: r.service_category,
    location: ((r.locations as { name?: string } | null)?.name ?? "").replace("Craig's Saloon — ", ""),
  }));

  const appts: DiaryAppt[] = (apptRes.data ?? []).map((a) => {
    const client = a.clients as { name?: string } | null;
    const svc = a.services as { name?: string; category?: string; base_price?: number } | null;
    const ther = a.profiles as { short_name?: string; full_name?: string; id?: string } | null;
    return {
      id: a.id,
      clientId: a.client_id,
      start: a.scheduled_start,
      end: a.scheduled_end,
      client: client?.name ?? "Walk-in",
      service: svc?.name ?? "Service",
      cat: svc?.category ?? "general",
      roomId: a.room_id ?? "",
      therapistShort: ther?.short_name ?? ther?.full_name?.split(" ")[0] ?? "—",
      therapistAvatar: avatarClass(ther?.id ?? a.id),
      status: a.status,
      price: Number(svc?.base_price) || 0,
    };
  });

  return { rooms, appts };
}

/* ============================================================
   CLIENTS
   ============================================================ */
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
};

export interface ClientListRow {
  id: string;
  name: string;
  visits: number;
  lastVisit: string | null;
  hasNotes: boolean;
}

export async function getClients(): Promise<ClientListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, total_visits, last_visit_date, skin_notes")
    .order("total_visits", { ascending: false });

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "Unnamed",
    visits: c.total_visits,
    lastVisit: c.last_visit_date ? fmtDate(c.last_visit_date) : null,
    hasNotes: !!c.skin_notes,
  }));
}

export interface ClientCardData {
  id: string;
  name: string;
  phone: string;
  since: string;
  visits: number;
  lastVisit: string;
  preferredTech: string | null;
  preferredLocation: string | null;
  notes: string | null;
  history: { date: string; service: string; who: string; location: string; amount: number }[];
}

export async function getClientCard(id: string): Promise<ClientCardData | null> {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("clients")
    .select("id, name, phone_number, created_at, total_visits, last_visit_date, skin_notes, profiles(short_name, full_name)")
    .eq("id", id)
    .single();
  if (!c) return null;

  // visit history = the client's completed appointments
  const { data: appts } = await supabase
    .from("appointments")
    .select("scheduled_start, amount_charged, services(name), profiles(short_name, full_name), locations(name)")
    .eq("client_id", id)
    .eq("status", "completed")
    .order("scheduled_start", { ascending: false })
    .limit(12);

  const pref = c.profiles as { short_name?: string; full_name?: string } | null;

  // usual saloon = the location they've completed the most visits at
  const locCount = new Map<string, number>();
  const history = (appts ?? []).map((a) => {
    const svc = a.services as { name?: string } | null;
    const ther = a.profiles as { short_name?: string; full_name?: string } | null;
    const loc = a.locations as { name?: string } | null;
    const locName = (loc?.name ?? "").replace("Craig's Saloon — ", "");
    if (locName) locCount.set(locName, (locCount.get(locName) ?? 0) + 1);
    return {
      date: fmtDate(a.scheduled_start),
      service: svc?.name ?? "Service",
      who: ther?.short_name ?? ther?.full_name?.split(" ")[0] ?? "—",
      location: locName,
      amount: Number(a.amount_charged) || 0,
    };
  });
  const preferredLocation = [...locCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    id: c.id,
    name: c.name ?? "Unnamed",
    phone: c.phone_number,
    since: fmtDate(c.created_at),
    visits: c.total_visits,
    lastVisit: c.last_visit_date ? fmtDate(c.last_visit_date) : "—",
    preferredTech: pref?.short_name ?? pref?.full_name?.split(" ")[0] ?? null,
    preferredLocation,
    notes: c.skin_notes,
    history,
  };
}


export interface StaffPerf {
  id: string;
  name: string;
  role: string;
  avatar: string;
  services: string[];
  revenue: number;
  clients: number;
}

export async function getStaff(): Promise<StaffPerf[]> {
  const supabase = await createClient();
  // first of the month anchored to the studio's local day (Africa/Harare), to
  // match the dashboard's month range (a plain UTC boundary drops 00:00–02:00 on the 1st)
  const monthStart = dayStart(`${localDateKey().slice(0, 7)}-01`).toISOString();

  const [profRes, apptRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, short_name, role, services_trained").neq("role", "client").order("full_name"),
    supabase
      .from("appointments")
      .select("therapist_id, amount_charged, client_id")
      .eq("status", "completed")
      .gte("scheduled_start", monthStart),
  ]);

  const revByTher = new Map<string, number>();
  const cliByTher = new Map<string, Set<string>>();
  for (const a of apptRes.data ?? []) {
    if (!a.therapist_id) continue;
    revByTher.set(a.therapist_id, (revByTher.get(a.therapist_id) ?? 0) + (Number(a.amount_charged) || 0));
    if (a.client_id) {
      const set = cliByTher.get(a.therapist_id) ?? new Set<string>();
      set.add(a.client_id);
      cliByTher.set(a.therapist_id, set);
    }
  }
  return (profRes.data ?? [])
    .map((p) => ({
      id: p.id,
      name: p.short_name ?? p.full_name,
      role: p.role,
      avatar: avatarClass(p.id),
      services: (p.services_trained ?? []) as string[],
      revenue: revByTher.get(p.id) ?? 0,
      clients: cliByTher.get(p.id)?.size ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* ============================================================
   BOOKING OPTIONS (for the diary quick-add)
   ============================================================ */
export interface BookingOptions {
  services: { id: string; name: string; category: string; duration: number; price: number }[];
  rooms: { id: string; name: string; cat: string }[];
  therapists: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}

export async function getBookingOptions(): Promise<BookingOptions> {
  const supabase = await createClient();
  const [svcRes, roomRes, therRes, cliRes] = await Promise.all([
    supabase.from("services").select("id, name, category, duration_minutes, base_price").eq("is_active", true).order("category"),
    supabase.from("rooms").select("id, name, service_category").eq("status", "active").order("created_at"),
    supabase.from("profiles").select("id, short_name, full_name").neq("role", "client").eq("is_active", true).order("full_name"),
    supabase.from("clients").select("id, name").eq("status", "active").order("name"),
  ]);

  return {
    services: (svcRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      duration: s.duration_minutes,
      price: Number(s.base_price),
    })),
    rooms: (roomRes.data ?? []).map((r) => ({ id: r.id, name: r.name, cat: r.service_category })),
    therapists: (therRes.data ?? []).map((t) => ({ id: t.id, name: t.short_name ?? t.full_name?.split(" ")[0] ?? "—" })),
    clients: (cliRes.data ?? []).map((c) => ({ id: c.id, name: c.name ?? "Unnamed" })),
  };
}

/* ============================================================
   RECONCILIATION — shared date helper
   ============================================================ */
const todayLabelLong = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());

/* ============================================================
   STATION-LEVEL RECONCILIATION (Phase 1)
   Per-station System-vs-Till variance for one location's day.
   ============================================================ */
export interface StationReconRow {
  stationId: string;
  name: string;
  systemTotal: number;
  tillTotal: number;
  variance: number;
  status: "matched" | "flagged" | "resolved" | null;
  note: string | null;
  saved: boolean;
}
export interface StationReconData {
  date: string;
  locationId: string;
  locationName: string;
  systemTotal: number;
  tillTotal: number;
  variance: number;
  clients: number;
  stations: StationReconRow[];
  closed: boolean;
}

export async function getStationReconciliation(locationId: string): Promise<StationReconData> {
  const supabase = await createClient();
  const tKey = todayKey();
  const start = dayStart(tKey).toISOString();
  const end = dayStart(addDaysKey(tKey, 1)).toISOString();

  const [locRes, roomsRes, apptRes, reconRes] = await Promise.all([
    supabase.from("locations").select("name").eq("id", locationId).maybeSingle(),
    supabase.from("rooms").select("id, name").eq("location_id", locationId).order("created_at"),
    supabase
      .from("appointments")
      .select("amount_charged, room_id, client_id")
      .eq("status", "completed")
      .eq("location_id", locationId)
      .gte("scheduled_start", start)
      .lt("scheduled_start", end),
    supabase
      .from("daily_reconciliation")
      .select("id, confirmed_at, reconciliation_lines(station_id, till_total, variance_status, resolution_note)")
      .eq("location_id", locationId)
      .eq("business_date", tKey)
      .maybeSingle(),
  ]);

  const sysByStation = new Map<string, number>();
  const clientSet = new Set<string>();
  let systemTotal = 0;
  for (const a of apptRes.data ?? []) {
    const amt = Number(a.amount_charged) || 0;
    systemTotal += amt;
    if (a.room_id) sysByStation.set(a.room_id, (sysByStation.get(a.room_id) ?? 0) + amt);
    if (a.client_id) clientSet.add(a.client_id);
  }

  const recon = reconRes.data;
  const closed = !!recon?.confirmed_at;
  const savedLines = new Map<string, { till: number; status: string; note: string | null }>();
  const lines = (recon?.reconciliation_lines ?? []) as { station_id: string | null; till_total: number; variance_status: string; resolution_note: string | null }[];
  for (const l of lines) {
    if (l.station_id) savedLines.set(l.station_id, { till: Number(l.till_total), status: l.variance_status, note: l.resolution_note });
  }

  let tillTotal = 0;
  const stations: StationReconRow[] = (roomsRes.data ?? []).map((r) => {
    const system = sysByStation.get(r.id) ?? 0;
    const saved = savedLines.get(r.id);
    const till = saved ? saved.till : system; // default till to system (matched) until counted
    tillTotal += till;
    return {
      stationId: r.id,
      name: r.name,
      systemTotal: system,
      tillTotal: till,
      variance: till - system,
      status: (saved?.status as StationReconRow["status"]) ?? null,
      note: saved?.note ?? null,
      saved: !!saved,
    };
  });

  return {
    date: todayLabelLong(),
    locationId,
    locationName: (locRes.data?.name ?? "").replace("Craig's Saloon — ", ""),
    systemTotal,
    tillTotal,
    variance: tillTotal - systemTotal,
    clients: clientSet.size,
    stations,
    closed,
  };
}

export interface LocationReconStatus {
  locationId: string;
  name: string;
  systemTotal: number;
  clients: number;
  status: "matched" | "pending" | "flagged";
}

export async function getReconOverview(): Promise<LocationReconStatus[]> {
  const supabase = await createClient();
  const tKey = todayKey();
  const start = dayStart(tKey).toISOString();
  const end = dayStart(addDaysKey(tKey, 1)).toISOString();

  const [locRes, apptRes, reconRes] = await Promise.all([
    supabase.from("locations").select("id, name").eq("status", "active").order("name"),
    supabase
      .from("appointments")
      .select("amount_charged, location_id, client_id")
      .eq("status", "completed")
      .gte("scheduled_start", start)
      .lt("scheduled_start", end),
    supabase.from("daily_reconciliation").select("location_id, confirmed_at, variance_status").eq("business_date", tKey),
  ]);

  const sys = new Map<string, number>();
  const cli = new Map<string, Set<string>>();
  for (const a of apptRes.data ?? []) {
    if (!a.location_id) continue;
    sys.set(a.location_id, (sys.get(a.location_id) ?? 0) + (Number(a.amount_charged) || 0));
    if (a.client_id) {
      const s = cli.get(a.location_id) ?? new Set<string>();
      s.add(a.client_id);
      cli.set(a.location_id, s);
    }
  }
  const reconByLoc = new Map<string, { confirmed: boolean; status: string }>();
  for (const r of reconRes.data ?? []) reconByLoc.set(r.location_id, { confirmed: !!r.confirmed_at, status: r.variance_status });

  return (locRes.data ?? []).map((l) => {
    const rec = reconByLoc.get(l.id);
    const status: LocationReconStatus["status"] = !rec || !rec.confirmed ? "pending" : rec.status === "matched" ? "matched" : "flagged";
    return {
      locationId: l.id,
      name: l.name.replace("Craig's Saloon — ", ""),
      systemTotal: sys.get(l.id) ?? 0,
      clients: cli.get(l.id)?.size ?? 0,
      status,
    };
  });
}

/* ============================================================
   LOCATION DETAIL (owner drill-down into one saloon — today)
   ============================================================ */
export interface LocationDetail {
  id: string;
  name: string;
  date: string;
  revenue: number;
  clients: number;
  appts: number;
  stations: number;
  byCategory: { key: string; label: string; value: number }[];
  byTechnician: { id: string; short: string; avatar: string; value: number; clients: number }[];
  reconStatus: "matched" | "pending" | "flagged";
}

export async function getLocationDetail(locationId: string): Promise<LocationDetail | null> {
  const supabase = await createClient();
  const tKey = todayKey();
  const start = dayStart(tKey).toISOString();
  const end = dayStart(addDaysKey(tKey, 1)).toISOString();

  const [locRes, apptRes, reconRes, stationsRes] = await Promise.all([
    supabase.from("locations").select("name").eq("id", locationId).maybeSingle(),
    supabase
      .from("appointments")
      .select("amount_charged, client_id, services(category), profiles(short_name, full_name, id)")
      .eq("status", "completed")
      .eq("location_id", locationId)
      .gte("scheduled_start", start)
      .lt("scheduled_start", end),
    supabase.from("daily_reconciliation").select("confirmed_at, variance_status").eq("location_id", locationId).eq("business_date", tKey).maybeSingle(),
    supabase.from("rooms").select("id", { count: "exact", head: true }).eq("location_id", locationId),
  ]);
  if (!locRes.data) return null;

  const appts = apptRes.data ?? [];
  let revenue = 0;
  const clientSet = new Set<string>();
  const catMap = new Map<string, number>();
  const techMap = new Map<string, { id: string; short: string; value: number; clients: Set<string> }>();
  for (const a of appts) {
    const amt = Number(a.amount_charged) || 0;
    revenue += amt;
    if (a.client_id) clientSet.add(a.client_id);
    const cat = (a.services as { category?: string } | null)?.category;
    if (cat) catMap.set(cat, (catMap.get(cat) ?? 0) + amt);
    const t = a.profiles as { short_name?: string; full_name?: string; id?: string } | null;
    if (t?.id) {
      const ex = techMap.get(t.id) ?? { id: t.id, short: t.short_name ?? t.full_name?.split(" ")[0] ?? "—", value: 0, clients: new Set<string>() };
      ex.value += amt;
      if (a.client_id) ex.clients.add(a.client_id);
      techMap.set(t.id, ex);
    }
  }

  const byCategory = [...catMap.entries()].map(([key, value]) => ({ key, label: CATEGORY_LABEL[key] ?? key, value })).sort((a, b) => b.value - a.value);
  const byTechnician = [...techMap.values()]
    .map((t) => ({ id: t.id, short: t.short, avatar: avatarClass(t.id), value: t.value, clients: t.clients.size }))
    .sort((a, b) => b.value - a.value);

  const rec = reconRes.data;
  const reconStatus: LocationDetail["reconStatus"] = !rec || !rec.confirmed_at ? "pending" : rec.variance_status === "matched" ? "matched" : "flagged";

  return {
    id: locationId,
    name: (locRes.data.name ?? "").replace("Craig's Saloon — ", ""),
    date: todayLabelLong(),
    revenue,
    clients: clientSet.size,
    appts: appts.length,
    stations: stationsRes.count ?? 0,
    byCategory,
    byTechnician,
    reconStatus,
  };
}
