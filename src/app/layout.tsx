import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ThemeProvider, ThemeToggle } from "@/components/ThemeProvider";
import "./globals.css";

// 카카오톡 등 링크 미리보기(og:image)는 절대 URL이 필요하다.
// Vercel 빌드 시 VERCEL_PROJECT_PRODUCTION_URL이, 로컬에서는 localhost가 기본값.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "가계금융 레이더 — 영끌·빚투 부담 지표",
  description:
    "한국은행 경제통계시스템(ECOS) 공식 통계로 보는 영끌족·빚투족·예금족의 이자 부담·수익과 금융시장 상황별 이득·손해.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "가계금융 레이더",
    title: "가계금융 레이더 — 영끌·빚투 부담 지표",
    description:
      "한국은행 경제통계시스템(ECOS) 공식 통계로 보는 영끌족·빚투족·예금족의 이자 부담·수익과 금융시장 상황별 이득·손해.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "가계금융 레이더 — 영끌·빚투·예금 부담 지표",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "가계금융 레이더 — 영끌·빚투 부담 지표",
    description:
      "한국은행 경제통계시스템(ECOS) 공식 통계로 보는 영끌족·빚투족·예금족의 이자 부담·수익과 금융시장 상황별 이득·손해.",
    images: ["/og-image.png"],
  },
};

// 첫 페인트 전에 저장된 테마를 <html>에 반영해 화이트 테마에서 다크 플래시가 나지 않게 한다.
const themeInit = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-app text-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ThemeProvider>
          <header className="sticky top-0 z-20 border-b border-line bg-app/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg">📡</span>
                <span className="text-sm font-bold tracking-tight text-strong">
                  가계금융 레이더
                </span>
                <span className="hidden text-xs text-dim sm:inline">
                  영끌·빚투·예금 부담 지표
                </span>
              </Link>
              {/* min-w-0: 모바일에서 nav(overflow-x-auto)가 부모 폭보다 커도
                  그룹이 수축할 수 있게 해 페이지 가로 스크롤을 막는다. */}
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <Nav />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mt-12 border-t border-line px-4 py-6 text-center text-xs leading-relaxed text-dim">
            <p>
              출처: 한국은행 경제통계시스템(ECOS) · 통계청 · KB주택가격동향(ECOS 수록분).
              지연 공표 통계 기반이므로 각 지표의 데이터 시점이 다를 수 있습니다.
            </p>
            <p className="mt-1">
              본 사이트는 공식 통계에 기반한 정보 제공 목적이며, 투자·대출 등 금융 상품의 추천이나
              자문이 아닙니다. 인증키 등 민감 정보는 서버에서만 처리됩니다.
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
