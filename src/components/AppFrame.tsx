"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";
import { OfflineBanner } from "@/components/OfflineBanner";

/** The phone-style app frame. Applies the active theme + density tokens.
 *  Full-bleed on mobile, a centred rounded column on desktop (see globals.css). */
export function AppFrame({ children }: { children: ReactNode }) {
  const { theme, density } = useTheme();
  return (
    <div className="ga-app" data-theme={theme} data-density={density}>
      <OfflineBanner />
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
