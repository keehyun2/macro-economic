// 파생 지표·시장 요인 엔진 — 모두 스냅샷/live 시리즈에서 순수 계산.
import type { AllSeries } from "./data";
import type { Point } from "./series";
import { clip, delta as seriesDelta, diffSeries, latest, pctChangeSeries, yoySeries } from "./series";
import { fmtPct, fmtPp, fmtSigned } from "./format";

export type FactorKey =
  | "baseRate"
  | "tbond3y"
  | "mortgage"
  | "credit"
  | "deposit"
  | "cpiYoy"
  | "usdkrw"
  | "kospiPct"
  | "housePct";

export interface FactorDef {
  key: FactorKey;
  label: string;
  /** 정규화 척도: delta/scale을 z로 쓴다(±2로 자름). "보통 움직임의 배수". */
  scale: number;
  scaleLabel: string;
  /** 값 자체가 3개월 변화율(%)인 요인(kospiPct, housePct). */
  isChange?: boolean;
}

export const FACTOR_DEFS: FactorDef[] = [
  { key: "baseRate", label: "기준금리", scale: 0.5, scaleLabel: "±0.5%p" },
  { key: "tbond3y", label: "국고채(3년)", scale: 0.5, scaleLabel: "±0.5%p" },
  { key: "mortgage", label: "주담대 금리", scale: 0.5, scaleLabel: "±0.5%p" },
  { key: "credit", label: "신용대출 금리", scale: 0.5, scaleLabel: "±0.5%p" },
  { key: "deposit", label: "정기예금(1년) 금리", scale: 0.5, scaleLabel: "±0.5%p" },
  { key: "cpiYoy", label: "물가 상승률(CPI 전년비)", scale: 1, scaleLabel: "±1%p" },
  { key: "usdkrw", label: "원/달러 환율", scale: 100, scaleLabel: "±100원" },
  { key: "kospiPct", label: "KOSPI(3개월)", scale: 10, scaleLabel: "±10%", isChange: true },
  { key: "housePct", label: "주택매매가(3개월)", scale: 3, scaleLabel: "±3%", isChange: true },
];

export interface FactorState {
  def: FactorDef;
  /** 3개월(칼) 변화 — isChange 요인은 그 기간 수익률(%) 자체. */
  delta: number | null;
  /** 정규화 방향·크기(±2). 데이터 없으면 0. */
  z: number;
  latestValue: number | null;
  latestT?: string;
}

const STEPS = 3; // 분기별 계열이 없으므로 3개월 칼로 통일

export function computeFactors(all: AllSeries): Record<FactorKey, FactorState> {
  const cpiYoy = yoySeries(all.cpi.points);
  const kospi3m = pctChangeSeries(all.kospi.points, STEPS);
  const house3m = pctChangeSeries(all.housePrice.points, STEPS);

  const raw: Record<FactorKey, { pts: Point[]; isChange: boolean }> = {
    baseRate: { pts: all.baseRate.points, isChange: false },
    tbond3y: { pts: all.tbond3y.points, isChange: false },
    mortgage: { pts: all.mortgage.points, isChange: false },
    credit: { pts: all.credit.points, isChange: false },
    deposit: { pts: all.deposit.points, isChange: false },
    cpiYoy: { pts: cpiYoy, isChange: false },
    usdkrw: { pts: all.usdkrw.points, isChange: false },
    kospiPct: { pts: kospi3m, isChange: true },
    housePct: { pts: house3m, isChange: true },
  };

  const out = {} as Record<FactorKey, FactorState>;
  for (const def of FACTOR_DEFS) {
    const { pts, isChange } = raw[def.key];
    const last = latest(pts);
    const d = isChange ? (last?.v ?? null) : seriesDelta(pts, STEPS);
    out[def.key] = {
      def,
      delta: d,
      z: d === null ? 0 : clip(d / def.scale, -2, 2),
      latestValue: last?.v ?? null,
      latestT: last?.t,
    };
  }
  return out;
}

export function factorDeltaLabel(f: FactorState): string {
  if (f.delta === null) return "–";
  if (f.def.key === "usdkrw") return fmtSigned(f.delta, 0, "원");
  if (f.def.isChange) return fmtSigned(f.delta, 1, "%");
  return fmtPp(f.delta);
}

export function factorValueLabel(f: FactorState): string {
  if (f.latestValue === null) return "–";
  if (f.def.key === "usdkrw") return fmtSigned(f.latestValue, 1, "원").replace("+", "");
  if (f.def.isChange || f.def.key === "cpiYoy") return fmtPct(f.latestValue, 1);
  return fmtPct(f.latestValue);
}

// ── 파생 시리즈 ────────────────────────────────────────────────────────────────

export function cpiYoySeries(all: AllSeries): Point[] {
  return yoySeries(all.cpi.points);
}

/** 실질금리 = 명목 − CPI 전년동월비. */
export function realRateSeries(nominal: Point[], cpi: Point[]): Point[] {
  return diffSeries(nominal, yoySeries(cpi));
}

/** KOSPI 12개월 수익률(%) 시리즈. */
export function kospi12mSeries(all: AllSeries): Point[] {
  return pctChangeSeries(all.kospi.points, 12);
}

/** 빚투 레버리지 스프레드 = KOSPI 12M 수익률 − 신용대출 금리. */
export function leverageSpreadSeries(all: AllSeries): Point[] {
  return diffSeries(kospi12mSeries(all), all.credit.points);
}

/** 주택매매가 전년동월비(%) 시리즈. */
export function houseYoYSeries(all: AllSeries): Point[] {
  return yoySeries(all.housePrice.points);
}

/** 원금 1억 기준 월 이자(만원) 시리즈 — UI에서 원금 배수로 확장. */
export function monthlyInterestSeries(rate: Point[]): Point[] {
  return rate.map((p) => ({ t: p.t, v: Math.round(((p.v / 100 / 12) * 1e8) / 1e4 * 10) / 10 }));
}
