"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { chat, type ChatStep } from "@/lib/data";

type ThreadItem = { role: "client"; text: string } | { role: "bot"; step: ChatStep };

const times = ["9:32", "9:33", "9:33", "9:34", "9:34", "9:35"];

export function WhatsAppFlow() {
  const router = useRouter();
  const [thread, setThread] = useState<ThreadItem[]>([{ role: "client", text: "Hi" }]);
  const [pending, setPending] = useState<ChatStep | null>(null);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const byId = useCallback((id: string) => chat.steps.find((s) => s.id === id), []);

  const pushBot = useCallback((step: ChatStep | undefined) => {
    if (!step) return;
    setTyping(true);
    const tm = setTimeout(() => {
      setTyping(false);
      setThread((t) => [...t, { role: "bot", step }]);
      setPending(step.replies || step.list || step.slots ? step : null);
    }, 750);
    timers.current.push(tm);
  }, []);

  const start = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThread([{ role: "client", text: "Hi" }]);
    setPending(null);
    pushBot(byId("welcome"));
  }, [pushBot, byId]);

  useEffect(() => {
    // mount: the bot greets after a beat. Deferred via setTimeout so the state
    // updates run in a callback, not synchronously in the effect body.
    const tm = setTimeout(() => pushBot(byId("welcome")), 300);
    timers.current.push(tm);
    return () => timers.current.forEach(clearTimeout);
  }, [pushBot, byId]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight + 200;
  }, [thread, typing, pending]);

  const choose = useCallback(
    (label: string, goId: string) => {
      setPending(null);
      setThread((t) => [...t, { role: "client", text: label }]);
      const tm = setTimeout(() => pushBot(byId(goId)), 280);
      timers.current.push(tm);
    },
    [pushBot, byId]
  );

  const time = (i: number) => times[i % 6];
  const last = thread[thread.length - 1];
  const ended = !typing && !pending && thread.length > 1 && last?.role === "bot" && last.step.end;

  return (
    <div className="wa">
      <div className="wa-top">
        <button className="bk" onClick={() => router.push("/")} aria-label="Back">
          <Icons.ChevL size={22} />
        </button>
        <div className="av">C</div>
        <div style={{ flex: 1 }}>
          <div className="nm">Craig&apos;s Saloon</div>
          <div className="st">Business · typically replies instantly</div>
        </div>
        <Icons.Phone size={18} style={{ color: "rgba(243,235,227,0.7)" }} />
      </div>

      <div className="wa-scroll" ref={scroller}>
        <div className="wa-day">Today</div>
        {thread.map((m, i) => {
          if (m.role === "client")
            return (
              <div className="bubble client" key={i}>
                {m.text}
                <div className="tk">{time(i)} ✓✓</div>
              </div>
            );
          const s = m.step;
          return (
            <div key={i} style={{ display: "contents" }}>
              {s.text && (
                <div className="bubble bot">
                  {s.text}
                  <div className="tk">{time(i)}</div>
                </div>
              )}
              {s.card && (
                <div className="wa-card">
                  <div className="ph">
                    <span className="lg">Craig&apos;s</span>
                  </div>
                  <div className="bd">
                    <div className="ti">{s.card.title}</div>
                    {s.card.lines.map((l, j) => (
                      <div className="ln" key={j}>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {typing && (
          <div className="typing">
            <span />
            <span />
            <span />
          </div>
        )}

        {pending && !typing && (
          <>
            {pending.replies && (
              <div className="qr-wrap">
                {pending.replies.map((r, i) => (
                  <button key={i} className={"qr" + (r.primary ? " primary" : "")} onClick={() => choose(r.label, r.go)}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            {pending.list && (
              <div className="qr-list">
                <div className="hd">{pending.list.title}</div>
                {pending.list.options.map((o, i) => (
                  <div className="qr-li" key={i} onClick={() => choose(o.label, o.go)}>
                    <span className="l">{o.label}</span>
                    {o.meta ? <span className="m">{o.meta}</span> : <Icons.Chevron size={15} style={{ color: "var(--ink-faint)" }} />}
                  </div>
                ))}
              </div>
            )}
            {pending.slots && (
              <div className="slot-grid">
                {pending.slots.map((sl, i) => (
                  <div className="slot" key={i} onClick={() => choose(sl.day + " · " + sl.time, sl.go)}>
                    <div className="d">{sl.day}</div>
                    <div className="t">{sl.time}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {ended && (
          <button className="wa-restart" onClick={start}>
            ↻ Replay booking
          </button>
        )}
        <div style={{ height: 8 }} />
      </div>

      <div className="wa-composer">
        <div className="field">Message</div>
        <div className="send">
          <Icons.Chevron size={20} />
        </div>
      </div>
    </div>
  );
}
