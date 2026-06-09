"use client";

import { useId } from "react";

/* Donut chart (payment split) — ported from icons.jsx */
export function Donut({
  segments,
  size = 56,
  stroke = 9,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const lens = segments.map((s) => (s.value / total) * C);
  // cumulative offset before each segment (pure — no mutation during render)
  const offsets = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(lens[i] - 3, 0)} ${C}`}
          strokeDashoffset={-offsets[i]}
        />
      ))}
    </svg>
  );
}

/* Sparkline / mini line+area — ported from icons.jsx */
export function Spark({
  data,
  w = 320,
  h = 46,
  color = "var(--accent)",
  light = true,
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  light?: boolean;
}) {
  const gid = useId();
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as [number, number];
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={light ? 0.35 : 0.4} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
      )}
    </svg>
  );
}
