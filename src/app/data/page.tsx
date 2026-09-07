import { AsOfChip, Card, Note, SectionTitle } from "@/components/ui";
import { loadAll, snapshotFetchedAt } from "@/lib/data";
import { SERIES_DEFS } from "@/lib/stat-codes";
import { latest } from "@/lib/series";
import { fmtNum, fmtT } from "@/lib/format";

export const revalidate = 21600;

export default async function DataPage() {
  const seriesList = await loadAll();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">📊 데이터와 출처</h1>
          <p className="mt-1 text-sm text-slate-400">
            이 사이트의 모든 수치는 한국은행 경제통계시스템(ECOS) Open API에서 온다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AsOfChip>스냅샷 생성 {fmtT(snapshotFetchedAt.slice(0, 7))}</AsOfChip>
        </div>
      </div>

      <section>
        <SectionTitle title="사용 통계표" sub={`${SERIES_DEFS.length}개 시계열 — 통계표코드/항목코드까지 전부 공개`} />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-2 py-2 font-medium">지표</th>
                <th className="px-2 py-2 font-medium">통계표 / 항목코드</th>
                <th className="px-2 py-2 font-medium">주기</th>
                <th className="px-2 py-2 text-right font-medium">최근 시점</th>
                <th className="px-2 py-2 text-right font-medium">최근 값</th>
                <th className="px-2 py-2 text-center font-medium">조회</th>
              </tr>
            </thead>
            <tbody>
              {SERIES_DEFS.map((def) => {
                const s = seriesList[def.key];
                const last = latest(s?.points ?? []);
                return (
                  <tr key={def.key} className="border-t border-slate-800">
                    <td className="px-2 py-2">
                      <div className="text-slate-200">{def.label}</div>
                      <div className="text-[10px] text-slate-500">{def.source}</div>
                    </td>
                    <td className="px-2 py-2 font-mono text-[11px] text-slate-400">
                      {def.table} / {def.item}
                    </td>
                    <td className="px-2 py-2 text-slate-400">
                      {def.period === "D" ? "일→월평균" : def.period === "M" ? "월" : "분기"}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-300">
                      {fmtT(last?.t)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-100">
                      {fmtNum(last?.v ?? null, 2)}
                      <span className="ml-1 text-[10px] text-slate-500">{def.unit}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          s?.live
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {s?.live ? "live" : "스냅샷"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <SectionTitle title="데이터 파이프라인" sub="신선도와 안전성을 어떻게 같이 챙기는지" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-slate-100">이중 공급: live + 스냅샷</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              페이지 요청 시 ECOS API를 서버에서 직접 조회하고(6시간 캐시, 일 1회 크론 재검증),
              조회가 실패하면 커밋된 스냅샷(<code className="text-slate-300">data/snapshots.json</code>)으로
              자동 폴백한다. ECOS가 해외 IP를 차단하거나 응답하지 않아도 사이트는 살아 있다.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-slate-100">인증키는 서버에만</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              ECOS 인증키는 환경변수(<code className="text-slate-300">ECOS_API_KEY</code>)로
              서버에서만 사용되며 브라우저로 전송되지 않는다. 일일 호출 한도 보호를 위해 동일 요청은
              캐시로 합친다.
            </p>
          </Card>
        </div>
        <Note>
          통계는 지연 공표된다: 금리계열은 대체로 익월 초, 소비자물가는 익월 초, 가계신용은 분기
          공표 후 수주일 뒤, KB 주택가격은 통상 익월 중반. &lsquo;최근 시점&rsquo; 열이 각 지표의 실제
          신선도다.
        </Note>
      </section>

      <section>
        <SectionTitle title="용어와 한계" sub="오독 방지" />
        <Card>
          <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-400">
            <li><b className="text-slate-300">신규취급 금리</b>: 해당 월에 새로 잡은 대출의 평균 금리. 기존 대출 금리(잔액 기준)보다 시장 상황을 빠르게 반영한다.</li>
            <li><b className="text-slate-300">잔액 기준 금리</b>: 대출·예금 잔액 전체의 평균 금리. 기존 계약이 끼워진 &lsquo;기존 고객 평균&rsquo;이며 신규 금리보다 움직임이 느리다.</li>
            <li><b className="text-slate-300">경기종합지수 순환변동치</b>: ECOS 수록값 그대로 사용(2020=100 지수형). 100을 기준으로 위아래로 읽는다.</li>
            <li><b className="text-slate-300">빚투 손익분기 수익률</b>: 은행 신규 신용대출 평균 금리로 근사했다. 증권사 마진론·카드론은 더 비싸다.</li>
            <li><b className="text-slate-300">실질 예금금리</b>: 정기예금(1년) 신규금리 − CPI 전년비. 세전 기준이라 일반과세 원천징수(15.4%)를 반영하면 더 낮아진다. 적금·보통예금 금리는 통상 더 낮다.</li>
            <li><b className="text-slate-300">레버리지 스프레드</b>: KOSPI 월평균 12개월 수익률 − 신용대출 금리. 개별 투자 성과가 아니라 시장 전체의 대표값이다.</li>
            <li><b className="text-slate-300">KB 주택가격지수</b>: ECOS 수록분(전국) 사용. 도심·극히 일부 단지 체감과는 차이가 있다.</li>
            <li>점수·시뮬레이션은 통계 기반 해석 도구이며 금융 상품 추천이 아니다.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
