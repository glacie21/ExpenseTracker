"use client";

import React, { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { formatRupiah, formatRupiahCompact } from "@/lib/formatters";
import {
  Granularity,
  addDaysUTC,
  formatDayLabel,
  formatMonthLabel,
  parseDateOnly,
} from "@/lib/dates";
import { EXPENSE_COLOR, INCOME_COLOR, niceTicks, roundedTopBar } from "./chartTheme";

export interface IncomeExpensePoint {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  series: IncomeExpensePoint[];
  granularity: Granularity;
}

const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 72 };
const BAR_GAP = 2; // surface gap between the income and expense bar

function axisLabel(date: Date, granularity: Granularity): string {
  return granularity === "month" ? formatMonthLabel(date) : formatDayLabel(date, false);
}

function bucketTitle(date: Date, granularity: Granularity): string {
  if (granularity === "month") return formatMonthLabel(date);
  if (granularity === "week") {
    return `Minggu ${formatDayLabel(date, false)} – ${formatDayLabel(addDaysUTC(date, 6))}`;
  }
  return formatDayLabel(date);
}

export function IncomeExpenseChart({ series, granularity }: IncomeExpenseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.floor(entries[0].contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasData = series.some((p) => p.income > 0 || p.expense > 0);
  const legend = (
    <div className="flex items-center gap-4 text-xs text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INCOME_COLOR }} />
        Pemasukan
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
        Pengeluaran
      </span>
    </div>
  );

  if (!hasData) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-sm border border-dashed border-rule text-center">
        <BarChart3 className="mb-2 h-8 w-8 text-ink-3" />
        <p className="text-sm font-medium text-ink-2">
          Belum ada transaksi pada periode ini
        </p>
        <p className="mt-1 text-xs text-ink-3">Grafik akan muncul setelah transaksi dicatat.</p>
      </div>
    );
  }

  const ticks = niceTicks(Math.max(...series.map((p) => Math.max(p.income, p.expense))));
  const maxTick = ticks[ticks.length - 1];
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const bucketWidth = series.length > 0 ? innerWidth / series.length : 0;
  const barWidth = Math.max(1, Math.min(24, (bucketWidth * 0.8 - BAR_GAP) / 2));
  const y = (value: number) => MARGIN.top + innerHeight - (value / maxTick) * innerHeight;
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(1, innerWidth / 64)));

  const activePoint = active !== null ? series[active] : null;
  const activeDate = activePoint ? parseDateOnly(activePoint.date) : null;
  const tooltipLeft =
    active !== null ? MARGIN.left + bucketWidth * active + bucketWidth / 2 : 0;
  const flipTooltip = tooltipLeft > width - 180;

  return (
    <div className="space-y-3">
      {legend}
      <div ref={containerRef} className="relative w-full" onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label="Grafik batang pemasukan dan pengeluaran per periode. Detail tersedia di tabel data di bawah grafik."
          >
            {/* Gridlines and y-axis labels */}
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-rule-soft"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-ink-3 text-[11px]"
                >
                  {formatRupiahCompact(tick)}
                </text>
              </g>
            ))}

            {series.map((point, i) => {
              const x0 = MARGIN.left + bucketWidth * i;
              const center = x0 + bucketWidth / 2;
              const date = parseDateOnly(point.date)!;
              const incomeH = (point.income / maxTick) * innerHeight;
              const expenseH = (point.expense / maxTick) * innerHeight;
              const baseline = MARGIN.top + innerHeight;
              return (
                <g key={point.date}>
                  {active === i && (
                    <rect
                      x={x0}
                      y={MARGIN.top}
                      width={bucketWidth}
                      height={innerHeight}
                      className="fill-sunken"
                    />
                  )}
                  {incomeH > 0 && (
                    <path
                      d={roundedTopBar(center - BAR_GAP / 2 - barWidth, baseline - incomeH, barWidth, incomeH)}
                      style={{ fill: INCOME_COLOR }}
                    />
                  )}
                  {expenseH > 0 && (
                    <path
                      d={roundedTopBar(center + BAR_GAP / 2, baseline - expenseH, barWidth, expenseH)}
                      style={{ fill: EXPENSE_COLOR }}
                    />
                  )}
                  {i % labelEvery === 0 && (
                    <text
                      x={center}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-ink-3 text-[11px]"
                    >
                      {axisLabel(date, granularity)}
                    </text>
                  )}
                  {/* Hit target: the whole bucket column, also keyboard focusable */}
                  <rect
                    x={x0}
                    y={MARGIN.top}
                    width={bucketWidth}
                    height={innerHeight}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${bucketTitle(date, granularity)}: pemasukan ${formatRupiah(point.income)}, pengeluaran ${formatRupiah(point.expense)}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="cursor-default outline-none focus-visible:stroke-accent focus-visible:stroke-2"
                  />
                </g>
              );
            })}

            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={MARGIN.top + innerHeight}
              y2={MARGIN.top + innerHeight}
              className="stroke-ink-3"
              strokeWidth={1}
            />
          </svg>
        )}

        {activePoint && activeDate && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-sm border border-rule bg-surface px-3 py-2 text-xs shadow-[0_6px_16px_-8px_rgb(0_0_0/0.3)]"
            style={
              flipTooltip
                ? { right: width - tooltipLeft + 12 }
                : { left: tooltipLeft + 12 }
            }
          >
            <p className="mb-1.5 font-medium text-ink-3">
              {bucketTitle(activeDate, granularity)}
            </p>
            {[
              { label: "Pemasukan", value: activePoint.income, color: INCOME_COLOR },
              { label: "Pengeluaran", value: activePoint.expense, color: EXPENSE_COLOR },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-0.5">
                <span className="inline-flex items-center gap-1.5 text-ink-3">
                  <span className="h-0.5 w-3 rounded" style={{ backgroundColor: row.color }} />
                  {row.label}
                </span>
                <span className="num font-semibold text-ink">
                  {formatRupiah(row.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table view: every value reachable without hovering */}
      <details className="text-xs">
        <summary className="cursor-pointer select-none text-ink-3 hover:text-ink">
          Lihat tabel data
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-sm border border-rule">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-sunken text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Periode</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Pemasukan</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft text-ink-2">
              {series.map((point) => (
                <tr key={point.date}>
                  <td className="px-3 py-1.5">{bucketTitle(parseDateOnly(point.date)!, granularity)}</td>
                  <td className="num px-3 py-1.5 text-right">{formatRupiah(point.income)}</td>
                  <td className="num px-3 py-1.5 text-right">{formatRupiah(point.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
