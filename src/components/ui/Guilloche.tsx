import React from "react";

/*
 * The fine engraved line work printed on banknotes: a band of interfering
 * waves plus one rosette. Paths are computed once at module load, so the
 * markup is identical on the server and the client.
 */

const WIDTH = 480;
const HEIGHT = 240;

function wavePath(i: number): string {
  const phase = i * 0.42;
  const amp = 14 + (i % 5) * 5;
  const base = 70 + i * 7;
  let d = "";
  for (let x = 0; x <= WIDTH; x += 6) {
    const y = base + amp * Math.sin(x / 41 + phase) + 7 * Math.sin(x / 15 - phase * 1.7);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
  }
  return d;
}

function rosettePath(j: number, cx: number, cy: number): string {
  const phase = (j * Math.PI) / 9;
  let d = "";
  for (let step = 0; step <= 360; step++) {
    const t = (step / 360) * Math.PI * 2;
    const r = 62 + 15 * Math.sin(12 * t + phase) + 6 * Math.sin(5 * t - phase);
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    d += `${step === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

const WAVES = Array.from({ length: 16 }, (_, i) => wavePath(i));
const ROSETTE = Array.from({ length: 9 }, (_, j) => rosettePath(j, 400, 70));

export function Guilloche({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMaxYMid slice"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <g strokeWidth={0.6} opacity={0.32}>
        {WAVES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g strokeWidth={0.7} opacity={0.5}>
        {ROSETTE.map((d, j) => (
          <path key={j} d={d} />
        ))}
      </g>
    </svg>
  );
}
