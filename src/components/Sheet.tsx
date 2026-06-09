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
    focusables()[0]?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  );
}
