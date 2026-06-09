"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type Density = "compact" | "regular" | "comfy";

const THEME_KEY = "ga_theme";
const DENSITY_KEY = "ga_density";

/* localStorage-backed external store — read via useSyncExternalStore (SSR-safe,
   no setState-in-effect), written via the setters which notify subscribers. */
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function readDensity(): Density {
  const stored = localStorage.getItem(DENSITY_KEY) as Density | null;
  return stored === "compact" || stored === "comfy" || stored === "regular" ? stored : "regular";
}

interface ThemeState {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // server snapshot is the stable default; the client reads the real preference
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const density = useSyncExternalStore(subscribe, readDensity, () => "regular" as Density);

  // reflect theme on <body> so the page backdrop tracks the app (DOM side-effect, not state)
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
    emit();
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "light" ? "dark" : "light");
  }, [setTheme]);
  const setDensity = useCallback((d: Density) => {
    try {
      localStorage.setItem(DENSITY_KEY, d);
    } catch {}
    emit();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, density, setTheme, toggleTheme, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
