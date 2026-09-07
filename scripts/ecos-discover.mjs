// 일회성 탐색 스크립트: 통계코드 검색(StatisticWord) + 항목 목록(StatisticItemList).
// 사용: node scripts/ecos-discover.mjs word <키워드> | items <통계표코드> [필터]
import { exit } from "node:process";

const KEY = process.env.ECOS_API_KEY;
if (!KEY) {
  console.error("ECOS_API_KEY not set");
  exit(1);
}
const BASE = "https://ecos.bok.or.kr/api";

async function get(svc, params) {
  const url = `${BASE}/${svc}/${KEY}/json/kr/1/200/${params.join("/")}`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const text = await res.text();
      if (text.startsWith("<")) throw new Error(`HTTP ${res.status}`);
      const body = JSON.parse(text);
      const svcName = Object.keys(body)[0];
      const s = body[svcName];
      if (s?.result && s.result.code !== "000")
        throw new Error(`${svc}: ${s.result.code} ${s.result.message}`);
      return { total: s?.list_total_count ?? 0, rows: s?.row ?? [] };
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "probe") {
  // 테이블 코드 목록 → 첫 데이터 행으로 통계명 확인
  for (const t of a.split(",")) {
    try {
      const items = await get("StatisticItemList", [t, " "]);
      const first = items.rows.find((r) => (r.CYCLE ?? "") === "M") ?? items.rows[0];
      if (!first) {
        console.log(`${t}  (no items, total=${items.total})`);
        continue;
      }
      const itemCode = first.ITEM_CODE1 ?? first.ITEM_CODE;
      const data = await get("StatisticSearch", [t, "M", "202606", "202606", itemCode]);
      const row = data.rows[0];
      console.log(
        `${t}  ${row?.STAT_NAME ?? "?"}  | 예시항목: ${first.ITEM_NAME1 ?? first.ITEM_NAME} (${itemCode})`
      );
    } catch (e) {
      console.log(`${t}  ERROR: ${e.message.slice(0, 70)}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
} else if (cmd === "word") {
  const { total, rows } = await get("StatisticWord", [encodeURIComponent(a)]);
  console.log(`total=${total}`);
  for (const r of rows)
    console.log(`${r.STAT_CODE?.padEnd(9)} ${r.STAT_NAME}  | ${r.ITEM_NAME1 ?? ""} (${r.ITEM_CODE1 ?? ""}) ${r.CYCLE ?? ""}`);
} else if (cmd === "items") {
  const { total, rows } = await get("StatisticItemList", [a, b ?? " "]);
  console.log(`total=${total}`);
  for (const r of rows)
    console.log(
      `${String(r.ITEM_CODE ?? r.ITEM_CODE1).padEnd(12)} ${(r.ITEM_NAME ?? r.ITEM_NAME1 ?? "").padEnd(30)} ${r.START_TIME ?? ""}~${r.END_TIME ?? ""} ${r.CYCLE ?? r.UNIT_NAME ?? ""}`
    );
} else {
  console.error("usage: ecos-discover.mjs word <kw> | items <table> [filter]");
}
