"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { fmtTime, money } from "@/lib/format";
import { createAppointment, updateAppointmentStatus, rescheduleAppointment, cancelAppointment } from "@/lib/actions";
import { Sheet } from "@/components/Sheet";
import type { DiaryRoom, DiaryAppt, BookingOptions } from "@/lib/queries";

const statusLabel: Record<string, string> = {
  completed: "Done",
  in_progress: "In room",
  checked_in: "Checked in",
  booked: "Booked",
  no_show: "No-show",
  cancelled: "Cancelled",
};

const catDot: Record<string, string> = {
  hair: "#9a6f3a",
  nails: "#b0787e",
  barber: "#6d6450",
  beauty: "#6d9077",
  general: "#9d8d95",
};

const todayLabel = () =>
  "Today · " +
  new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Harare", weekday: "short", day: "numeric", month: "short" }).format(new Date());

const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function Diary({
  rooms,
  appts,
  options,
}: {
  rooms: DiaryRoom[];
  appts: DiaryAppt[];
  options: BookingOptions;
}) {
  const router = useRouter();
  const [room, setRoom] = useState("all");
  const [booking, setBooking] = useState(false);
  const [selected, setSelected] = useState<DiaryAppt | null>(null);
  const list = appts.filter((a) => room === "all" || a.roomId === room);
  // owner's calendar spans all 4 saloons — label stations/appointments by saloon so they're distinguishable
  const multiLoc = new Set(rooms.map((r) => r.location)).size > 1;
  const roomLoc = new Map(rooms.map((r) => [r.id, r.location]));

  return (
    <>
      <div className="diary-daybar">
        <div className="d">{todayLabel()}</div>
      </div>

      <div className="room-tabs">
        <button className="room-tab" data-on={room === "all" ? "1" : "0"} onClick={() => setRoom("all")}>
          All stations
        </button>
        {rooms.map((r) => (
          <button key={r.id} className="room-tab" data-on={room === r.id ? "1" : "0"} onClick={() => setRoom(r.id)}>
            <span className="ct" style={{ background: catDot[r.cat] ?? "var(--accent)" }} />
            {multiLoc && r.location ? `${r.location} · ${r.name}` : r.name}
          </button>
        ))}
      </div>

      <div className="timeline">
        <div className="tl-line" />
        {list.length === 0 && (
          <div className="faint" style={{ fontSize: 13, paddingTop: 8 }}>
            No appointments {room === "all" ? "today" : "at this station"}.
          </div>
        )}
        {list.map((a) => (
          <div className="tl-slot" key={a.id}>
            <div className="tl-time">{fmtTime(a.start)}</div>
            <div className="tl-dot" />
            <div className={"appt cat-" + a.cat} onClick={() => setSelected(a)}>
              <span className={"status status-abs " + a.status}>{statusLabel[a.status] ?? a.status}</span>
              <div className="cl">{a.client}</div>
              <div className="sv">{a.service}</div>
              <div className="tm">
                <span>
                  {fmtTime(a.start)} – {fmtTime(a.end)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span className={"avatar " + a.therapistAvatar} style={{ width: 18, height: 18, fontSize: 9 }}>
                    {a.therapistShort[0]}
                  </span>
                  {a.therapistShort}
                </span>
                {multiLoc && roomLoc.get(a.roomId) && <span className="mini-course">{roomLoc.get(a.roomId)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" aria-label="Add appointment" onClick={() => setBooking(true)}>
        <Icons.Plus size={26} />
      </button>

      {booking && (
        <BookingSheet
          options={options}
          rooms={rooms}
          onClose={() => setBooking(false)}
          onDone={() => {
            setBooking(false);
            router.refresh();
          }}
        />
      )}

      {selected && (
        <ApptSheet
          appt={selected}
          rooms={rooms}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

/* ---------- Booking sheet ---------- */
function BookingSheet({
  options,
  rooms,
  onClose,
  onDone,
}: {
  options: BookingOptions;
  rooms: DiaryRoom[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [serviceId, setServiceId] = useState(options.services[0]?.id ?? "");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [therapistId, setTherapistId] = useState(options.therapists[0]?.id ?? "");
  const [clientId, setClientId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [time, setTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createAppointment({
        serviceId,
        roomId,
        therapistId,
        clientId: clientId || undefined,
        newClientName: clientId ? undefined : newName,
        newClientPhone: clientId ? undefined : newPhone,
        time,
      });
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  return (
    <Sheet onClose={onClose}>
        <div className="sheet-title">New appointment</div>
        <div className="sheet-sub">Quick-add a booking to today&apos;s calendar.</div>

        {error && <div className="login-error">{error}</div>}

        <div className="field">
          <label>Service</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {options.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {money(s.price)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Station</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Technician</label>
          <select value={therapistId} onChange={(e) => setTherapistId(e.target.value)}>
            {options.therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">+ New walk-in…</option>
            {options.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {!clientId && (
          <>
            <div className="field">
              <label>Walk-in name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Client name" />
            </div>
            <div className="field">
              <label>Phone (WhatsApp)</label>
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+263…" />
            </div>
          </>
        )}

        <div className="field">
          <label>Time</label>
          <select value={time} onChange={(e) => setTime(e.target.value)}>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {fmtTime(`2000-01-01T${t}:00+02:00`)}
              </option>
            ))}
          </select>
        </div>

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={isPending}>
            {isPending ? "Booking…" : "Add to calendar"}
          </button>
        </div>
    </Sheet>
  );
}

/* ---------- Appointment status sheet ---------- */
const NEXT: Record<string, { status: "checked_in" | "in_progress" | "completed"; label: string } | null> = {
  booked: { status: "checked_in", label: "Check in" },
  checked_in: { status: "in_progress", label: "Start service" },
  in_progress: { status: "completed", label: "Mark complete" },
  completed: null,
  no_show: null,
  cancelled: null,
};

function ApptSheet({
  appt,
  rooms,
  onClose,
  onDone,
}: {
  appt: DiaryAppt;
  rooms: DiaryRoom[];
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const next = NEXT[appt.status];
  const [amount, setAmount] = useState(appt.price);
  const [payment, setPayment] = useState<"cash" | "card" | "mobile_money">("cash");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const durationMin = Math.max(15, Math.round((new Date(appt.end).getTime() - new Date(appt.start).getTime()) / 60000));
  const startHHMM = `${String(new Date(appt.start).getHours()).padStart(2, "0")}:${String(new Date(appt.start).getMinutes()).padStart(2, "0")}`;
  const [reschedule, setReschedule] = useState(false);
  const [rTime, setRTime] = useState(TIME_SLOTS.includes(startHHMM) ? startHHMM : "10:00");
  const [rRoom, setRRoom] = useState(appt.roomId || rooms[0]?.id || "");
  const [notes, setNotes] = useState("");
  const canModify = appt.status !== "completed" && appt.status !== "cancelled";

  const act = (status: "checked_in" | "in_progress" | "completed" | "no_show") => {
    setError(null);
    startTransition(async () => {
      const res = await updateAppointmentStatus(
        appt.id,
        status,
        status === "completed" ? { amount, payment, notes } : undefined
      );
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  const doReschedule = () => {
    setError(null);
    startTransition(async () => {
      const res = await rescheduleAppointment({ id: appt.id, time: rTime, roomId: rRoom, durationMin });
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  const doCancel = () => {
    setError(null);
    startTransition(async () => {
      const res = await cancelAppointment(appt.id);
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  return (
    <Sheet onClose={onClose}>
        <div className="sheet-title">{appt.client}</div>
        <div className="sheet-sub">
          {appt.service} · {fmtTime(appt.start)}–{fmtTime(appt.end)}
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="appt-detail">
          <span className="k">Technician</span>
          <span className="v">{appt.therapistShort}</span>
        </div>
        <div className="appt-detail">
          <span className="k">Status</span>
          <span className="v">{statusLabel[appt.status] ?? appt.status}</span>
        </div>

        {appt.clientId && (
          <button className="back-link" style={{ marginTop: 14 }} onClick={() => router.push(`/clients/${appt.clientId}`)}>
            View client card <Icons.Chevron size={14} />
          </button>
        )}

        {appt.status === "in_progress" && (
          <>
            <div className="field">
              <label>Amount charged</label>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="field">
              <label>Payment</label>
              <div className="chip-row">
                {(
                  [
                    ["cash", "Cash"],
                    ["card", "Card"],
                    ["mobile_money", "EcoCash"],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} className="chip" data-on={payment === k ? "1" : "0"} onClick={() => setPayment(k)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Visit notes</label>
              <textarea
                className="note-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything to note about this visit…"
              />
            </div>
          </>
        )}

        {reschedule && (
          <>
            <div className="field">
              <label>New time</label>
              <select value={rTime} onChange={(e) => setRTime(e.target.value)}>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {fmtTime(`2000-01-01T${t}:00+02:00`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Room</label>
              <select value={rRoom} onChange={(e) => setRRoom(e.target.value)}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sheet-actions">
              <button className="btn-ghost" onClick={() => setReschedule(false)} disabled={isPending}>
                Back
              </button>
              <button className="btn-primary" onClick={doReschedule} disabled={isPending}>
                {isPending ? "Saving…" : "Confirm new time"}
              </button>
            </div>
          </>
        )}

        {!reschedule && (
          <>
            <div className="sheet-actions">
              {appt.status === "booked" && (
                <button className="btn-ghost" onClick={() => act("no_show")} disabled={isPending}>
                  No-show
                </button>
              )}
              {next ? (
                <button className="btn-primary" onClick={() => act(next.status)} disabled={isPending}>
                  {isPending ? "Saving…" : next.label}
                </button>
              ) : (
                <button className="btn-ghost" onClick={onClose}>
                  Close
                </button>
              )}
            </div>
            {canModify && (
              <div className="sheet-actions">
                <button className="btn-ghost" onClick={() => setReschedule(true)} disabled={isPending}>
                  Reschedule
                </button>
                <button className="btn-ghost" onClick={doCancel} disabled={isPending} style={{ color: "var(--danger)" }}>
                  Cancel appointment
                </button>
              </div>
            )}
          </>
        )}
    </Sheet>
  );
}
