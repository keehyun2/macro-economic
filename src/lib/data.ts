// 시리즈 로더 — live ECOS 호출(캐시됨) 우선, 실패 시 커밋된 스냅샷(data/snapshots.json)으로 폴백.
// 스냅샷은 정적 import로 번들에 포함된다(Vercel 서버리스에서 fs로 안전하게 읽을 수 없으므로).
import { cache } from "react";
import snapsJson from "../../data/snapshots.json";
import { SERIES_BY_KEY, SERIES_KEYS } from "./stat-codes";
import { fetchSeriesLive } from "./ecos";
import { fromMonthIndex, isQuarter, tIndex, type Point } from "./series";

export interface LoadedSeries {
  key: string;
  label: string;
  short: string;
  unit: string;
  source: string; // ECOS 통계명
  points: Point[];
  live: boolean; // true = 이번 렌더에서 live 호출 성공
}

interface SnapshotsFile {
  fetchedAt: string;
  series: Record<string, Point[]>;
}

const SNAPS = snapsJson as unknown as SnapshotsFile;

export const snapshotFetchedAt = SNAPS.fetchedAt;

/** live가 스냅샷보다 눈에 띄게 짧으면(호출 오류 의심) 스냅샷을 신뢰한다. */
function pick(live: Point[] | null, snap: Point[]): { points: Point[]; live: boolean } {
  if (live && live.length >= Math.max(0, snap.length - 2)) return { points: live, live: true };
  return { points: snap, live: false };
}

export const loadSeries = cache(async (key: string): Promise<LoadedSeries> => {
  const def = SERIES_BY_KEY[key];
  if (!def) throw new Error(`unknown series ${key}`);
  const snap = SNAPS.series[key] ?? [];
  const { points, live } = pick(await fetchSeriesLive(def), snap);
  return { key, label: def.label, short: def.short, unit: def.unit, source: def.source, points, live };
});

export type AllSeries = Record<string, LoadedSeries>;

export const loadAll = cache(async (): Promise<AllSeries> => {
  const entries = await Promise.all(SERIES_KEYS.map(async (k) => [k, await loadSeries(k)] as const));
  return Object.fromEntries(entries);
});

/** 가장 늦은 데이터 시점(헤더 칩 표기용) — 월/분기 표기를 정규 인덱스로 비교한다. */
export function latestAsOf(all: AllSeries): string {
  let maxT = "";
  let maxIdx = -Infinity;
  for (const s of Object.values(all)) {
    const t = s.points[s.points.length - 1]?.t;
    if (!t) continue;
    const idx = tIndex(t);
    if (idx > maxIdx) {
      maxIdx = idx;
      maxT = t;
    }
  }
  return maxT;
}

/** 지표별 최신 관측시점의 범위(헤더 칩 표기용) — 분기 계열은 관측 월(분기 말)로 환산한다. */
export function asOfRange(all: AllSeries): { min: string; max: string } {
  let minIdx = Infinity;
  let maxIdx = -Infinity;
  for (const s of Object.values(all)) {
    const t = s.points[s.points.length - 1]?.t;
    if (!t) continue;
    const idx = tIndex(t) + (isQuarter(t) ? 2 : 0);
    if (idx < minIdx) minIdx = idx;
    if (idx > maxIdx) maxIdx = idx;
  }
  if (minIdx === Infinity) return { min: "", max: "" };
  return { min: fromMonthIndex(minIdx), max: fromMonthIndex(maxIdx) };
}
