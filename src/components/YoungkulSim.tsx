"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts";
import { Card, PercentileBar, SectionTitle } from "@/components/ui";
import { COLORS } from "@/lib/colors";
import { delta, latest } from "@/lib/series";
import { fmtManWon, fmtNum, fmtPct, fmtPp } from "@/lib/format";
import type { Point } from "@/lib/series";

const SINCE = "2015-01";

export function YoungkulSim({
  varRates,
  fixedRates,
  varInterest,
  fixedInterest,
  percentile,
  houseYoY,
  asOf,
}: {
  varRates: Point[];
  fixedRates: Point[];
  varInterest: Point[]; // 원금 1억 기준 월 이자(만원)
  fixedInterest: Point[];
  percentile: number | null; // 현재 주담대 금리의 2006년 이후 백분위
  houseYoY: number | null; // 주택매매가 전년비 %
  asOf: string;
}) {
  const [principalEok, setPrincipalEok] = useState(3);
  const [product, setProduct] = useState<"var" | "fixed">("var");

  const rates = product === "var" ? varRates : fixedRates;
  const interest = product === "var" ? varInterest : fixedInterest;
  const color = product === "var" ? COLORS.mortgageVar : COLORS.mortgageFixed;

  const rateNow = latest(rates)?.v ?? null;
  const rate3yAgo = useMemo(
    () => (rates.length ? (delta(rates, 36) !== null ? rateNow! - delta(rates, 36)! : null) : null),
    [rates, rateNow]
  );

  const monthlyNow = rateNow !== null ? (principalEok * 1e8 * (rateNow / 100)) / 12 : null;
  const monthly3y =
    monthlyNow !== null && rate3yAgo !== null
      ? (principalEok * 1e8 * (rate3yAgo / 100)) / 12
      : null;
  const diff3y = monthlyNow !== null && monthly3y !== null ? monthlyNow - monthly3y : null;
  const sensPerPp = (principalEok * 1e8 * 0.01) / 12; // 금리 1%p당 월 이자 증가(원)

  const chartPoints = useMemo(
    () =>
      interest
        .filter((p) => p.t >= SINCE)
        .map((p) => ({ t: p.t, v: Math.round(p.v * principalEok * 10) / 10 })),
    [interest, principalEok]
  );

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="월 이자 시뮬레이터"
          sub={`신규취급 평균금리 기준 · 원금 만기일시 상환 가정 · 데이터 시점 ${asOf}`}
          right={
            <div className="flex rounded-lg border border-slate-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setProduct("var")}
                className={`rounded-md px-3 py-1 ${
                  product === "var" ? "bg-slate-800 text-slate-100" : "text-slate-400"
                }`}
              >
                변동형
              </button>
              <button
                type="button"
                onClick={() => setProduct("fixed")}
                className={`rounded-md px-3 py-1 ${
                  product === "fixed" ? "bg-slate-800 text-slate-100" : "text-slate-400"
                }`}
              >
                고정형
              </button>
            </div>
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            대출 원금
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={principalEok}
              onChange={(e) => setPrincipalEok(Number(e.target.value))}
              className="w-48 accent-amber-400"
            />
            <span className="font-mono font-semibold text-amber-300">
              {fmtNum(principalEok, 1)}억원
            </span>
          </label>
          <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
            {product === "var" ? "변동형" : "고정형"} 신규금리 {fmtPct(rateNow)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">월 이자(현재 금리)</div>
            <div className="mt-1 text-xl font-semibold text-slate-50">
              {fmtManWon(monthlyNow, 0)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">연 이자(12개월)</div>
            <div className="mt-1 text-xl font-semibold text-slate-50">
              {fmtManWon(monthlyNow !== null ? monthlyNow * 12 : null, 0)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">3년 전 금리 대비 월 이자</div>
            <div
              className={`mt-1 text-xl font-semibold ${
                diff3y === null ? "text-slate-500" : diff3y > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {diff3y === null
                ? "–"
                : `${diff3y > 0 ? "+" : ""}${fmtManWon(diff3y, 0).replace("-", "−")}`}
            </div>
            <div className="text-[11px] text-slate-500">
              금리 {fmtPp(rateNow !== null && rate3yAgo !== null ? rateNow - rate3yAgo : null)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">금리 ±1%p 시 월 이자</div>
            <div className="mt-1 text-xl font-semibold text-slate-50">
              ±{fmtManWon(sensPerPp, 0)}
            </div>
            <div className="text-[11px] text-slate-500">완만한 상환 무시(이자만)</div>
          </div>
        </div>

        <div className="mt-6">
          <PercentileBar
            pct={percentile}
            label={`현재 주담대(신규) 금리 ${fmtPct(rateNow)}의 2006년 이후 위치`}
          />
          {houseYoY !== null && (
            <p className="mt-3 text-xs text-slate-400">
              주택매매가격(전국)은 최근 1년{" "}
              <span className={houseYoY >= 0 ? "text-rose-300" : "text-emerald-300"}>
                {houseYoY > 0 ? "+" : ""}
                {fmtNum(houseYoY, 1)}%
              </span>{" "}
              — 집값 하락기에는 이자 부담과 자산 손실이 겹치는 이중 부담이 된다.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={`${principalEok}억원 빌렸을 때 월 이자의 역사`}
          sub="주담대 신규취급 금리 기준 · 같은 원금이어도 시기에 따라 월 이자가 크게 달랐다"
        />
        <MultiLineChart
          unit="만원"
          legend={false}
          series={[{ name: "월 이자", color, points: chartPoints }]}
        />
      </Card>
    </div>
  );
}
