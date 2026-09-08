import { SaverSim } from "@/components/SaverSim";
import { MultiLineChart, SingleAreaChart } from "@/components/charts";
import { AsOfChip, Card, KpiTile, Note, SectionTitle } from "@/components/ui";
import { loadAll } from "@/lib/data";
import { cpiYoySeries, monthlyInterestSeries, realRateSeries } from "@/lib/indicators";
import { latest, percentileOfLatest, since, valueAt, yoySeries } from "@/lib/series";
import { COLORS } from "@/lib/colors";
import { fmtPct, fmtT, fmtTrillionWon } from "@/lib/format";

export const revalidate = 21600;

const SINCE = "2012-01"; // 정기예금(1년) 신규금리 확보 구간
const SINCE_FX = "2015-01"; // 국고채(3년) 월평균 확보 구간

export default async function SaverPage() {
  const all = await loadAll();
  const depLast = latest(all.deposit.points);
  const cpiYoy = cpiYoySeries(all);
  const realDeposit = realRateSeries(all.deposit.points, all.cpi.points);
  const realLast = latest(realDeposit);
  // 물가와의 비교는 예금금리와 같은 시점으로 맞춘다(공표 시차 1개월)
  const cpiYoyAtDeposit = depLast ? valueAt(cpiYoy, depLast.t) : null;
  const positiveRatio =
    realDeposit.length > 0
      ? Math.round((realDeposit.filter((p) => p.v > 0).length / realDeposit.length) * 100)
      : null;
  const percentile = percentileOfLatest(all.deposit.points, SINCE);
  const depositsLast = latest(all.bankDeposits.points);
  const depositsTrillion = (all.bankDeposits.points.map((p) => ({ t: p.t, v: p.v / 1000 })));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-strong">🏦 예금족 — 물가와의 싸움</h1>
          <p className="mt-1 text-sm text-muted">
            예금·적금으로 모으는 가계의 승부처는{' '}
            <b className="text-body">실질 스프레드 = 예금금리 − 물가상승률</b>이다. 세전
            단순 비교지만 방향을 읽는 데는 충분하다. 공식 통계로 이자가 물가를 이겼던 시절과
            진 구간을 본다.
          </p>
        </div>
        <AsOfChip>예금금리 시점 {fmtT(depLast?.t)} · 은행 신규취급 평균</AsOfChip>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="정기예금(1년) 금리"
          value={fmtPct(depLast?.v ?? null)}
          sub={`신규취급 평균 · ${fmtT(depLast?.t)}`}
        />
        <KpiTile
          label="물가 상승률(CPI 전년비)"
          value={fmtPct(cpiYoyAtDeposit, 1)}
          sub={`예금금리 시점(${fmtT(depLast?.t)})에 맞춘 값 — 메인 대시보드의 최신 CPI와 시점이 달라 오차가 아니다`}
        />
        <KpiTile
          label="실질 스프레드(세전)"
          value={fmtPct(realLast?.v ?? null, 1)}
          deltaDir={
            !realLast || realLast.v === 0 ? "flat" : realLast.v > 0 ? "good" : "bad"
          }
          sub="예금금리 − 물가상승률 · 세전 단순 비교(세후 실질수익률은 시뮬레이터)"
        />
        <KpiTile
          label="실질 스프레드 플러스 비중"
          value={positiveRatio === null ? "–" : `${positiveRatio}%`}
          sub={`2012년 이후 월 중 예금금리가 물가를 이긴 비중`}
        />
      </div>

      <SaverSim
        rates={all.deposit.points}
        interest={monthlyInterestSeries(all.deposit.points)}
        realRate={realLast?.v ?? null}
        cpiYoy={cpiYoyAtDeposit}
        percentile={percentile}
        asOf={fmtT(depLast?.t)}
      />

      <section>
        <SectionTitle
          title="같은 은행, 다른 금리 — 예금 상품별"
          sub="정기예금·정기적금은 신규취급 평균, MMDA는 잔액 기준 평균이라 서열이 갈린다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              {
                name: "정기예금(1년)",
                color: COLORS.deposit,
                points: since(all.deposit.points, SINCE),
              },
              {
                name: "정기적금",
                color: COLORS.savings,
                points: since(all.savings.points, SINCE),
              },
              {
                name: "개인 MMDA(잔액 기준)",
                color: COLORS.mmda,
                points: since(all.mmda.points, SINCE),
                dashed: true,
              },
            ]}
          />
        </Card>
        <Note>
          정기적금은 확정된 기간 동안 매월 납입하는 조건으로 정기예금보다 금리가 높은 대신
          실효 수익률 계산이 까다롭다(중도 해지 시 약정금리보다 낮아진다). MMDA는 수시로
          입출금이 가능한 대신 금리가 가장 낮다 — 유동성의 값싼 대가.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="명목금리 · 물가 · 실질 스프레드"
          sub="정기예금(1년) 신규금리 vs 소비자물가·생산자물가 전년비 — 두 선의 간격이 세전 실질 스프레드(주황색)다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            zeroLine
            series={[
              {
                name: "정기예금(1년) 금리",
                color: COLORS.deposit,
                points: since(all.deposit.points, SINCE),
              },
              {
                name: "소비자물가 전년비",
                color: COLORS.cpiYoy,
                points: since(cpiYoy, SINCE),
              },
              {
                name: "생산자물가 전년비",
                color: COLORS.ppi,
                points: since(yoySeries(all.ppi.points), SINCE),
                dashed: true,
              },
              {
                name: "실질 스프레드(세전)",
                color: COLORS.realRate,
                points: realDeposit,
              },
            ]}
            refAreas={[
              { from: "2020-02", to: "2021-08", label: "코로나 저금리기" },
              { from: "2021-09", to: "2023-01", label: "긴축 인상기 · 실질손실 절정" },
            ]}
          />
        </Card>
        <Note>
          2020~2023년엔 예금금리가 물가를 따라가지 못해 실질 스프레드가 깊은 마이너스에 빠졌다 —
          이자를 받아도 구매력은 줄어드는 &lsquo;금융 억압&rsquo; 구간. 반대로 2012~2019년 저금리기에도
          물가가 더 낮아 실질 스프레드는 대부분 플러스였다. 예금자에게 중요한 건 금리 수준이 아니라
          금리와 물가의 차이다. 단 이 값은 세전 단순 비교(당월 금리 − 당월 CPI 전년비)라,
          1년 만기의 기대물가·이자소득세·복리를 반영한 실제 실질수익률과는 다르다 — 세후
          근사값은 위 시뮬레이터에서 잰다. 생산자물가(점선)는 소비자물가의 선행 압력 — 공장도
          가격이 먼저 오르면 몇 달 뒤 소비자물가로 넘어온다.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="현금의 두 얼굴 — 예금 vs 국고채(3년)"
          sub="은행 예금금리와 시장금리(국고채 3년)는 같은 무위험 금리의 은행판·시장판이다"
        />
        <Card>
          <MultiLineChart
            unit="%"
            series={[
              {
                name: "정기예금(1년)",
                color: COLORS.deposit,
                points: since(all.deposit.points, SINCE_FX),
              },
              {
                name: "국고채(3년)",
                color: COLORS.tbond3y,
                points: since(all.tbond3y.points, SINCE_FX),
              },
              {
                name: "기준금리",
                color: COLORS.baseRate,
                points: since(all.baseRate.points, SINCE_FX),
                dashed: true,
              },
            ]}
          />
        </Card>
        <Note>
          인상기에는 시장금리(국고채)가 먼저 오르고 은행 예금금리는 늦게 따라오고, 인하기에는
          예금금리가 내려가는 속도가 더 느리다(하방 경직성). 다만 국고채 수익률은 만기까지
          보유한다는 조건의 수익률이며 중도 매도 시 평가손익이 생긴다 — 정기예금은 원금이
          보장된다는 점에서 위험이 다르다.
        </Note>
      </section>

      <section>
        <SectionTitle
          title="예금의 규모 — 은행 수신잔액"
          sub={`예금은행 총수신 ${fmtTrillionWon(depositsLast?.v)} (${fmtT(depositsLast?.t)} 기준, 말잔)`}
        />
        <Card>
          <SingleAreaChart
            name="은행 수신잔액"
            unit="조원"
            color={COLORS.bankDeposits}
            points={since(depositsTrillion, SINCE)}
          />
        </Card>
        <Note>
          예금은행이 거둔 총수신의 규모다. 가계 예금뿐 아니라 기업·금융기관 등의 예금도 섞여
          있어 &lsquo;가계가 맡긴 돈의 총량&rsquo;으로 읽으면 안 된다 — 가계 부문의 예금성 자산은
          가계·비영리단체 부문 금융계정 계열로 따로 봐야 한다. 영끌족 페이지의 가계대출(가계
          부채)과는 집계 범위가 달라 단순 대비하면 어긋난다. 금융채·CD 발행을 포함한 수신합계
          기준.
        </Note>
      </section>
    </div>
  );
}
