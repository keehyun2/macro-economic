// Fetches every pipeline series in data/series.json (chipOnly defs are skipped)
// from the Bank of Korea ECOS API and writes data/snapshots.json — the committed
// fallback the app serves from when a live fetch fails (e.g. ECOS unreachable
// from the deploy region).
// Normalization (TIME → 'YYYY-MM'/'YYYY-Qn', daily → monthly average) mirrors
// src/lib/ecos.ts; the two must stay in sync.
//
// Usage: ECOS_API_KEY=xxx npm run refresh
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.ECOS_API_KEY;
if (!KEY) {
  console.error("ECOS_API_KEY not set");
  process.exit(1);
}
const BASE = "https://ecos.bok.or.kr/api";
const defs = JSON.parse(readFileSync(join(ROOT, "data/series.json"), "utf8")).series;

function nowFor(period) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  if (period === "M") return `${y}${m}`;
  if (period === "D") return `${y}${m}${String(d.getDate()).padStart(2, "0")}`;
  if (period === "Q") return `${y}Q${Math.floor(d.getMonth() / 3) + 1}`;
  throw new Error(`unsupported period ${period}`);
}

async function fetchPage(def, startRow, endRow) {
  const end = nowFor(def.period);
  const url =
    `${BASE}/StatisticSearch/${KEY}/json/kr/${startRow}/${endRow}` +
    `/${def.table}/${def.period}/${def.start}/${end}/${def.item}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const body = JSON.parse(await res.text());
  const svc = body[Object.keys(body)[0]];
  if (svc?.result && svc.result.code !== "000")
    throw new Error(`${def.key}: ECOS ${svc.result.code} ${svc.result.message}`);
  return { total: svc?.list_total_count ?? 0, rows: svc?.row ?? [] };
}

async function fetchAllRows(def) {
  const out = [];
  let total = Infinity;
  for (let page = 1; page <= 12; page++) {
    const startRow = (page - 1) * 500 + 1;
    const { total: t, rows } = await fetchPage(def, startRow, startRow + 499);
    total = t;
    out.push(...rows);
    if (startRow + 499 >= total) break;
  }
  return out;
}

function normalizeTime(period, time) {
  if (period === "M") return `${time.slice(0, 4)}-${time.slice(4, 6)}`;
  if (period === "Q") return time; // 'YYYYQn' → 'YYYY-Qn'? ECOS returns '2025Q1'
  if (period === "D") return `${time.slice(0, 4)}-${time.slice(4, 6)}`; // day → month bucket
  throw new Error(`unsupported period ${period}`);
}

function toPoints(def, rows) {
  const byT = new Map(); // t → {sum, n} for daily avg, else last value wins
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
      byT.set(t, { sum: v, n: 1, last: true });
    }
  }
  return [...byT.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([t, { sum, n }]) => ({ t, v: Math.round((sum / n) * 1e4) / 1e4 }));
}

const result = { fetchedAt: new Date().toISOString(), series: {} };
for (const def of defs) {
  // chipOnly(display-only daily chips) are skipped: only their latest value is used,
  // served by live fetch — a monthly-average snapshot can't stand in for it.
  if (def.chipOnly) continue;
  try {
    const rows = await fetchAllRows(def);
    const points = toPoints(def, rows);
    result.series[def.key] = points;
    const last = points[points.length - 1];
    console.log(
      `${def.key.padEnd(16)} ${String(points.length).padStart(4)} points  ${points[0]?.t ?? "?"} ~ ${last?.t ?? "?"}  last=${last?.v ?? "?"}`
    );
  } catch (e) {
    if (result.series[def.key] === undefined) result.series[def.key] = [];
    console.error(`${def.key.padEnd(16)} FAILED: ${e.message}`);
  }
}

writeFileSync(join(ROOT, "data/snapshots.json"), JSON.stringify(result) + "\n");
console.log(`\nwrote data/snapshots.json (${Object.keys(result.series).length} series)`);
