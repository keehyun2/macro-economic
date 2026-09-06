# 가계금융 레이더 — 영끌·빚투 부담 지표

한국은행 경제통계시스템([ECOS](https://ecos.bok.or.kr/api/)) Open API의 공식 통계만으로
"지금 같은 금융시장에서 누가 이득이고 누가 손해인가"를 보여주는 웹 대시보드.

- **대시보드** — 핵심 지표 8종 + 이번 달 승자·패자(6개 가계 페르소나 점수)
- **영끌족** — 월 이자 시뮬레이터(원금 슬라이더, 변동/고정 토글), 금리 역사 백분위,
  가계 주택관련대출 규모, 집값 전년비
- **빚투족** — 손익분기 수익률(신용대출 금리), 레버리지 스프레드(KOSPI 12M − 차입금리)
- **승자·패자** — 현재 시장 상태, 시나리오(금리×물가×환율) × 페르소나 히트맵,
  과거 국면 리플레이(코로나 저금리기 · 긴축 인상기 · 최근 1년), 점수 모델 전문 공개
- **데이터** — 사용 통계표 15종(통계표/항목코드 포함)과 데이터 시점, 이용 안내

배포: https://macro-economic.vercel.app (Vercel Hobby, 서울 리전 `icn1`, 일 1회 크론 재검증)

## 기술 스택

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Recharts · Vercel

## 아키텍처 요약

```
data/series.json          시리즈 정의의 단일 진실 원천 (통계표·항목코드·조회범위)
data/snapshots.json       ECOS 전 수계열 스냅샷 (커밋됨 — 폴백용, npm run refresh 로 갱신)
scripts/fetch-snapshots.mjs  스냅샷 생성 스크립트 (정규화 로직은 src/lib/ecos.ts와 동기)
src/lib/
  ecos.ts                 서버 전용 ECOS 클라이언트 (Next fetch 캐시 6h, 'ecos' 태그)
  data.ts                 loadSeries: live 조회 → 실패/불량 시 스냅샷 폴백
  series.ts               순수 시계열 유틸 (전년비, n개월 변화, 백분위, 조인)
  indicators.ts           파생 지표·시장 요인(정규화 z) 계산
  personas.ts             페르소나 6종 정의 + 점수 모델
src/app/                  페이지 5종 + /api/refresh (크론용 재검증 엔드포인트)
```

- 인증키는 **서버 환경변수로만** 존재(`ECOS_API_KEY`) — 브라우저로 전송 안 됨.
- 모든 페이지는 정적 생성 + 6시간 재검증. Vercel 크론이 매일 09:30(KST)에
  `/api/refresh`(Bearer `CRON_SECRET`)로 캐시와 페이지를 재검증한다.
- ECOS 일일 호출 한도 보호: 동일 요청은 fetch 캐시로 합쳐진다. ECOS가 응답하지 않으면
  커밋된 스냅샷으로 자동 폴백해 사이트가 죽지 않는다.

## 개발

```bash
npm install
ECOS_API_KEY=발급받은키 npm run refresh   # data/snapshots.json 갱신 (선택)
npm run dev                               # http://localhost:3000
npm run build                             # 프로덕션 빌드
```

환경변수 (`.env.local`, 커밋 금지):

| 변수 | 설명 |
|---|---|
| `ECOS_API_KEY` | [ECOS Open API](https://ecos.bok.or.kr/api/) 인증키 |
| `CRON_SECRET` | `/api/refresh` Bearer 토큰 (Vercel 크론이 자동으로 싣는다) |

## 배포 / 데이터 갱신

```bash
vercel deploy --prod          # 배포 (환경변수는 대시보드 또는 vercel env add)
```

- 일상적 갱신은 자동: 페이지 재검증(6h) + 크론(일 1회)이 live 조회를 당겨온다.
- ECOS가 배포 리전에서 응답하지 않게 되면(국외 IP 차단 등) 스냅샷 폴백으로 전환되고,
  이때는 로컬에서 `npm run refresh` 후 커밋·푸시하면 된다.

## 통계 출처

한국은행 경제통계시스템(ECOS) — 기준금리·대출/예금 금리·시장금리·환율·가계신용·
경제심리지수, 그리고 ECOS에 수록된 통계청(소비자물가)·KB 주택가격 동향(주택매매가격지수).
통계표·항목코드 전체 목록은 사이트의 /data 페이지와 `data/series.json` 참조.

본 사이트는 공식 통계 기반의 정보 제공 목적이며 금융 상품 추천·자문이 아니다.
