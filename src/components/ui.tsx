// 공통 UI 조각 — 훅 없음(콜백 prop만 받아 서버/클라이언트 양쪽 트리에서 렌더 가능).
// 색은 globals.css의 테마 토큰(bg-card, text-muted ...)만 써 다크/화이트가 함께 동작한다.
import type { ReactNode } from "react";
import type { PersonaScore, Verdict } from "@/lib/personas";
import { fmtT } from "@/lib/format";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-card p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  /** 용어 툴팁(Term)이 들어갈 수 있게 ReactNode를 받는다. */
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-strong">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
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
  /** 용어 툴팁(Term)이 들어갈 수 있게 ReactNode를 받는다. */
  label: ReactNode;
  value: string;
  delta?: string;
  /** delta가 좋은 방향이면 'good', 나쁘면 'bad', 판단 보류 'flat' — 화살표 색에만 쓴다. */
  deltaDir?: "good" | "bad" | "flat";
  sub?: string;
}) {
  const dirClass =
    deltaDir === "good"
      ? "text-up"
      : deltaDir === "bad"
        ? "text-down"
        : "text-muted";
  const arrow = delta?.startsWith("-") ? "▼" : delta && delta !== "–" ? "▲" : "";
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-strong">{value}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
        {delta && (
          <span className={`font-mono ${dirClass}`}>
            {/* 방향은 delta의 부호가 이미 알려주므로 화살표는 장식으로 취급한다. */}
            {arrow && <span aria-hidden="true">{arrow} </span>}
            {delta}
          </span>
        )}
        {sub && <span className="text-dim">{sub}</span>}
      </div>
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string; bar: string; border: string }> = {
  win: { label: "이득", cls: "text-up", bar: "bg-up", border: "border-up/40" },
  lose: { label: "손해", cls: "text-down", bar: "bg-down", border: "border-down/40" },
  neutral: { label: "중립", cls: "text-soft", bar: "bg-mid", border: "border-line-strong" },
};

export function PersonaCard({ ps }: { ps: PersonaScore }) {
  const v = VERDICT_STYLE[ps.verdict];
  const barPct = (ps.score + 100) / 2; // -100..100 → 0..100%
  return (
    <div className={`rounded-xl border bg-card p-4 ${v.border}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{ps.persona.emoji}</span>
        <span className="font-semibold text-strong">{ps.persona.name}</span>
        <span className={`ml-auto text-sm font-semibold ${v.cls}`}>
          {ps.score > 0 ? "+" : ""}
          {ps.score} · {v.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">{ps.persona.oneLine}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">{ps.persona.desc}</p>
      <div className="relative mt-3 h-1.5 rounded-full bg-inset">
        <div className="absolute inset-y-0 left-1/2 w-px bg-mid" />
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
            aria-label={`${c.label} ${c.factorZ > 0 ? "상승" : c.factorZ < 0 ? "하락" : "변동 미미"} 요인`}
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-mono ${
              c.impact > 0
                ? "border-up/30 bg-up/10 text-up"
                : "border-down/30 bg-down/10 text-down"
            }`}
          >
            <span aria-hidden="true">
              {c.label} {c.factorZ > 0 ? "↑" : c.factorZ < 0 ? "↓" : "·"}
            </span>
          </span>
        ))}
        {!ps.contributions.length && (
          <span className="text-xs text-dim">유의미한 변동 없음</span>
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="min-w-0 text-muted">{label}</span>
        <span className="font-mono text-soft">역사 상위 {p}% · {tone}</span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-info/30 via-line-strong to-down/30">
        <div
          className="absolute -top-1 h-4 w-1 rounded bg-strong"
          style={{ left: `calc(${Math.min(100, Math.max(0, p))}% - 2px)` }}
        />
      </div>
    </div>
  );
}

export function AsOfChip({ children }: { children: ReactNode }) {
  // inline-block + 줄바꿈 허용 — inline-flex면 내부 텍스트 조각이 저마다 글자 단위로
  // 끊겨 이상하게 wrapping되므로, 흐르는 텍스트처럼 공백에서 줄바꿈되게 한다.
  return (
    <span className="inline-block max-w-full rounded-full border border-line-strong bg-inset px-3 py-1 text-xs leading-relaxed text-muted">
      {children}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-dim">{children}</p>;
}

/** 차트 하단의 출처·기준일 표기 — asOf는 'YYYY-MM'/'YYYYQn' 정규 시점. */
export function SourceNote({ source, asOf }: { source: string; asOf?: string }) {
  return (
    <p className="mt-3 border-t border-line pt-2 text-xs text-dim">
      출처: {source}
      {asOf ? ` · 기준일 ${fmtT(asOf)}` : ""}
    </p>
  );
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
    <div className="flex flex-wrap rounded-lg border border-line-strong p-1 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3.5 py-2.5 transition-colors ${
            value === o.value ? "bg-inset font-medium text-strong" : "text-muted hover:text-soft"
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
      ? "text-up"
      : tone === "bad"
        ? "text-down"
        : tone === "muted"
          ? "text-dim"
          : "text-strong";
  return (
    <div className="rounded-lg border border-line bg-inset p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-dim">{sub}</div>}
    </div>
  );
}
