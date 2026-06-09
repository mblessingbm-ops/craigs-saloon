"use client";

import { useSyncExternalStore } from "react";

/* Subscribe to the browser's online/offline state — the React-blessed way to read
   an external store (no setState-in-effect, SSR-safe via the server snapshot). */
function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Dashboard connectivity indicator. The platform is an offline-capable PWA
 *  (intermittent connectivity is common in Zim per the brief): online → figures
 *  are live from the server; offline → the service worker serves the last cached
 *  view, so we flag that the numbers may be stale. */
export function LiveStatus() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // client
    () => true // server snapshot
  );

  return (
    <div
      className={"live-pill " + (online ? "on" : "off")}
      title={online ? "Connected — figures are live from the server" : "No connection — showing the last synced data"}
    >
      <span className="live-dot" />
      <span className="live-tx">{online ? "Live" : "Offline"}</span>
      <span className="live-sub">· {online ? "synced now" : "cached data"}</span>
    </div>
  );
}
