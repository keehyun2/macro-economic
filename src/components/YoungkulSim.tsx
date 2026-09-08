"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts";
import { Term } from "@/components/Term";
import { Card, PercentileBar, SegToggle, SectionTitle, SimStat, SourceNote } from "@/components/ui";
import { COLORS } from "@/lib/colors";
import { delta, latest, percentileOfLatest, since } from "@/lib/series";
import { fmtManWon, fmtManWonSigned, fmtNum, fmtPct, fmtPp } from "@/lib/format";
import type { Point } from "@/lib/series";

const SINCE = "2015-01";
const PERCENTILE_SINCE = "2013-01"; // 변동·고정형 신규금리 데이터 확보 시점

type Repay = "bullet" | "amort"; // 만기일시(이자만) · 원리금균등
type Term = "10" | "20" | "30" | "40"; // 원리금균등 만기(년)

/** 원리금균등 월 납입액(원) — 원금 P를 연금리 r(%)로 n개월에 걸쳐 균등 상환. */
function amortPayment(P: number, annualRatePct: number, n: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return P / n;
  return (P * r) / (1 - Math.pow(1 + r, -n));
}

export function YoungkulSim({
  varRates,
  fixedRates,
  varInterest,
  fixedInterest,
  houseYoY,
  asOf,
}: {
  varRates: Point[];
  fixedRates: Point[];
  varInterest: Point[]; // 원금 1억 기준 월 이자(만원)
  fixedInterest: Point[];
  houseYoY: number | null; // 주택매매가 전년비 %
  asOf: string;
}) {
  const [principalEok, setPrincipalEok] = useState(3);
  const [product, setProduct] = useState<"var" | "fixed">("var");
  const [repay, setRepay] = useState<Repay>("bullet");
  const [term, setTerm] = useState<Term>("30");

  const amortizing = repay === "amort";
  const months = Number(term) * 12;
  const principalWon = principalEok * 1e8;

  const rates = product === "var" ? varRates : fixedRates;
  const interest = product === "var" ? varInterest : fixedInterest;
  const color = product === "var" ? COLORS.mortgageVar : COLORS.mortgageFixed;

  const rateNow = latest(rates)?.v ?? null;
  // 3년 전 금리 = 현재 − (3년 새 변화량). delta는 최근 값 기준이므로 한 번만 호출한다.
  const d3y = delta(rates, 36);
  const rate3yAgo = d3y !== null && rateNow !== null ? rateNow - d3y : null;
  const percentile = useMemo(() => percentileOfLatest(rates, PERCENTILE_SINCE), [rates]);

  const monthlyNow = rateNow !== null ? (principalWon * (rateNow / 100)) / 12 : null;
  const monthly3y =
    monthlyNow !== null && rate3yAgo !== null
      ? (principalWon * (rate3yAgo / 100)) / 12
      : null;
  const diff3y = monthlyNow !== null && monthly3y !== null ? monthlyNow - monthly3y : null;
  const sensPerPp = (principalWon * 0.01) / 12; // 금리 1%p당 월 이자 증가(원)

  // 원리금균등 — 월 납입액과 그중 원금 부분. 이자 부분은 monthlyNow와 같다.
  const payNow = rateNow !== null ? amortPayment(principalWon, rateNow, months) : null;
  const pay3y =
    rateNow !== null && rate3yAgo !== null ? amortPayment(principalWon, rate3yAgo, months) : null;
  const payDiff3y = payNow !== null && pay3y !== null ? payNow - pay3y : null;
  const sensAmort =
    rateNow !== null && payNow !== null
      ? amortPayment(principalWon, rateNow + 1, months) - payNow
      : null;
  const payPrincipal = payNow !== null && monthlyNow !== null ? payNow - monthlyNow : null;
  const totalPaid = payNow !== null ? payNow * months : null;
  const totalInterest = totalPaid !== null ? totalPaid - principalWon : null;

  const chartPoints = useMemo(() => {
    if (amortizing)
      return since(rates, SINCE).map((p) => ({
        t: p.t,
        v: Math.round((amortPayment(principalEok * 1e8, p.v, months) / 1e4) * 10) / 10,
      }));
    return since(interest, SINCE).map((p) => ({
      t: p.t,
      v: Math.round(p.v * principalEok * 10) / 10,
    }));
  }, [amortizing, rates, interest, principalEok, months]);

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="월 상환 시뮬레이터"
          sub={
            <>
              <Term id="newRate">신규취급</Term> 평균금리 기준 ·{" "}
              {amortizing ? (
                <Term id="amort">원리금균등상환({Number(term)}년 만기)</Term>
              ) : (
                <Term id="bullet">만기일시 상환(이자만)</Term>
              )}{" "}
              가정 · 데이터 시점 {asOf}
            </>
          }
          right={
            <SegToggle
              value={product}
              onChange={setProduct}
              options={[
                { value: "var", label: "변동형" },
                { value: "fixed", label: "고정형" },
              ]}
            />
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex flex-wrap items-center gap-3 text-sm text-soft">
            대출 원금
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={principalEok}
              onChange={(e) => setPrincipalEok(Number(e.target.value))}
              className="w-44 max-w-full accent-amber-400"
            />
            <span className="font-mono font-semibold text-amber-300">
              {fmtNum(principalEok, 1)}억원
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2 text-sm text-soft">
            상환방식
            <SegToggle
              value={repay}
              onChange={setRepay}
              options={[
                { value: "bullet", label: "만기일시(이자만)" },
                { value: "amort", label: "원리금균등" },
              ]}
            />
            {amortizing && (
              <SegToggle
                value={term}
                onChange={setTerm}
                options={[
                  { value: "10", label: "10년" },
                  { value: "20", label: "20년" },
                  { value: "30", label: "30년" },
                  { value: "40", label: "40년" },
                ]}
              />
            )}
          </div>
          <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted">
            {product === "var" ? "변동형" : "고정형"} 신규금리 {fmtPct(rateNow)}
          </span>
        </div>

        {amortizing ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SimStat
              label="월 납입액(원리금)"
              value={fmtManWon(payNow, 0)}
              sub={`이자 ${fmtManWon(monthlyNow, 0)} + 원금 ${fmtManWon(payPrincipal, 0)}`}
            />
            <SimStat
              label="연 납입액(12개월)"
              value={fmtManWon(payNow !== null ? payNow * 12 : null, 0)}
            />
            <SimStat
              label="3년 전 금리 대비 월 납입액"
              value={fmtManWonSigned(payDiff3y)}
              tone={payDiff3y === null ? "muted" : payDiff3y > 0 ? "bad" : "good"}
              sub={`금리 ${fmtPp(rateNow !== null && rate3yAgo !== null ? rateNow - rate3yAgo : null)}`}
            />
            <SimStat
              label="금리 ±1%p 시 월 납입액"
              value={sensAmort !== null ? `±${fmtManWon(sensAmort, 0)}` : "–"}
              sub="원리금균등 기준 재계산"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SimStat label="월 이자(현재 금리)" value={fmtManWon(monthlyNow, 0)} />
            <SimStat
              label="연 이자(12개월)"
              value={fmtManWon(monthlyNow !== null ? monthlyNow * 12 : null, 0)}
            />
            <SimStat
              label="3년 전 금리 대비 월 이자"
              value={fmtManWonSigned(diff3y)}
              tone={diff3y === null ? "muted" : diff3y > 0 ? "bad" : "good"}
              sub={`금리 ${fmtPp(rateNow !== null && rate3yAgo !== null ? rateNow - rate3yAgo : null)}`}
            />
            <SimStat
              label="금리 ±1%p 시 월 이자"
              value={`±${fmtManWon(sensPerPp, 0)}`}
              sub="완만한 상환 무시(이자만)"
            />
          </div>
        )}

        {amortizing && totalPaid !== null && totalInterest !== null && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {fmtNum(principalEok, 1)}억원을 {Number(term)}년({months}회)에 걸쳐 갚으면 총 납입액{" "}
            <span className="font-mono text-soft">{fmtNum(totalPaid / 1e8, 2)}억원</span> — 그중
            이자 <span className="font-mono text-down">{fmtManWon(totalInterest, 0)}</span>.
            초반 납입액은 대부분이 이자고 원금 비중은 후반부에 커진다.
          </p>
        )}

        <div className="mt-6">
          <PercentileBar
            pct={percentile}
            label={`현재 ${product === "var" ? "변동형" : "고정형"} 주담대 신규금리 ${fmtPct(
              rateNow
            )}의 2013년 이후 위치`}
          />
          {houseYoY !== null && (
            <p className="mt-3 text-xs text-muted">
              주택매매가격(전국)은 최근 1년{" "}
              <span className={houseYoY >= 0 ? "text-down" : "text-up"}>
                {houseYoY > 0 ? "+" : ""}
                {fmtNum(houseYoY, 1)}%
              </span>{" "}
              — 집값 하락기에는 이자 부담과 자산 손실이 겹치는 이중 부담이 된다.
            </p>
          )}
          <p className="mt-2 text-xs text-dim">
            신규취급 금리는 새로 대출받을 때의 시장 평균(이번 달 신규 계약의 가중평균)이다 —
            기존 대출자의 실제 적용금리(잔액 기준 평균)와는 다를 수 있다. 원리금균등 계산은
            대출 시점의 금리가 만기까지 유지된다고 보는 단순화다 — 실제 변동형은 재고정
            주기마다, 고정형도 만기 재고정 시점에 금리를 다시 적용받는다.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={`${principalEok}억원 빌렸을 때 ${
            amortizing ? `월 납입액(원리금균등 ${Number(term)}년)` : "월 이자"
          }의 역사`}
          sub={`주담대 신규취급 금리 기준 · 같은 원금이어도 시기에 따라 ${
            amortizing ? "월 납입액" : "월 이자"
          }가 크게 달랐다${
            amortizing ? " — 각 시점의 금리로 시작한 대출의 만기까지 균등상환 값" : ""
          }`}
        />
        <MultiLineChart
          unit="만원"
          legend={false}
          series={[
            { name: amortizing ? "월 납입액" : "월 이자", color, points: chartPoints },
          ]}
        />
        <SourceNote
          source={`한국은행 경제통계시스템(ECOS) — ${product === "var" ? "변동형" : "고정형"} 주담대 신규취급 금리로 계산`}
          asOf={latest(rates)?.t}
        />
      </Card>
    </div>
  );
}
