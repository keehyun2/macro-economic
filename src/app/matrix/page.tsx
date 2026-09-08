import { Card, Note, SectionTitle } from "@/components/ui";
import { loadAll } from "@/lib/data";
import {
  computeFactors,
  factorDeltaLabel,
  factorValueLabel,
  FACTOR_DEFS,
  type FactorKey,
} from "@/lib/indicators";
import { PERSONAS, scorePersona, currentZ, type Z } from "@/lib/personas";
import { latestAsOf } from "@/lib/data";
import { stepBack, valueAsOf, yoySeries } from "@/lib/series";
import type { Point } from "@/lib/series";
import type { AllSeries } from "@/lib/data";

export const revalidate = 21600;

// 시나리오: 금리·물가·환율 방향 조합 (자산 가격은 중립 가정)
const RATE_FACTORS: FactorKey[] = ["baseRate", "tbond3y", "mortgage", "credit", "deposit"];

function scenarioZ(rate: 1 | -1, cpi: 1 | -1, fx: 1 | -1): Z {
  const z: Z = {};
  for (const k of RATE_FACTORS) z[k] = rate;
  z.cpiYoy = cpi;
  z.usdkrw = fx;
  return z;
}

const SCENARIOS: { label: string; z: Z }[] = [
  { label: "금리↑ · 물가↑ · 환율↑", z: scenarioZ(1, 1, 1) },
  { label: "금리↑ · 물가↑ · 환율↓", z: scenarioZ(1, 1, -1) },
  { label: "금리↑ · 물가↓ · 환율↑", z: scenarioZ(1, -1, 1) },
  { label: "금리↑ · 물가↓ · 환율↓", z: scenarioZ(1, -1, -1) },
  { label: "금리↓ · 물가↑ · 환율↑", z: scenarioZ(-1, 1, 1) },
  { label: "금리↓ · 물가↑ · 환율↓", z: scenarioZ(-1, 1, -1) },
  { label: "금리↓ · 물가↓ · 환율↑", z: scenarioZ(-1, -1, 1) },
  { label: "금리↓ · 물가↓ · 환율↓", z: scenarioZ(-1, -1, -1) },
];

/** 과거 구간의 z 벡터 — 구간 양 끝 값 차이를 같은 정규화로.
 *  끝점은 as-of 조회: 공표 시차로 그 달 관측이 없는 계열은 직전 값을 쓴다. */
function windowZ(all: AllSeries, tFrom: string, tTo: string): Z {
  const d = (pts: Point[]): number | null => {
    const a = valueAsOf(pts, tFrom);
    const b = valueAsOf(pts, tTo);
    if (a === null || b === null) return null;
    return b - a;
  };
  const pct = (pts: Point[]): number | null => {
    const a = valueAsOf(pts, tFrom);
    const b = valueAsOf(pts, tTo);
    if (a === null || b === null || a === 0) return null;
    return ((b - a) / a) * 100;
  };
  const cpiYoyPts = yoySeries(all.cpi.points);

  const raw: [FactorKey, number | null, number][] = [
    ["baseRate", d(all.baseRate.points), 0.5],
    ["tbond3y", d(all.tbond3y.points), 0.5],
    ["mortgage", d(all.mortgage.points), 0.5],
    ["credit", d(all.credit.points), 0.5],
    ["deposit", d(all.deposit.points), 0.5],
    ["cpiYoy", d(cpiYoyPts), 1],
    ["usdkrw", d(all.usdkrw.points), 100],
    ["kospiPct", pct(all.kospi.points), 10],
    ["worldPct", pct(all.usStock.points), 10],
    ["housePct", pct(all.housePrice.points), 3],
    ["jeonsePct", pct(all.jeonse.points), 3],
  ];
  const z: Z = {};
  for (const [k, delta, scale] of raw)
    z[k] = delta === null ? 0 : Math.max(-2, Math.min(2, delta / scale)) * 2; // 구간은 3개월보다 길어 ±4까지
  return z;
}

/** 리플레이 구간 — 고정 국면 2종 + 데이터 최신 시점 기준 '최근 1년'. */
function cyclesOf(asOf: string) {
  return [
    { label: "코로나 저금리기", from: "2020-02", to: "2021-08", desc: "기준금리 0.5% 시대 — 빚투·영끌의 황금기" },
    { label: "긴축 인상기", from: "2021-09", to: "2023-01", desc: "기준금리 급등 — 레버리지 가계의 압박기" },
    { label: "최근 1년", from: stepBack(asOf, 12), to: asOf, desc: "최신 12개월 구간" },
  ];
}

function ScoreCell({ score, highlight }: { score: number; highlight?: boolean }) {
  const tone =
    score >= 20
      ? "bg-up/20 text-up"
      : score <= -20
        ? "bg-down/20 text-down"
        : "bg-inset text-muted";
  return (
    <td
      className={`px-2 py-2 text-center font-mono text-sm ${tone} ${
        highlight ? "outline outline-2 outline-accent/70" : ""
      }`}
    >
      {score > 0 ? "+" : ""}
      {score}
    </td>
  );
}

