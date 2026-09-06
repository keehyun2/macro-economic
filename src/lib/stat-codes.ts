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
}

type DefsFile = { comment: string; series: SeriesDef[] };

export const SERIES_DEFS: SeriesDef[] = (defsJson as DefsFile).series;
export const SERIES_BY_KEY: Record<string, SeriesDef> = Object.fromEntries(
  SERIES_DEFS.map((d) => [d.key, d])
);
export const SERIES_KEYS = SERIES_DEFS.map((d) => d.key);
