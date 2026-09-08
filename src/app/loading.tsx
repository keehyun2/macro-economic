// 라우트 전환 즉시 뜨는 스켈레톤 — 서버 렌더가 끝나기 전에도 피드백을 준다.
// (프로덕션은 정적 페이지라 거의 표시되지 않고, 개발/재검증 중 첫 방문에 의미가 있다.)
export default function Loading() {
  return (
    <div className="space-y-8 py-8" aria-busy="true">
      <span className="sr-only">페이지를 불러오는 중</span>
      {/* 기준일 칩 행 */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-44 animate-pulse rounded-full bg-inset" />
        ))}
      </div>
      {/* KPI 타일 8칸 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[6.5rem] animate-pulse rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-6 w-40 animate-pulse rounded bg-inset" />
      <div className="h-80 animate-pulse rounded-xl bg-card" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-card" />
        <div className="h-72 animate-pulse rounded-xl bg-card" />
      </div>
    </div>
  );
}
