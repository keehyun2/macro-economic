import { YoungkulSim } from "@/components/YoungkulSim";
import { MultiLineChart } from "@/components/charts";
import { Term } from "@/components/Term";
import { AsOfChip, Card, Note, SectionTitle, SourceNote } from "@/components/ui";
import { loadAll } from "@/lib/data";
import { houseYoYSeries, monthlyInterestSeries } from "@/lib/indicators";
import { latest, latestTOf, since, yoySeries } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtT, fmtTrillionWon } from "@/lib/format";

export const revalidate = 21600;

const SINCE = "2015-01";

export default async function YoungkulPage() {
  const all = await loadAll();
  const mortgageLast = latest(all.mortgage.points);
  const houseYoYSeriesAll = houseYoYSeries(all);
  const houseYoY = latest(houseYoYSeriesAll);
  const jeonseYoY = yoySeries(all.jeonse.points);
  const jeonseAptYoY = yoySeries(all.jeonseApt.points);
  const houseAptYoY = yoySeries(all.housePriceApt.points);

  const toTrillion = (points: { t: string; v: number }[]) =>
    points.map((p) => ({ t: p.t, v: Math.round((p.v / 1000) * 10) / 10 }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-strong">🏠 영끌족 — 이자 부담의 무게</h1>
          <p className="mt-1 text-sm text-muted">
            고레버리지로 주택을 산 가계의 부담은 금리에서 출발한다. 공식 통계의 신규취급 금리로
            월 이자를 계산하고, 역사 속 위치와 가계 주택관련대출 규모를 함께 본다.
          </p>
        </div>
        <AsOfChip>주담대 금리 시점 {fmtT(mortgageLast?.t)} · 신규취급 평균</AsOfChip>
      </div>

      <YoungkulSim
        varRates={all.mortgageVar.points}
        fixedRates={all.mortgageFixed.points}
        varInterest={monthlyInterestSeries(all.mortgageVar.points)}
        fixedInterest={monthlyInterestSeries(all.mortgageFixed.points)}
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
                points: since(all.mortgageVar.points, SINCE),
              },
              {
                name: "고정형 주담보",
                color: COLORS.mortgageFixed,
                points: since(all.mortgageFixed.points, SINCE),
              },
              {
                name: "기준금리",
                color: COLORS.baseRate,
                points: since(all.baseRate.points, SINCE),
                dashed: true,
              },
            ]}
          />
          <SourceNote
            source="한국은행 경제통계시스템(ECOS)"
            asOf={latestTOf(
              all.mortgageVar.points,
              all.mortgageFixed.points,
              all.baseRate.points
            )}
          />
        </Card>
      </section>

      <section>
        <SectionTitle
          title={
            <>
              <Term id="newRate">신규취급</Term> vs <Term id="outRate">잔액 기준</Term> — 지금
              대출이 더 비쌀까?
            </>
          }
          sub="신규 금리는 이번 달 시장을, 잔액 금리는 기존 대출자 전체의 평균 부담을 본다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              {
                name: "주담대(신규취급)",
                color: COLORS.mortgage,
                points: since(all.mortgage.points, "2010-01"),
              },
              {
                name: "주담대(잔액 기준)",
                color: COLORS.mortgageOut,
                points: all.mortgageOut.points,
              },
              {
                name: "기준금리",
                color: COLORS.baseRate,
                points: since(all.baseRate.points, "2010-01"),
                dashed: true,
              },
            ]}
          />
          <SourceNote
            source="한국은행 경제통계시스템(ECOS)"
            asOf={latestTOf(all.mortgage.points, all.mortgageOut.points)}
          />
        </Card>
        <Note>
          신규취급 금리가 잔액 기준보다 높게 벌어지면 &lsquo;지금 새로 대출받는 사람&rsquo;의 부담이
          기존 대출자 평균보다 무겁다는 뜻이다. 인상기에 이 갭이 커지고, 인하기에 신규 금리가
          먼저 내려가 갭이 반전되기도 한다 — 갈아타기(대환)의 타이밍 논쟁이 벌어지는 지점.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="매매가 vs 전세가 — 영끌의 기회비용"
          sub="KB 매매·전세가격지수(전국) 전년동월비. 전세가 더 오르는 시기엔 매수 유인이 커질 수 있다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            zeroLine
            series={[
              {
                name: "주택매매가",
                color: COLORS.housePrice,
                points: since(houseYoYSeriesAll, SINCE),
              },
              {
                name: "주택전세가",
                color: COLORS.jeonse,
                points: since(jeonseYoY, SINCE),
              },
              {
                name: "아파트전세가",
                color: COLORS.jeonseApt,
                points: since(jeonseAptYoY, SINCE),
                dashed: true,
              },
            ]}
          />
          <SourceNote
            source="KB주택가격동향(ECOS 수록)"
            asOf={latestTOf(houseYoYSeriesAll, jeonseYoY, jeonseAptYoY)}
          />
        </Card>
        <Note>
          전세가 급등하는 시기(2020~2021)엔 &lsquo;전세 자낭비&rsquo; 논쟁과 함께 영끌(매수) 유인이 커지고,
          전세가 안정되면 대출 이자를 감수할 이유가 줄어든다. 다만 매수와 임차 중 어느 쪽이
          유리한지는 전세가율, 대출금리, 보유세와 거래비용, 집값 전망을 함께 봐야 한다 — 전세가
          상승만으로 매수가 유리해진다고 단정할 수 없다. 두 지수의 방향 차이는 주택 시장의
          수요가 사려는 쪽인지 빌리려는 쪽인지로 쏠렸는지를 보여준다.
        </Note>
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
                points: toTrillion(all.hhDebt.points),
              },
              {
                name: "주택관련대출",
                color: COLORS.hhMortgageDebt,
                points: toTrillion(all.hhMortgageDebt.points),
              },
            ]}
          />
          <SourceNote
            source="한국은행 가계신용(ECOS)"
            asOf={latestTOf(all.hhDebt.points, all.hhMortgageDebt.points)}
          />
        </Card>
        <Note>
          가계신용(용도별) 분기 통계. 개별 가계의 부담이 아니라 전체 가계부채의 규모와 구조 — 금리
          변화가 이 잔액 전체에 어떤 이자 비용을 물리는지 상상하는 배경 지표다. 예: 가계대출{" "}
          {fmtTrillionWon(latest(all.hhDebt.points)?.v)}의 잔액 전체가 즉시 1%p 높은 금리로
          재가격된다고 가정하면 연간 약{" "}
          {fmtNum(((latest(all.hhDebt.points)?.v ?? 0) / 1000) * 0.01, 0)}조원 — 모든 잔액이
          즉시 재가격되는 정태적 상한 계산이다. 실제 추가 이자는 이보다 작다: 고정금리 대출은
          만기·재고정 시점에, 변동금리 대출도 재고정 주기에 따라 반영되고, 그 사이 상환·신규가
          계속 일어나며 업권·상품별 금리 수준도 다르기 때문이다.
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
                points: since(houseYoYSeriesAll, SINCE),
              },
              {
                name: "아파트",
                color: COLORS.mortgageFixed,
                points: since(houseAptYoY, SINCE),
              },
            ]}
          />
          <SourceNote
            source="KB주택가격동향(ECOS 수록)"
            asOf={latestTOf(houseYoYSeriesAll, houseAptYoY)}
          />
        </Card>
      </section>
    </div>
  );
}
