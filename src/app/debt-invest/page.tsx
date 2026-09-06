import { MultiLineChart, SingleAreaChart } from "@/components/charts";
import { AsOfChip, Card, KpiTile, Note, SectionTitle } from "@/components/ui";
import { loadAll } from "@/lib/data";
import { kospi12mSeries, leverageSpreadSeries } from "@/lib/indicators";
import { latest } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtNum, fmtPct, fmtPp, fmtT } from "@/lib/format";

export const revalidate = 21600;

const SINCE = "2016-01"; // KOSPI 12M 수익률이 확보되는 시점부터

export default async function DebtInvestPage() {
  const all = await loadAll();
  const creditLast = latest(all.credit.points);
  const spread = leverageSpreadSeries(all).filter((p) => p.t >= SINCE);
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
          <h1 className="text-xl font-bold text-slate-100">📈 빚투족 — 차입 비용과의 싸움</h1>
          <p className="mt-1 text-sm text-slate-400">
            빌린 돈으로 투자할 때 승부는 자산 수익률이 아니라{' '}
            <b className="text-slate-200">자산 수익률 − 차입 금리</b>다. 공식 통계로 이 스프레드의
            역사를 본다.
          </p>
        </div>
        <AsOfChip>금리 시점 {fmtT(creditLast?.t)} · 신용대출은 은행권 신규취급 평균</AsOfChip>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="빚투 손익분기 수익률"
          value={fmtPct(creditLast?.v ?? null)}
          sub={`신용대출(신규) ${fmtT(creditLast?.t)} — 이 수익률을 넘어야 본전`}
        />
        <KpiTile
          label="KOSPI 12개월 수익률"
          value={fmtPct(latest(kospi12m)?.v ?? null, 1)}
          sub={`지수 ${fmtNum(latest(all.kospi.points)?.v ?? null, 1)} (${fmtT(latest(all.kospi.points)?.t)})`}
        />
        <KpiTile
          label="레버리지 스프레드"
          value={fmtPp(spreadLast?.v ?? null, 1)}
          sub="KOSPI 12M − 신용대출 금리 · +면 빚투 성공 구간"
          deltaDir={!spreadLast ? "flat" : spreadLast.v > 0 ? "good" : "bad"}
        />
        <KpiTile
          label="역사상 빚투 유리했던 비중"
          value={positiveRatio === null ? "–" : `${positiveRatio}%`}
          sub={`2016년 이후 월 중 스프레드 > 0`}
        />
      </div>

      <section>
        <SectionTitle
          title="손익분기 수익률의 역사"
          sub="신용대출(신규) 금리 — 이 선 아래로 떨어지는 해에는 빚투가 본전도 안 된다"
        />
        <Card>
          <SingleAreaChart
            name="신용대출 금리"
            unit="%"
            color={COLORS.credit}
            points={all.credit.points.filter((p) => p.t >= SINCE)}
            refAreas={[{ from: "2021-09", to: "2023-01", label: "긴축 인상기" }]}
          />
        </Card>
        <Note>
          참고: 이 시기 신용대출 평균 금리는 {fmtPct(creditAvg, 2)} (2006년 이후 전체 평균). 마진론
          (증권사 신용융자) 금리는 통상 이보다 높다 — 손익분기선은 더 높게 잡아야 한다.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="레버리지 스프레드 — 빚투의 실제 성적표"
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
              { name: "KOSPI 12M", color: COLORS.kospi, points: kospi12m.filter((p) => p.t >= SINCE) },
              {
                name: "차입 비용(신용대출)",
                color: COLORS.credit,
                points: all.credit.points.filter((p) => p.t >= SINCE),
              },
            ]}
          />
        </Card>
      </section>
    </div>
  );
}