export default async function MatrixPage() {
  const all = await loadAll();
  const factors = computeFactors(all);
  const nowZ = currentZ(factors);

  const rows = PERSONAS.map((p) => ({
    persona: p,
    now: scorePersona(p, nowZ),
    cells: SCENARIOS.map((s) => scorePersona(p, s.z)),
  }));

  const cycles = cyclesOf(latestAsOf(all)).map((c) => ({
    ...c,
    scores: PERSONAS.map((p) => scorePersona(p, windowZ(all, c.from, c.to))),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-strong">⚖️ 승자·패자 매트릭스</h1>
        <p className="mt-1 text-sm text-muted">
          같은 시장 움직임이 가계 유형마다 반대 방향으로 작동한다. 현재 상태와 8가지 시나리오에서
          누가 이득이고 누가 손해인지 정렬해 본다.
        </p>
      </div>

      <section>
        <SectionTitle title="현재 시장 상태" sub="최근 3개월 변화 (▲ 상승 · ▼ 하락 · |변동 미미)" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FACTOR_DEFS.map((def) => {
            const f = factors[def.key];
            const dir = f.delta === null ? "·" : Math.abs(f.z) < 0.2 ? "→" : f.delta > 0 ? "▲" : "▼";
            const cls =
              dir === "▲" ? "text-down" : dir === "▼" ? "text-info" : "text-dim";
            return (
              <div
                key={def.key}
                className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2 text-xs"
              >
                <span className="text-soft">{def.label}</span>
                <span className={`font-mono ${cls}`}>
                  {dir} {factorValueLabel(f)}{" "}
                  <span className="text-dim">({factorDeltaLabel(f)})</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="시나리오 × 가계 유형 히트맵"
          sub="금리·물가·환율의 방향 조합별 점수. 노란 테두리 열 = 현재 시장 방향"
        />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="px-2 py-2 text-left font-medium">가계 유형</th>
                <th className="px-2 py-2 text-center font-medium text-accent">지금</th>
                {SCENARIOS.map((s) => (
                  <th key={s.label} className="px-2 py-2 text-center font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.persona.id} className="border-t border-line">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="mr-1.5">{r.persona.emoji}</span>
                    <span className="text-body">{r.persona.name}</span>
                  </td>
                  <ScoreCell score={r.now.score} highlight />
                  {r.cells.map((c, i) => (
                    <ScoreCell key={i} score={c.score} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Note>
          점수 = 50 × Σ(민감도 × 정규화 방향). 시나리오 열은 방향(±1)만 가정한 이론값이고 &lsquo;지금&rsquo;
          열은 실제 변화 크기를 반영한다. KOSPI·미국 주가·주택·전세가격은 시나리오에서 중립(0)으로
          둔다.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="과거 국면 리플레이"
          sub="실제 데이터로 그 구간의 변화를 계산해 같은 점수 모델을 적용 — 그때 누가 이겼나"
        />
        <div className="grid gap-3 md:grid-cols-3">
          {cycles.map((c) => {
            const sorted = [...c.scores].sort((a, b) => b.score - a.score);
            const winner = sorted[0];
            const loser = sorted[sorted.length - 1];
            return (
              <Card key={c.label}>
                <div className="text-sm font-semibold text-strong">{c.label}</div>
                <div className="mt-0.5 font-mono text-xs text-dim">
                  {c.from} → {c.to}
                </div>
                <p className="mt-1 text-xs text-muted">{c.desc}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-up">🥇 {winner.persona.emoji} {winner.persona.name}</span>
                    <span className="ml-auto font-mono text-up">
                      {winner.score > 0 ? "+" : ""}
                      {winner.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-down">🥲 {loser.persona.emoji} {loser.persona.name}</span>
                    <span className="ml-auto font-mono text-down">{loser.score}</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-2">
                  <div className="flex flex-wrap gap-1">
                    {c.scores.map((s) => (
                      <span
                        key={s.persona.id}
                        className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                          s.score >= 20
                            ? "bg-up/15 text-up"
                            : s.score <= -20
                              ? "bg-down/15 text-down"
                              : "bg-inset text-dim"
                        }`}
                        title={s.persona.name}
                      >
                        {s.persona.emoji} {s.score > 0 ? "+" : ""}{s.score}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Note>
          리플레이 점수는 구간 양 끝(시작월·끝월) 지표 값의 차이를 같은 척도로 정규화해 계산한다
          (공표 시차로 그 달 관측이 없는 계열은 직전 관측값 사용). 구간 경계는 대표 국면의 관례적
          구분선이며 개월 경계와 금리 결정 시점은 일부 어긋날 수 있다.
        </Note>
      </section>

      <section>
        <SectionTitle title="점수 모델 전문" sub="해석 투명성을 위한 가정 공개" />
        <Card>
          <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
            <li>요인: 기준금리·국고채(3년)·주담대·신용대출·정기예금 금리, CPI 전년비, 원/달러, KOSPI·미국 주가(글로벌 주식 대리)·주택매매가·주택전세가 변화율.</li>
            <li>각 요인의 3개월 변화를 대표 척도(금리 ±0.5%p, 물가 ±1%p, 환율 ±100원, 주식 ±10%, 집값·전세가 ±3%)로 나눠 ±2로 자른 정규값 z를 만든다.</li>
            <li>가계 유형별 민감도(부호·크기)를 정의하고 점수 = 50 × Σ(민감도 × z), −100~+100으로 자른다. ±20을 넘어야 이득/손해로 판정.</li>
            <li>민감도는 경제적 직관(금리 상승 → 변동금리 차입자 손해, 환율·미국 주가 상승 → 해외투자자 이득, 환율 상승 → 수입소비자 손해, 전세가 상승 → 전세족 손해, 집값 상승 → 무주택 대기자 손해, 물가 상승 → 고정소득 은퇴자 손해 등)에 기반한 설계값이며 임의 보정 대상이다.</li>
            <li>점수는 상대적 방향 지표다 — 고정금리 차입자의 &lsquo;이득&rsquo;은 금리 상승으로 수익이 생긴다는 뜻이 아니라 월 납입액이 고정돼 상대적으로 방어적이라는 뜻이고, 채권 평가손은 만기 보유 시 실현손과 다르다.</li>
          </ol>
        </Card>
      </section>
    </div>
  );
}
