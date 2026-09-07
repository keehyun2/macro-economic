// 서버 전용 ECOS 클라이언트 — 페이지/빌드 시점에 live 호출하며 Next fetch 캐시(6시간,
// 'ecos' 태그)를 탄다. 정규화 로직은 scripts/fetch-snapshots.mjs와 동일해야 한다.
import type { SeriesDef } from "./stat-codes";
import type { Point } from "./series";

const BASE = "https://ecos.bok.or.kr/api";
const REVALIDATE_SEC = 21600; // 6시간 — ECOS 일일 호출 한도 보호

interface EcosRow {
  TIME: string;
  DATA_VALUE: string | null;
}

function nowFor(period: SeriesDef["period"]): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  if (period === "M") return `${y}${m}`;
  if (period === "D") return `${y}${m}${String(d.getDate()).padStart(2, "0")}`;
  if (period === "Q") return `${y}Q${Math.floor(d.getMonth() / 3) + 1}`;
  throw new Error(`unsupported period ${period}`);
}

async function fetchPage(def: SeriesDef, startRow: number, endRow: number): Promise<{ total: number; rows: EcosRow[] }> {
  const url =
    `${BASE}/StatisticSearch/${process.env.ECOS_API_KEY}/json/kr/${startRow}/${endRow}` +
    `/${def.table}/${def.period}/${def.start}/${nowFor(def.period)}/${def.item}`;
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SEC, tags: ["ecos"] },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`ECOS HTTP ${res.status} (${def.key})`);
  const body = (await res.json()) as Record<string, { list_total_count?: number; row?: EcosRow[]; result?: { code: string; message: string } }>;
  const svc = body[Object.keys(body)[0]];
  if (svc?.result && svc.result.code !== "000")
    throw new Error(`ECOS ${svc.result.code} ${svc.result.message} (${def.key})`);
  return { total: svc?.list_total_count ?? 0, rows: svc?.row ?? [] };
}

function normalizeTime(period: SeriesDef["period"], time: string): string {
  if (period === "M") return `${time.slice(0, 4)}-${time.slice(4, 6)}`;
  if (period === "Q") return time; // '2026Q2' 그대로 — scripts/fetch-snapshots.mjs와 동일
  if (period === "D") return `${time.slice(0, 4)}-${time.slice(4, 6)}`; // 일 → 월 버킷
  throw new Error(`unsupported period ${period}`);
}

function toPoints(def: SeriesDef, rows: EcosRow[]): Point[] {
  const byT = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const raw = r.DATA_VALUE;
    if (raw === null || raw === undefined || raw === "") continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const t = normalizeTime(def.period, r.TIME);
    if (def.monthlyAvg) {
      const cur = byT.get(t) ?? { sum: 0, n: 0 };
      cur.sum += v;
      cur.n += 1;
      byT.set(t, cur);
    } else {
      byT.set(t, { sum: v, n: 1 }); // 월 1행 계열 — 중복 행이면 마지막 값(스크립트와 동일)
    }
  }
  return [...byT.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([t, { sum, n }]) => ({ t, v: Math.round((sum / n) * 1e4) / 1e4 }));
}

/** live 호출이 실패하면(null 반환) 호출부가 커밋된 스냅샷으로 폴백한다. */
export async function fetchSeriesLive(def: SeriesDef): Promise<Point[] | null> {
  if (!process.env.ECOS_API_KEY) return null;
  try {
    const out: EcosRow[] = [];
    for (let page = 1; page <= 12; page++) {
      const startRow = (page - 1) * 500 + 1;
      const { total, rows } = await fetchPage(def, startRow, startRow + 499);
      out.push(...rows);
      if (startRow + 499 >= total) break;
    }
    return toPoints(def, out);
  } catch {
    return null; // ECOS 차단/타임아웃 등 — 폴백
  }
}
