<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 가계금융 레이더 (macro-economic)

부모 저장소(vlog Eclipse 플러그인)의 규칙은 이 하위 프로젝트에 적용되지 않는다.
이 프로젝트는 Next.js 16 + TypeScript 웹앱이다. 프로젝트 규칙은 `README.md`와
`PLAN.md`를 먼저 읽을 것. 핵심만 요약:

- 시리즈 정의(통계표·항목코드)의 단일 진실 원천은 `data/series.json`. 앱
  (`src/lib/stat-codes.ts`)과 스냅샷 스크립트(`scripts/fetch-snapshots.mjs`)가 함께 읽는다.
- 정규화 로직(TIME → `YYYY-MM`/`YYYYQn`, 일별 → 월평균)은 `scripts/fetch-snapshots.mjs`와
  `src/lib/ecos.ts`가 서로 mirror 관계다. 한쪽을 고치면 반드시 양쪽을 고칠 것.
- `ECOS_API_KEY`는 서버 환경변수로만 존재. 어떤 파일에도 커밋하지 않는다
  (`.env.local`은 gitignore됨). `data/snapshots.json`은 키를 포함하지 않으므로 커밋된다.
- `data/snapshots.json`은 live ECOS 조회 실패 시의 폴백이자 로컬 개발 데이터다.
  갱신은 `ECOS_API_KEY=... npm run refresh`.
- 페르소나 점수 모델의 가정(민감도·정규화 척도)은 `src/lib/personas.ts`와
  `src/lib/indicators.ts`에 있다. 수치를 바꾸면 /matrix 페이지의 '점수 모델 전문'도
  함께 갱신해야 한다.
