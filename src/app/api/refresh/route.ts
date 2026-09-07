// Vercel 크론이 일 1회 호출 — 'ecos' 태그 fetch 캐시와 정적 페이지를 재검증해
// 최신 통계를 당겨온다. CRON_SECRET이 설정된 경우 Bearer 토큰을 확인한다
// (Vercel 크론은 CRON_SECRET 환경변수를 자동으로 Bearer 헤더에 실어 보낸다).
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

const PATHS = ["/", "/youngkul", "/debt-invest", "/saver", "/matrix", "/data"];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  revalidateTag("ecos", "max");
  for (const p of PATHS) revalidatePath(p, "page");
  return Response.json({ ok: true, revalidated: PATHS, at: new Date().toISOString() });
}
