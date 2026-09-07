// 공통 UI 조각 — 훅 없음(콜백 prop만 받아 서버/클라이언트 양쪽 트리에서 렌더 가능).
import type { ReactNode } from "react";
import type { PersonaScore, Verdict } from "@/lib/personas";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  deltaDir,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  /** delta가 좋은 방향이면 'good', 나쁘면 'bad', 판단 보류 'flat' — 화살표 색에만 쓴다. */
  deltaDir?: "good" | "bad" | "flat";
  sub?: string;
}) {
  const dirClass =
    deltaDir === "good"
      ? "text-emerald-400"
      : deltaDir === "bad"
        ? "text-rose-400"
        : "text-slate-400";
  const arrow = delta?.startsWith("-") ? "▼" : delta && delta !== "–" ? "▲" : "";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">{value}</div>
      <div className="mt-1 flex items-baseline gap-2 text-xs">
        {delta && (
          <span className={`font-mono ${dirClass}`}>
            {arrow} {delta}
          </span>
        )}
        {sub && <span className="text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string; bar: string; border: string }> = {
  win: { label: "이득", cls: "text-emerald-400", bar: "bg-emerald-500", border: "border-emerald-500/40" },
  lose: { label: "손해", cls: "text-rose-400", bar: "bg-rose-500", border: "border-rose-500/40" },
  neutral: { label: "중립", cls: "text-slate-300", bar: "bg-slate-500", border: "border-slate-700" },
};

export function PersonaCard({ ps }: { ps: PersonaScore }) {
  const v = VERDICT_STYLE[ps.verdict];
  const barPct = (ps.score + 100) / 2; // -100..100 → 0..100%
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${v.border}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{ps.persona.emoji}</span>
        <span className="font-semibold text-slate-100">{ps.persona.name}</span>
        <span className={`ml-auto text-sm font-semibold ${v.cls}`}>
          {ps.score > 0 ? "+" : ""}
          {ps.score} · {v.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{ps.persona.oneLine}</p>
      <div className="relative mt-3 h-1.5 rounded-full bg-slate-800">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
        <div
          className={`absolute inset-y-0 ${v.bar}`}
          style={
            ps.score >= 0
              ? { left: "50%", width: `${barPct - 50}%` }
              : { left: `${barPct}%`, right: "50%" }
          }
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ps.contributions.map((c) => (
          <span
            key={c.factor}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${
              c.impact > 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {c.label} {c.factorZ > 0 ? "↑" : c.factorZ < 0 ? "↓" : "·"}
          </span>
        ))}
        {!ps.contributions.length && (
          <span className="text-[11px] text-slate-500">유의미한 변동 없음</span>
        )}
      </div>
    </div>
  );
}

export function PercentileBar({ pct, label }: { pct: number | null; label: string }) {
  const p = pct ?? 50;
  const tone = p >= 90 ? "역사적 최고준" : p >= 70 ? "높은 수준" : p >= 30 ? "중간" : p >= 10 ? "낮은 수준" : "최저준";
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-200">역사 상위 {p}% · {tone}</span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-sky-500/30 via-slate-700 to-rose-500/30">
        <div
          className="absolute -top-1 h-4 w-1 rounded bg-slate-100"
          style={{ left: `calc(${Math.min(100, Math.max(0, p))}% - 2px)` }}
        />
      </div>
    </div>
  );
}

export function AsOfChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-400">
      {children}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{children}</p>;
}

/** 시뮬레이터 등의 2분할 토글 (세전/세후, 변동/고정). */
export function SegToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-lg border border-slate-700 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 ${
            value === o.value ? "bg-slate-800 text-slate-100" : "text-slate-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 시뮬레이터 결과 상자 — tone은 값의 좋고 나쁨(색에만 쓴다). */
export function SimStat({
  label,
  value,
  sub,
  tone = "plain",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "muted" | "plain";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "muted"
          ? "text-slate-500"
          : "text-slate-50";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}
