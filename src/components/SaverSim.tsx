"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts";
import { Card, PercentileBar, SectionTitle } from "@/components/ui";
import { COLORS } from "@/lib/colors";
import { delta, latest } from "@/lib/series";
import { fmtManWon, fmtNum, fmtPct, fmtPp } from "@/lib/format";
import type { Point } from "@/lib/series";

const SINCE = "2012-01"; // 정기예금(1년) 신규금리가 확보되는 시점
const TAX = 0.154; // 이자소득 원천징수 세율(이자소득세 14% + 지방소득세 1.4%)

export function SaverSim({
  rates,
  interest,
  realRate,
  cpiYoy,
  percentile,
  asOf,
}: {
  rates: Point[];
  interest: Point[]; // 원금 1억 기준 월 이자(만원)
  realRate: number | null; // 현재 실질예금금리(%)
  cpiYoy: number | null; // 현재 물가상승률(CPI 전년비, %)
  percentile: number | null; // 현재 예금금리의 2012년 이후 백분위
  asOf: string;
}) {
  const [principalEok, setPrincipalEok] = useState(1);
  const [tax, setTax] = useState<"pre" | "post">("post");

  const rateNow = latest(rates)?.v ?? null;
  const rate3yAgo = useMemo(
    () => (rates.length ? (delta(rates, 36) !== null ? rateNow! - delta(rates, 36)! : null) : null),
    [rates, rateNow]
  );

  const factor = tax === "post" ? 1 - TAX : 1;
  const monthlyNow = rateNow !== null ? (principalEok * 1e8 * (rateNow / 100) * factor) / 12 : null;
  const monthly3y =
    monthlyNow !== null && rate3yAgo !== null
      ? (principalEok * 1e8 * (rate3yAgo / 100) * factor) / 12
      : null;
  const diff3y = monthlyNow !== null && monthly3y !== null ? monthlyNow - monthly3y : null;
  // 1년 뒤 실질 구매력 변화 = 세후 연이자 − 원금의 물가상승분
  const realGain =
    monthlyNow !== null && cpiYoy !== null
      ? monthlyNow * 12 - (principalEok * 1e8 * cpiYoy) / 100
      : null;

  const chartPoints = useMemo(
    () =>
      interest
        .filter((p) => p.t >= SINCE)
        .map((p) => ({ t: p.t, v: Math.round(p.v * principalEok * factor * 10) / 10 })),
    [interest, principalEok, factor]
  );

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="예치금 이자 시뮬레이터"
          sub={`정기예금(1년) 만기일시 지급식 · 단리 가정 · 데이터 시점 ${asOf}`}
          right={
            <div className="flex rounded-lg border border-slate-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTax("pre")}
                className={`rounded-md px-3 py-1 ${
                  tax === "pre" ? "bg-slate-800 text-slate-100" : "text-slate-400"
                }`}
              >
                세전
              </button>
              <button
                type="button"
                onClick={() => setTax("post")}
                className={`rounded-md px-3 py-1 ${
                  tax === "post" ? "bg-slate-800 text-slate-100" : "text-slate-400"
                }`}
              >
                세후(15.4%)
              </button>
            </div>
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            예치 원금
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={principalEok}
              onChange={(e) => setPrincipalEok(Number(e.target.value))}
              className="w-48 accent-sky-400"
            />
            <span className="font-mono font-semibold text-sky-300">
              {fmtNum(principalEok * 10000, 0)}만원
            </span>
          </label>
          <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
            정기예금(1년) 신규금리 {fmtPct(rateNow)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">월 이자({tax === "post" ? "세후" : "세전"})</div>
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
            <div className="text-[11px] text-slate-400">1년 뒤 실질 구매력 변화</div>
            <div
              className={`mt-1 text-xl font-semibold ${
                realGain === null ? "text-slate-500" : realGain >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {realGain === null
                ? "–"
                : `${realGain > 0 ? "+" : ""}${fmtManWon(realGain, 0).replace("-", "−")}`}
            </div>
            <div className="text-[11px] text-slate-500">
              {tax === "post" ? "세후" : "세전"} 연이자 − 물가상승분({fmtPct(cpiYoy, 1)})
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] text-slate-400">3년 전 금리 대비 월 이자</div>
            <div
              className={`mt-1 text-xl font-semibold ${
                diff3y === null ? "text-slate-500" : diff3y > 0 ? "text-emerald-400" : "text-rose-400"
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
        </div>

        <div className="mt-6">
          <PercentileBar
            pct={percentile}
            label={`현재 정기예금(1년) 신규금리 ${fmtPct(rateNow)}의 2012년 이후 위치`}
          />
          {realRate !== null && (
            <p className="mt-3 text-xs text-slate-400">
              현재 실질예금금리는{" "}
              <span className={realRate >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {fmtPp(realRate, 1)}
              </span>{" "}
              —{" "}
              {realRate >= 0
                ? "예금 이자가 물가 상승분을 넘어 구매력이 불어나는 구간이다."
                : "물가가 이자를 깎아먹어 원금의 구매력이 줄어드는 구간이다."}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={`${fmtNum(principalEok, 1)}억원을 예치했을 때 월 이자의 역사`}
          sub={`정기예금(1년) 신규취급 금리 기준 · ${tax === "post" ? "세후(15.4% 원천징수)" : "세전"} · 같은 원금이어도 시기에 따라 이자가 크게 달랐다`}
        />
        <MultiLineChart
          unit="만원"
          legend={false}
          series={[{ name: "월 이자", color: COLORS.deposit, points: chartPoints }]}
        />
      </Card>
    </div>
  );
}
