import { MultiLineChart, SingleAreaChart } from "@/components/charts";
import { Term } from "@/components/Term";
import { AsOfChip, Card, KpiTile, Note, SectionTitle, SourceNote } from "@/components/ui";
import { loadAll } from "@/lib/data";
import { kospi12mSeries, leverageSpreadSeries } from "@/lib/indicators";
import { diffSeries, latest, latestTOf, since } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtPct, fmtPp, fmtT } from "@/lib/format";

export const revalidate = 21600;

const SINCE = "2016-01"; // KOSPI 12M 수익률이 확보되는 시점부터

export default async function DebtInvestPage() {
  const all = await loadAll();
  const creditLast = latest(all.credit.points);
  const creditSince = since(all.credit.points, SINCE);
  const spread = since(leverageSpreadSeries(all), SINCE);
  const spreadLast = latest(spread);
  const positiveRatio =
    spread.length > 0
      ? Math.round((spread.filter((p) => p.v > 0).length / spread.length) * 100)
      : null;
  const kospi12m = kospi12mSeries(all);
  const creditAvg =
    all.credit.points.length > 0
      ? all.credit.points.reduce((s, p) => s + p.v, 0) / all.credit.points.length
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-strong">📈 빚투족 — 차입 비용과의 싸움</h1>
          <p className="mt-1 text-sm text-muted">
            빌린 돈으로 투자할 때 승부는 자산 수익률이 아니라{' '}
            <b className="text-body">자산 수익률 − 차입 금리</b>다. 공식 통계로 이 스프레드의
            역사를 본다.
          </p>
        </div>
        <AsOfChip>금리 시점 {fmtT(creditLast?.t)} · 신용대출은 은행권 신규취급 평균</AsOfChip>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label={<Term id="breakeven">빚투 손익분기 수익률</Term>}
          value={fmtPct(creditLast?.v ?? null)}
          sub={`신용대출(신규) ${fmtT(creditLast?.t)} — 연간 차입이자에 해당하는 단순 비교선`}
        />
        <KpiTile
          label="KOSPI 12개월 수익률"
          value={fmtPct(latest(kospi12m)?.v ?? null, 1)}
          sub={`재지수화 지수(2015=100) ${fmtNum(latest(all.kospi.points)?.v ?? null, 1)} · ${fmtT(latest(all.kospi.points)?.t)}`}
        />
        <KpiTile
          label={<Term id="leverageSpread">레버리지 스프레드</Term>}
          value={fmtPp(spreadLast?.v ?? null, 1)}
          sub="KOSPI 12M − 신용대출 금리 · +면 자산 수익이 차입비용을 넘는 구간"
          deltaDir={!spreadLast ? "flat" : spreadLast.v > 0 ? "good" : "bad"}
        />
        <KpiTile
          label="역사상 스프레드 플러스 비중"
          value={positiveRatio === null ? "–" : `${positiveRatio}%`}
          sub={`2016년 이후 월 중 스프레드 > 0`}
        />
      </div>

      <section>
        <SectionTitle
          title="손익분기 수익률의 역사"
          sub="신용대출(신규) 금리 — 자산 수익률이 이 선을 넘어야 연간 차입이자를 덮는다(세전 단순 비교)"
        />
        <Card>
          <SingleAreaChart
            name="신용대출 금리"
            unit="%"
            color={COLORS.credit}
            points={creditSince}
            refAreas={[{ from: "2021-09", to: "2023-01", label: "긴축 인상기" }]}
          />
          <SourceNote
            source="한국은행 경제통계시스템(ECOS)"
            asOf={latestTOf(all.credit.points)}
          />
        </Card>
        <Note>
          참고: 2006년 이후 전체 기간의 신용대출(신규) 평균 금리는 {fmtPct(creditAvg, 2)}다.
          마진론(증권사 신용융자) 금리는 통상 이보다 높다 — 손익분기선은 더 높게 잡아야 한다.
          이 비교선은 연간 차입이자에 해당하는 단순 기준이라 세금·거래비용·변동성·상환 방식은
          반영하지 않는다. 또 KOSPI 수익률은 배당이 빠진 가격수익률이다 — 배당을 포함한
          총수익률로 재면 자산 성과는 이보다 낫게 나오고, 세금과 거래비용을 넣으면 그만큼
          깎인다. 방향 읽기용 하한선으로 볼 것.
        </Note>
      </section>

      <section>
        <SectionTitle
          title={
            <>
              차입비용의 시장판 — <Term id="cd91">CD</Term>·<Term id="corpBond">회사채</Term>와
              은행 금리
            </>
          }
          sub="같은 &lsquo;빌리는 비용&rsquo;이라도 은행 신용대출·기업 회사채·단기 CD의 금리가 서로 다르다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              {
                name: "신용대출(신규)",
                color: COLORS.credit,
                points: creditSince,
              },
              {
                name: "회사채(3년, AA-)",
                color: COLORS.corpBond3y,
                points: all.corpBond3y.points,
              },
              {
                name: "CD(91일)",
                color: COLORS.cd91,
                points: all.cd91.points,
              },
              {
                name: "국고채(3년)",
                color: COLORS.tbond3y,
                points: all.tbond3y.points,
                dashed: true,
              },
            ]}
          />
          <SourceNote
            source="한국은행 경제통계시스템(ECOS)"
            asOf={latestTOf(
              all.credit.points,
              all.corpBond3y.points,
              all.cd91.points,
              all.tbond3y.points
            )}
          />
        </Card>
        <Note>
          시장금리(국고채·CD·회사채)는 일별 시장에서 결정되는 &lsquo;돈의 도매가격&rsquo;이고, 은행
          대출금리는 여기에 은행 마진을 얹은 &lsquo;소매가격&rsquo;이다. 회사채(3년)와 국고채(3년)의 차이는
          신용위험 프리미엄 — 현재 약 {fmtPp(latest(diffSeries(all.corpBond3y.points, all.tbond3y.points))?.v ?? null, 2)}.
          이 스프레드가 넓어지는 국면(2020.3, 2022 하반기)은 시장이 위험을 느끼고 있다는 신호다.
        </Note>
      </section>

      <section>
        <SectionTitle
          title={
            <>
              <Term id="leverageSpread">레버리지 스프레드</Term> — 빚투의 실제 성적표
            </>
          }
          sub="KOSPI 12개월 수익률 − 신용대출(신규) 금리. 0 위는 이득, 아래는 차입비용도 못 건진 구간"
        />
        <Card>
          <MultiLineChart
            unit="%p"
            zeroLine
            legend={false}
            series={[{ name: "레버리지 스프레드", color: COLORS.kospi, points: spread }]}
            refAreas={[{ from: "2021-09", to: "2023-01", label: "금리 인상기 · 빚투 실패 구간" }]}
          />
          <SourceNote
            source="한국은행 ECOS — 주가지수·신용대출 금리로 계산"
            asOf={latestTOf(spread)}
          />
        </Card>
        <Note>
          2021–2022 금리 인상기에는 주가 하락과 차입비용 상승이 동시에 닥쳐 스프레드가 깊은 음수로
          떨어졌다 — 빚투 리스크가 이중으로 작동하는 국면이다. 반대로 저금리+주가 상승기(2017, 2019,
          2020~21)엔 스프레드가 크게 벌어졌다.
        </Note>
      </section>

      <section>
        <SectionTitle title="KOSPI 12개월 수익률" sub="월평균 지수 기준 롤링 수익률" />
        <Card>
          <MultiLineChart
            unit="%"
            zeroLine
            legend={false}
            series={[
              { name: "KOSPI 12M", color: COLORS.kospi, points: since(kospi12m, SINCE) },
              {
                name: "차입 비용(신용대출)",
                color: COLORS.credit,
                points: creditSince,
              },
            ]}
          />
          <SourceNote
            source="한국은행 경제통계시스템(ECOS)"
            asOf={latestTOf(kospi12m, all.credit.points)}
          />
        </Card>
      </section>
    </div>
  );
}
