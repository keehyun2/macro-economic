import { MultiLineChart, SingleAreaChart } from "@/components/charts";
import { AsOfChip, Card, KpiTile, Note, PersonaCard, SectionTitle } from "@/components/ui";
import { loadAll, latestAsOf } from "@/lib/data";
import { fetchDailyLatest } from "@/lib/ecos";
import { FX_TODAY_DEF, MONTHLY_DEFS } from "@/lib/stat-codes";
import {
  cpiYoySeries,
  computeFactors,
  factorDeltaLabel,
  houseYoYSeries,
  realRateSeries,
} from "@/lib/indicators";
import { currentZ, PERSONAS, scorePersona } from "@/lib/personas";
import { latest, pctChangeSeries, rollingSumSeries, since, yoySeries } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtPct, fmtSigned, fmtT } from "@/lib/format";

export const revalidate = 21600; // 6시간 — ECOS 호출 보호

const SINCE = "2015-01";

/** 금리 변화의 화살표 색 — 대출자는 하락이 이득, 예금자는 상승이 이득. */
function dirOf(
  delta: number | null,
  who: "borrower" | "saver"
): "good" | "bad" | "flat" {
  if (delta === null || delta === 0) return "flat";
  const up = delta > 0;
  return (who === "saver") === up ? "good" : "bad";
}

/** '2026-09-07' → '9/7' — 칩의 당일 환율 기준일 표기. */
function mmdd(t: string): string {
  return `${Number(t.slice(5, 7))}/${Number(t.slice(8, 10))}`;
}

