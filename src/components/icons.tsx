/* Line-icon set — ported from the design prototype (icons.jsx). */
import type { CSSProperties, ReactNode } from "react";

interface IconProps {
  size?: number;
  sw?: number;
  fill?: string;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

const mk =
  (paths: ReactNode, vb = 24) =>
  ({ size = 22, sw = 1.8, fill = "none", color = "currentColor", style, className }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {paths}
    </svg>
  );

export const Icons = {
  Home: mk(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  Calendar: mk(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  Users: mk(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.8c2.3.6 4 2.6 4 5.2" />
    </>
  ),
  Bag: mk(
    <>
      <path d="M5 8h14l-1 12.5H6L5 8Z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </>
  ),
  Close: mk(
    <>
      <path d="M4 12h16" />
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" />
    </>
  ),
  Bell: mk(
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  Chat: mk(
    <>
      <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4v-11Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  Chevron: mk(<path d="M9 5l7 7-7 7" />),
  ChevL: mk(<path d="M15 5l-7 7 7 7" />),
  ChevR: mk(<path d="M9 5l7 7-7 7" />),
  Plus: mk(<path d="M12 5v14M5 12h14" />),
  Search: mk(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  Export: mk(
    <>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </>
  ),
  Check: mk(<path d="M5 12.5l4.5 4.5L19 7" />),
  Alert: mk(
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  Sparkle: mk(
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3Z" fill="currentColor" />
  ),
  Clock: mk(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  Phone: mk(
    <path d="M5 4h4l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5C11 24 1 14 3.5 5.6 3.7 4.6 4.4 4 5 4Z" />
  ),
  Heart: mk(
    <path d="M12 20s-7-4.3-9-9c-1.2-2.8.4-5.7 3.3-6 1.9-.2 3.4 1 3.7 2.2.3-1.2 1.8-2.4 3.7-2.2 2.9.3 4.5 3.2 3.3 6-2 4.7-9 9-9 9Z" />
  ),
  Star: mk(
    <path d="M12 3l2.5 5.6 6 .6-4.5 4 1.3 5.9L12 16.8 6.7 19.1 8 13.2l-4.5-4 6-.6L12 3Z" />
  ),
  Pkg: mk(
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  More: mk(
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  Filter: mk(<path d="M4 6h16M7 12h10M10 18h4" />),
  Drop: mk(<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />),
  Minus: mk(<path d="M5 12h14" />),
  Sun: mk(
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </>
  ),
  Moon: mk(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" />),
  LogOut: mk(
    <>
      <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </>
  ),
} as const;

export type IconName = keyof typeof Icons;
