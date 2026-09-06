import { YoungkulSim } from "@/components/YoungkulSim";
import { MultiLineChart } from "@/components/charts";
import { Card, Note, SectionTitle } from "@/components/ui";
import { loadAll } from "@/lib/data";
import { houseYoYSeries, monthlyInterestSeries } from "@/lib/indicators";
import { latest, percentileOfLatest, yoySeries } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtT, fmtTrillionWon } from "@/lib/format";

export const revalidate = 21600;

export default async function YoungkulPage() {
  const all = await loadAll();
  const mortgageLast = latest(all.mortgage.points);
  const percentile = percentileOfLatest(all.mortgage.points, "2006-01");
  const houseYoY = latest(houseYoYSeries(all));

  const toTirillion = (points: { t: string; v: number }[]) =>
    points.map((p) => ({ t: p.t, v: Math.round((p.v / 1000) * 10) / 10 }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100">🏠 영끌족 — 이자 부담의 무게</h1>
        <p className="mt-1 text-sm text-slate-400">
          고레버리지로 주택을 산 가계의 부담은 금리에서 출발한다. 공식 통계의 신규취급 금리로
          월 이자를 계산하고, 역사 속 위치와 가계 주택관련대출 규모를 함께 본다.
        </p>
      </div>

      <YoungkulSim
        varRates={all.mortgageVar.points}
        fixedRates={all.mortgageFixed.points}
        varInterest={monthlyInterestSeries(all.mortgageVar.points)}
        fixedInterest={monthlyInterestSeries(all.mortgageFixed.points)}
        percentile={percentile}
        houseYoY={houseYoY?.v ?? null}
        asOf={fmtT(mortgageLast?.t)}
      />

      <section>
        <SectionTitle
          title="고정형 vs 변동형 신규금리"
          sub="변동형이 통상 낮지만 금리 상승기에 반전·확대된다 (2015~)"
        />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              {
                name: "변동형 주담보",
                color: COLORS.mortgageVar,
                points: all.mortgageVar.points.filter((p) => p.t >= "2015-01"),
              },
              {
                name: "고정형 주담보",
                color: COLORS.mortgageFixed,
                points: all.mortgageFixed.points.filter((p) => p.t >= "2015-01"),
              },
              {
                name: "기준금리",
                color: COLORS.baseRate,
                points: all.baseRate.points.filter((p) => p.t >= "2015-01"),
                dashed: true,
              },
            ]}
          />
        </Card>
      </section>

      <section>
        <SectionTitle
          title="가계의 무게 — 주택관련대출"
          sub={`가계대출 ${fmtTrillionWon(latest(all.hhDebt.points)?.v)} 중 주택관련대출 ${fmtTrillionWon(
            latest(all.hhMortgageDebt.points)?.v
          )} (${fmtT(latest(all.hhMortgageDebt.points)?.t)} 기준)`}
        />
        <Card>
          <MultiLineChart
            unit="조원"
            series={[
              {
                name: "가계대출",
                color: COLORS.hhDebt,
                points: toTirillion(all.hhDebt.points),
              },
              {
                name: "주택관련대출",
                color: COLORS.hhMortgageDebt,
                points: toTirillion(all.hhMortgageDebt.points),
              },
            ]}
          />
        </Card>
        <Note>
          가계신용(용도별) 분기 통계. 개별 가계의 부담이 아니라 전체 가계부채의 규모와 구조 — 금리
          변화가 이 잔액 전체에 어떤 이자 비용을 물리는지 상상하는 배경 지표다. 예: 가계대출{" "}
          {fmtTrillionWon(latest(all.hhDebt.points)?.v)}에서 금리가 1%p 오르면 연간 약{" "}
          {fmtNum(((latest(all.hhDebt.points)?.v ?? 0) / 1000) * 0.01, 0)}조원의 추가 이자 부담에
          해당한다.
        </Note>
      </section>

      <section>
        <SectionTitle title="집값 — 자산 쪽 방향" sub="KB 주택매매가격지수(전국)와 아파트(전국) 전년동월비" />
        <Card>
          <MultiLineChart
            unit="%"
            zeroLine
            series={[
              {
                name: "주택 전체",
                color: COLORS.housePrice,
                points: houseYoYSeries(all).filter((p) => p.t >= "2015-01"),
              },
              {
                name: "아파트",
                color: COLORS.mortgageFixed,
                points: yoySeries(all.housePriceApt.points).filter((p) => p.t >= "2015-01"),
              },
            ]}
          />
        </Card>
      </section>
    </div>
  );
}
