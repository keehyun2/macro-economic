// 시리즈 정의 — data/series.json 이 단일 진실 원천(코드는 2026-09 실제 호출로 확정).
import defsJson from "../../data/series.json";

export interface SeriesDef {
  key: string;
  label: string;
  short: string;
  unit: string;
  table: string;
  item: string;
  period: "M" | "Q" | "D";
  monthlyAvg?: boolean;
  start: string;
  source: string;
  /** 표시 전용 일별 칩 — 월평균 버킷 파이프라인(loadAll·스냅샷)에서 제외하고 최근값만 노출. */
  chipOnly?: boolean;
}

type DefsFile = { comment: string; series: SeriesDef[] };

export const SERIES_DEFS: SeriesDef[] = (defsJson as DefsFile).series;
export const SERIES_BY_KEY: Record<string, SeriesDef> = Object.fromEntries(
  SERIES_DEFS.map((d) => [d.key, d])
);
/** 월 버킷 파이프라인 대상 시리즈 — chipOnly(칩 전용 일별)는 제외. */
export const MONTHLY_DEFS = SERIES_DEFS.filter((d) => !d.chipOnly);
export const SERIES_KEYS = MONTHLY_DEFS.map((d) => d.key);
/** 대시보드 '원/달러 당일' 칩 — 최근 영업일 매매기준율(ecos.ts fetchDailyLatest). */
export const FX_TODAY_DEF = SERIES_BY_KEY["usdkrwDaily"];