export default async function DashboardPage() {
  const all = await loadAll();
  const fxToday = await fetchDailyLatest(FX_TODAY_DEF);
  const factors = computeFactors(all);
  const z = currentZ(factors);
  const scores = PERSONAS.map((p) => scorePersona(p, z)).sort((a, b) => b.score - a.score);

  const cpiYoy = cpiYoySeries(all);
  const realDeposit = realRateSeries(all.deposit.points, all.cpi.points);
  const kospi3m = pctChangeSeries(all.kospi.points, 3);
  const houseYoY = houseYoYSeries(all);
  const ppiYoy = yoySeries(all.ppi.points);
  const m2YoY = yoySeries(all.m2.points);
  // 경상수지는 월별 변동이 커서 12개월 이동합(연율)으로 본다 — 백만달러 → 억달러
  const bop12m = rollingSumSeries(all.currentAccount.points, 12).map((p) => ({
    t: p.t,
    v: Math.round((p.v / 100) * 10) / 10,
  }));

  const asOf = latestAsOf(all);
  const liveCount = Object.values(all).filter((s) => s.live).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <AsOfChip>📊 데이터 시점 {fmtT(asOf)} (지표별 상이 · /data 참조)</AsOfChip>
        <AsOfChip>
          {liveCount > 0
            ? `🟢 live ${liveCount}/${MONTHLY_DEFS.length} · ECOS 직접 조회`
            : "🟡 스냅샷 모드 (ECOS 미응답)"}
        </AsOfChip>
        {fxToday && (
          <AsOfChip>
            💱 원/달러{" "}
            <span className="font-mono text-soft">{fmtNum(fxToday.v, 1)}원</span>
            {` · ${mmdd(fxToday.t)} 매매기준율`}
            {fxToday.prevV !== null &&
              ` · 전일대비 ${fmtSigned(fxToday.v - fxToday.prevV, 1, "원")}`}
          </AsOfChip>
        )}
      </div>

      <section>
        <SectionTitle
          title="지금 금융시장은"
          sub="핵심 지표와 최근 3개월 변화 — 화살표 색은 이름표 입장(대출자·예금자) 기준 이득·손해, 입장이 갈리는 지표는 무채색"
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile
            label="한국은행 기준금리"
            value={fmtPct(factors.baseRate.latestValue)}
            delta={factorDeltaLabel(factors.baseRate)}
            sub="3개월 변화"
          />
          <KpiTile
            label="주담대 금리(신규)"
            value={fmtPct(factors.mortgage.latestValue)}
            delta={factorDeltaLabel(factors.mortgage)}
            sub="3개월 변화 · 영끌족 비용"
            deltaDir={dirOf(factors.mortgage.delta, "borrower")}
          />
          <KpiTile
            label="신용대출 금리(신규)"
            value={fmtPct(factors.credit.latestValue)}
            delta={factorDeltaLabel(factors.credit)}
            sub="3개월 변화 · 빚투족 비용"
            deltaDir={dirOf(factors.credit.delta, "borrower")}
          />
          <KpiTile
            label="정기예금(1년) 금리"
            value={fmtPct(factors.deposit.latestValue)}
            delta={factorDeltaLabel(factors.deposit)}
            sub="3개월 변화 · 예금족 수익"
            deltaDir={dirOf(factors.deposit.delta, "saver")}
          />
          <KpiTile
            label="실질 정기예금 금리"
            value={fmtPct(latest(realDeposit)?.v ?? null)}
            sub={`예금금리 ${fmtPct(latest(all.deposit.points)?.v ?? null, 1)} − 물가 ${fmtPct(latest(cpiYoy)?.v ?? null, 1)}`}
          />
          <KpiTile
            label="물가 상승률(CPI 전년비)"
            value={fmtPct(factors.cpiYoy.latestValue, 1)}
            delta={factorDeltaLabel(factors.cpiYoy)}
            sub="3개월 변화"
          />
          <KpiTile
            label="원/달러 환율"
            value={fmtNum(factors.usdkrw.latestValue, 1) + "원"}
            delta={factorDeltaLabel(factors.usdkrw)}
            sub="월평균 · 3개월 변화"
          />
          <KpiTile
            label="KOSPI · 주택매매가"
            value={`${fmtSigned(latest(kospi3m)?.v ?? null, 1, "%")} / ${fmtSigned(latest(houseYoY)?.v ?? null, 1, "%")}`}
            sub={`KOSPI 3개월 · 주택가격 전년비 (지수 ${fmtNum(latest(all.kospi.points)?.v ?? null, 0)})`}
          />
        </div>
      </section>

      <section>
        <SectionTitle
          title="이번 달 승자 · 패자"
          sub="최근 3개월 시장 변화가 각 가계 유형에 미친 방향 — 점수는 −100(손해) ~ +100(이득)"
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scores.map((ps) => (
            <PersonaCard key={ps.persona.id} ps={ps} />
          ))}
        </div>
        <Note>
          점수는 공식 통계의 3개월 변화를 페르소나별 민감도로 환산한 상대 지표로, 실제 손익 금액이
          아닙니다. 모델 가정은 승자·패자 페이지에서 전문 공개합니다.
        </Note>
      </section>

      <section>
        <SectionTitle title="금리 지형" sub="기준금리와 시장·은행 금리 (2015~)" />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              { name: "기준금리", color: COLORS.baseRate, points: since(all.baseRate.points, SINCE) },
              { name: "국고채(3년)", color: COLORS.tbond3y, points: since(all.tbond3y.points, SINCE) },
              { name: "주담대(신규)", color: COLORS.mortgage, points: since(all.mortgage.points, SINCE) },
              { name: "신용대출(신규)", color: COLORS.credit, points: since(all.credit.points, SINCE) },
              { name: "정기예금(1년)", color: COLORS.deposit, points: since(all.deposit.points, SINCE) },
            ]}
          />
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle
            title="물가와 실질금리"
            sub="CPI 전년비 vs 실질 정기예금 금리(예금금리 − 물가)"
          />
          <Card>
            <MultiLineChart
              unit="%"
              zeroLine
              series={[
                { name: "물가 상승률", color: COLORS.cpiYoy, points: since(cpiYoy, SINCE) },
                { name: "실질 예금금리", color: COLORS.realRate, points: since(realDeposit, SINCE) },
              ]}
            />
          </Card>
        </div>
        <div>
          <SectionTitle title="원/달러 환율" sub="월평균 매매기준율" />
          <Card>
            <SingleAreaChart
              name="원/달러"
              unit="원"
              color={COLORS.usdkrw}
              points={since(all.usdkrw.points, SINCE)}
            />
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle
          title="자산 시장"
          sub="KOSPI(월평균, 2015=100)와 KB 주택매매가격 전년동월비"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <SingleAreaChart
              name="KOSPI"
              color={COLORS.kospi}
              points={since(all.kospi.points, SINCE)}
            />
          </Card>
          <Card>
            <MultiLineChart
              unit="%"
              zeroLine
              legend={false}
              series={[
                {
                  name: "주택매매가 전년비",
                  color: COLORS.housePrice,
                  points: since(houseYoY, SINCE),
                },
              ]}
            />
          </Card>
        </div>
      </section>
      <section>
        <SectionTitle
          title="거시 배경"
          sub="페르소나 점수에는 들어가지 않지만 시장 방향을 읽는 배경 지표 — 경기·유동성·물가·경상수지"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <h3 className="mb-1 text-xs font-medium text-soft">
              경제심리지수(원계열) — 100 기준, 위=낙관 · 아래=비관
            </h3>
            <Card>
              <MultiLineChart
                height={200}
                unit=""
                legend={false}
                refLineY={100}
                series={[
                  {
                    name: "경제심리지수",
                    color: COLORS.econSentiment,
                    points: since(all.econSentiment.points, SINCE),
                  },
                ]}
              />
            </Card>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-medium text-soft">
              경기종합지수 순환변동치 — 선행 vs 동행 (100 기준)
            </h3>
            <Card>
              <MultiLineChart
                height={220}
                unit=""
                legend={false}
                refLineY={100}
                series={[
                  {
                    name: "선행지수",
                    color: COLORS.leadingIdx,
                    points: since(all.leadingIdx.points, SINCE),
                  },
                  {
                    name: "동행지수",
                    color: COLORS.coincidentIdx,
                    points: since(all.coincidentIdx.points, SINCE),
                    dashed: true,
                  },
                ]}
              />
            </Card>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-medium text-soft">M2(광의통화) 전년비 — 유동성</h3>
            <Card>
              <MultiLineChart
                height={220}
                unit="%"
                zeroLine
                legend={false}
                series={[{ name: "M2 전년비", color: COLORS.m2, points: since(m2YoY, SINCE) }]}
              />
            </Card>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-medium text-soft">
              경상수지 12개월 이동합 — 원화의 기본배경
            </h3>
            <Card>
              <SingleAreaChart
                height={220}
                name="경상수지(12M)"
                unit="억$"
                color={COLORS.currentAccount}
                points={since(bop12m, SINCE)}
                zeroLine
              />
            </Card>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-medium text-soft">
              소비자물가 vs 생산자물가 전년비
            </h3>
            <Card>
              <MultiLineChart
                height={220}
                unit="%"
                zeroLine
                legend={false}
                series={[
                  { name: "소비자물가", color: COLORS.cpiYoy, points: since(cpiYoy, SINCE) },
                  {
                    name: "생산자물가",
                    color: COLORS.ppi,
                    points: since(ppiYoy, SINCE),
                    dashed: true,
                  },
                ]}
              />
            </Card>
          </div>
        </div>
        <Note>
          경제심리지수는 가계·기업 체감경기의 방향계로, 100을 크게 밑도는 구간은 비관 국면이다.
          선행지수가 동행지수보다 먼저 방향을 잡는다. 경상수지 흑자는 원화 강세 압력, 적자는
          약세 압력과 연결된다. 생산자물가는 소비자물가의 선행 압력으로 읽는다. 이 섹션의 지표는
          페르소나 점수 모델에는 반영되지 않는다.
        </Note>
      </section>
    </div>
  );
}
