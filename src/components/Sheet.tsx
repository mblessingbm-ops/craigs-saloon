"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Accessible bottom-sheet: role=dialog, Escape to close, focus trap, and
 *  restores focus to the trigger on close. Renders the overlay + grip. */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [...(ref.current?.querySelectorAll<HTMLElement>(
        'button, select, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      ) ?? [])].filter((el) => !el.hasAttribute("disabled"));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    // Focus the dialog itself (not the first form field) so opening doesn't
    // scroll a deep <select> into view — which would push the title off the top
    // and force the user to scroll up. Keep the sheet pinned to its top.
    ref.current?.focus({ preventScroll: true });
    if (ref.current) ref.current.scrollTop = 0;
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  );
}
