// 순수 시계열 유틸 — 서버/클라이언트 양쪽에서 사용 (ECOS/Next 의존 없음).
// 시점 표기: 월간 'YYYY-MM', 분기 'YYYYQn' (ECOS 원본 그대로).
export interface Point {
  t: string;
  v: number;
}

const Q_RE = /^(\d{4})Q(\d)$/;

export function isQuarter(t: string): boolean {
  return Q_RE.test(t);
}

/** 정렬용 단조 인덱스: 월 단위 개월 수(분기는 ×3개월로 환산). */
export function tIndex(t: string): number {
  const q = Q_RE.exec(t);
  if (q) return Number(q[1]) * 12 + (Number(q[2]) - 1) * 3;
  const m = /^(\d{4})-(\d{2})$/.exec(t);
  if (!m) throw new Error(`bad time ${t}`);
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

export function fromMonthIndex(i: number): string {
  const y = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** 한 칸 = 월간 1개월, 분기 1개분기. n칸 이전 시점. */
export function stepBack(t: string, n: number): string {
  const q = Q_RE.exec(t);
  if (q) {
    const idx = Number(q[1]) * 4 + (Number(q[2]) - 1) - n;
    return `${Math.floor(idx / 4)}Q${(idx % 4) + 1}`;
  }
  return fromMonthIndex(tIndex(t) - n);
}

export function latest(points: Point[]): Point | undefined {
  return points.length ? points[points.length - 1] : undefined;
}

export function valueAt(points: Point[], t: string): number | null {
  for (let i = points.length - 1; i >= 0; i--)
    if (points[i].t === t) return points[i].v;
  return null;
}

/** 최근 값 대비 n칸 이전 값의 차. 최근 시점이 없거나 과거 시점이 없으면 null. */
export function delta(points: Point[], n: number): number | null {
  const last = latest(points);
  if (!last) return null;
  const past = valueAt(points, stepBack(last.t, n));
  if (past === null) return null;
  return last.v - past;
}

/** 전년동월(분기는 전년동분기) 대비 % 변화율 시리즈. */
export function yoySeries(points: Point[]): Point[] {
  const step = points.length && isQuarter(points[0].t) ? 4 : 12;
  const out: Point[] = [];
  for (const p of points) {
    const past = valueAt(points, stepBack(p.t, step));
    if (past !== null && past !== 0) out.push({ t: p.t, v: ((p.v - past) / past) * 100 });
  }
  return out;
}

/** n칸 만큼의 % 변화율 시리즈(모든 시점에 대해). */
export function pctChangeSeries(points: Point[], n: number): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const past = valueAt(points, stepBack(p.t, n));
    if (past !== null && past !== 0) out.push({ t: p.t, v: ((p.v - past) / past) * 100 });
  }
  return out;
}

/** a − b (같은 시점 inner join). */
export function diffSeries(a: Point[], b: Point[]): Point[] {
  const bMap = new Map(b.map((p) => [p.t, p.v]));
  return a.filter((p) => bMap.has(p.t)).map((p) => ({ t: p.t, v: p.v - bMap.get(p.t)! }));
}

/** 최근 값이 sinceT 이후 역사에서 상위 몇 %에 위치하는지 (0~100, 높을수록 높은 값). */
export function percentileOfLatest(points: Point[], sinceT?: string): number | null {
  if (points.length < 6) return null;
  const sinceIdx = sinceT ? tIndex(sinceT) : -Infinity;
  const hist = points.filter((p) => tIndex(p.t) >= sinceIdx);
  if (hist.length < 6) return null;
  const last = hist[hist.length - 1].v;
  const below = hist.filter((p) => p.v < last).length;
  return Math.round((below / (hist.length - 1)) * 100);
}

export function clip(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
