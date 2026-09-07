// 라우트 전환 즉시 뜨는 스켈레톤 — 서버 렌더가 끝나기 전에도 피드백을 준다.
// (프로덕션은 정적 페이지라 거의 표시되지 않고, 개발/재검증 중 첫 방문에 의미가 있다.)
export default function Loading() {
  return (
    <div className="space-y-6 py-8">
      <div className="h-6 w-64 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-900/70" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-900/70" />
      <div className="h-72 animate-pulse rounded-xl bg-slate-900/70" />
    </div>
  );
}
