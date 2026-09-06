import { MultiLineChart, SingleAreaChart } from "@/components/charts";
import { AsOfChip, Card, KpiTile, Note, PersonaCard, SectionTitle } from "@/components/ui";
import { loadAll, latestAsOf } from "@/lib/data";
import {
  cpiYoySeries,
  computeFactors,
  factorDeltaLabel,
  houseYoYSeries,
  realRateSeries,
} from "@/lib/indicators";
import { currentZ, PERSONAS, scorePersona } from "@/lib/personas";
import { latest, pctChangeSeries } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtPct, fmtSigned, fmtT } from "@/lib/format";

export const revalidate = 21600; // 6시간 — ECOS 호출 보호

const SINCE = "2015-01";

function since(points: { t: string; v: number }[], from: string) {
  return points.filter((p) => p.t >= from);
}

export default async function DashboardPage() {
  const all = await loadAll();
  const factors = computeFactors(all);
  const z = currentZ(factors);
  const scores = PERSONAS.map((p) => scorePersona(p, z)).sort((a, b) => b.score - a.score);

  const cpiYoy = cpiYoySeries(all);
  const realDeposit = realRateSeries(all.deposit.points, all.cpi.points);
  const kospi3m = pctChangeSeries(all.kospi.points, 3);
  const houseYoY = houseYoYSeries(all);

  const asOf = latestAsOf(all);
  const liveCount = Object.values(all).filter((s) => s.live).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <AsOfChip>📊 데이터 시점 {fmtT(asOf)} (지표별 상이 · /data 참조)</AsOfChip>
        <AsOfChip>
          {liveCount > 0
            ? `🟢 live ${liveCount}/15 · ECOS 직접 조회`
            : "🟡 스냅샷 모드 (ECOS 미응답)"}
        </AsOfChip>
      </div>

      <section>
        <SectionTitle
          title="지금 금융시장은"
          sub="핵심 지표와 최근 3개월 변화 — 화살표 색은 특정 입장 기준이 아니라 대출자 입장 손해/이득 방향"
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
            deltaDir={
              factors.mortgage.delta !== null && factors.mortgage.delta > 0 ? "bad" : "flat"
            }
          />
          <KpiTile
            label="신용대출 금리(신규)"
            value={fmtPct(factors.credit.latestValue)}
            delta={factorDeltaLabel(factors.credit)}
            sub="3개월 변화 · 빚투족 비용"
            deltaDir={factors.credit.delta !== null && factors.credit.delta > 0 ? "bad" : "flat"}
          />
          <KpiTile
            label="정기예금(1년) 금리"
            value={fmtPct(factors.deposit.latestValue)}
            delta={factorDeltaLabel(factors.deposit)}
            sub="3개월 변화 · 예금족 수익"
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
    </div>
  );
}
