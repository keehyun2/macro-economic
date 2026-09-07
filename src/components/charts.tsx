"use client";

// recharts 래퍼 — 서버에서 만든 Point[]를 그대로 받아 그린다.
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Point } from "@/lib/series";

export interface LineSpec {
  name: string;
  color: string;
  points: Point[];
  dashed?: boolean;
}

export interface RefAreaSpec {
  from: string;
  to: string;
  label: string;
  color?: string;
}

const AXIS = { stroke: "#64748b", fontSize: 11 };
const GRID = "#1e293b";

function tick(t: string): string {
  return t.includes("Q") ? t : t.replace("-", ".");
}

function mergeRows(series: LineSpec[]): (Record<string, number | string | null>)[] {
  const keys = new Set<string>();
  for (const s of series) for (const p of s.points) keys.add(p.t);
  const maps = series.map((s) => new Map(s.points.map((p) => [p.t, p.v])));
  return [...keys].sort().map((t) => {
    const row: Record<string, number | string | null> = { t };
    series.forEach((s, i) => (row[s.name] = maps[i].get(t) ?? null));
    return row;
  });
}

function TipBox({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number | null; color: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-slate-300">{label ? tick(label) : ""}</div>
      {payload
        .filter((p) => p.value !== null && p.value !== undefined)
        .map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-400">{p.name}</span>
            <span className="ml-auto font-mono text-slate-100">
              {typeof p.value === "number" ? p.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : p.value}
              {unit ?? ""}
            </span>
          </div>
        ))}
    </div>
  );
}

export function MultiLineChart({
  series,
  height = 300,
  unit = "",
  zeroLine = false,
  refLineY,
  refAreas = [],
  legend = true,
}: {
  series: LineSpec[];
  height?: number;
  unit?: string;
  zeroLine?: boolean;
  /** 0 외의 기준선(예: 경기종합지수 100). */
  refLineY?: number;
  refAreas?: RefAreaSpec[];
  legend?: boolean;
}) {
  const rows = mergeRows(series);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={AXIS} tickFormatter={tick} minTickGap={48} />
        <YAxis tick={AXIS} width={52} domain={["auto", "auto"]} />
        <Tooltip content={<TipBox unit={unit} />} />
        {legend && <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />}
        {refAreas.map((a, i) => (
          <ReferenceArea
            key={i}
            x1={a.from}
            x2={a.to}
            fill={a.color ?? "#f59e0b"}
            fillOpacity={0.08}
            label={{ value: a.label, position: "insideTop", fill: "#f59e0b", fontSize: 11 }}
          />
        ))}
        {zeroLine && <ReferenceLine y={0} stroke="#475569" />}
        {refLineY !== undefined && <ReferenceLine y={refLineY} stroke="#475569" />}
        {series.map((s) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={1.8}
            strokeDasharray={s.dashed ? "5 3" : undefined}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SingleAreaChart({
  name,
  points,
  color,
  height = 300,
  unit = "",
  zeroLine = false,
  refAreas = [],
}: {
  name: string;
  points: Point[];
  color: string;
  height?: number;
  unit?: string;
  zeroLine?: boolean;
  refAreas?: RefAreaSpec[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={AXIS} tickFormatter={tick} minTickGap={48} />
        <YAxis tick={AXIS} width={52} domain={["auto", "auto"]} />
        <Tooltip content={<TipBox unit={unit} />} />
        {refAreas.map((a, i) => (
          <ReferenceArea
            key={i}
            x1={a.from}
            x2={a.to}
            fill={a.color ?? "#f59e0b"}
            fillOpacity={0.08}
            label={{ value: a.label, position: "insideTop", fill: "#f59e0b", fontSize: 11 }}
          />
        ))}
        {zeroLine && <ReferenceLine y={0} stroke="#475569" />}
        <Area
          type="monotone"
          dataKey="v"
          name={name}
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#grad-${name})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
