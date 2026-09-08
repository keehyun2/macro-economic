"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts";
import { Card, PercentileBar, SegToggle, SectionTitle, SimStat } from "@/components/ui";
import { COLORS } from "@/lib/colors";
import { delta, latest, since } from "@/lib/series";
import { fmtManWon, fmtManWonSigned, fmtNum, fmtPct, fmtPp } from "@/lib/format";
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
  // 3년 전 금리 = 현재 − (3년 새 변화량). delta는 최근 값 기준이므로 한 번만 호출한다.
  const d3y = delta(rates, 36);
  const rate3yAgo = d3y !== null && rateNow !== null ? rateNow - d3y : null;

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
  // 세후 실질수익률(근사, 단리) = 세후 명목금리 − CPI 전년비 — 세전 스프레드(realRate)와 병기용
  const realAfterTax =
    rateNow !== null && cpiYoy !== null ? rateNow * (1 - TAX) - cpiYoy : null;

  const chartPoints = useMemo(
    () =>
      since(interest, SINCE).map((p) => ({
        t: p.t,
        v: Math.round(p.v * principalEok * factor * 10) / 10,
      })),
    [interest, principalEok, factor]
  );

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="예치금 이자 시뮬레이터"
          sub={`정기예금(1년) 만기일시 지급식 · 단리 가정 · 데이터 시점 ${asOf}`}
          right={
            <SegToggle
              value={tax}
              onChange={setTax}
              options={[
                { value: "pre", label: "세전" },
                { value: "post", label: "세후(15.4%)" },
              ]}
            />
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm text-soft">
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
          <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted">
            정기예금(1년) 신규금리 {fmtPct(rateNow)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SimStat label={`월 이자(${tax === "post" ? "세후" : "세전"})`} value={fmtManWon(monthlyNow, 0)} />
          <SimStat
            label="연 이자(12개월)"
            value={fmtManWon(monthlyNow !== null ? monthlyNow * 12 : null, 0)}
          />
          <SimStat
            label="1년 뒤 실질 구매력 변화"
            value={fmtManWonSigned(realGain)}
            tone={realGain === null ? "muted" : realGain >= 0 ? "good" : "bad"}
            sub={`${tax === "post" ? "세후" : "세전"} 연이자 − 물가상승분(${fmtPct(cpiYoy, 1)})`}
          />
          <SimStat
            label="3년 전 금리 대비 월 이자"
            value={fmtManWonSigned(diff3y)}
            tone={diff3y === null ? "muted" : diff3y > 0 ? "good" : "bad"}
            sub={`금리 ${fmtPp(rateNow !== null && rate3yAgo !== null ? rateNow - rate3yAgo : null)}`}
          />
        </div>

        <div className="mt-6">
          <PercentileBar
            pct={percentile}
            label={`현재 정기예금(1년) 신규금리 ${fmtPct(rateNow)}의 2012년 이후 위치`}
          />
          {realRate !== null && (
            <p className="mt-3 text-xs text-muted">
              현재 세전 실질 스프레드는{" "}
              <span className={realRate >= 0 ? "text-up" : "text-down"}>
                {fmtPp(realRate, 1)}
              </span>
              , 이자소득세 15.4%를 빼면 세후 실질수익률(근사)은{" "}
              {realAfterTax !== null && (
                <span className={realAfterTax >= 0 ? "text-up" : "text-down"}>
                  {fmtPp(realAfterTax, 1)}
                </span>
              )}
              다 —{" "}
              {realAfterTax === null
                ? ""
                : realAfterTax >= 0
                ? "세후 이자가 물가 상승분을 넘어 구매력이 불어나는 구간이다."
                : "세후 이자가 물가 상승분을 따라가지 못해 원금의 구매력이 줄어드는 구간이다."}
              {realRate >= 0 && realAfterTax !== null && realAfterTax < 0 &&
                " 세전엔 플러스여도 세후로는 마이너스로 뒤집힐 수 있다."}
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
