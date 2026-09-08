// SNS·메신저 링크 미리보기용 OG 이미지(1200x630)를 생성해 public/og-image.png로 저장한다.
// 결과물은 커밋되므로 평소에는 네트워크 없이 동작하고, 디자인을 바꿀 때만 다시 실행한다.
//   npm run og
// 한글 폰트(나눔고딕)를 google/fonts 저장소에서 내려받아 렌더링에만 사용한다.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createElement } from "react";
// next 16의 package.json에 exports 맵이 없어 순수 Node ESM은 확장자까지 명시해야 한다.
import { ImageResponse } from "next/og.js";

const SIZE = { width: 1200, height: 630 };

const FONT_URLS = [
  "https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Bold.ttf",
  "https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-ExtraBold.ttf",
];

async function loadFont() {
  for (const url of FONT_URLS) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok) {
      const data = Buffer.from(await res.arrayBuffer());
      if (data.length > 100_000) return { name: "NanumGothic", data };
    }
  }
  throw new Error("나눔고딕 폰트를 내려받지 못했습니다. 네트워크 상태를 확인하세요.");
}

// globals.css 다크 테마 토큰과 같은 색상을 쓴다.
const C = {
  app: "#0b1120",
  inset: "#1e293b",
  line: "#334155",
  strong: "#f8fafc",
  soft: "#cbd5e1",
  muted: "#94a3b8",
  dim: "#64748b",
  up: "#34d399",
  down: "#fb7185",
  info: "#7dd3fc",
  accent: "#fbbf24",
};

function Radar({ size }) {
  const ring = (d, color, width) =>
    createElement("div", {
      style: {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: d,
        height: d,
        borderRadius: "50%",
        border: `${width}px solid ${color}`,
        transform: "translate(-50%, -50%)",
      },
    });
  const r = size / 2;
  // 블립(탐지된 지표) — 링 위에 정확히 올린다. 각도는 12시 방향 기준 시계 방향.
  const blip = (radius, angleDeg, d, color) => {
    const rad = (angleDeg * Math.PI) / 180;
    const x = r + radius * Math.sin(rad);
    const y = r - radius * Math.cos(rad);
    return createElement("div", {
      style: {
        position: "absolute",
        left: Math.round(x - d / 2),
        top: Math.round(y - d / 2),
        width: d,
        height: d,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 24px ${color}`,
      },
    });
  };
  return createElement(
    "div",
    {
      style: {
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
      },
    },
    ring(size, C.line, 2),
    ring(Math.round(size * 0.72), C.line, 2),
    ring(Math.round(size * 0.44), C.line, 2),
    // 스캔 영역(90도 부채꼴) — 좌하단 꼭짓점이 레이더 중심에 오도록 배치
    createElement("div", {
      style: {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: r,
        height: r,
        transform: "translate(0, -100%)",
        background: `linear-gradient(to top right, rgba(52,211,153,0.4), rgba(52,211,153,0))`,
        borderRadius: "0 100% 0 0",
      },
    }),
    blip(r - 1, 52, 18, C.down),
    blip(Math.round(size * 0.36), 128, 14, C.accent),
    blip(Math.round(size * 0.22), 78, 12, C.info)
  );
}

function Chip({ label, color }) {
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 22px",
        borderRadius: "9999px",
        border: `2px solid ${color}`,
        color,
        fontSize: "26px",
        fontWeight: 700,
      },
    },
    createElement("div", {
      style: {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: color,
      },
    }),
    label
  );
}

async function main() {
  const font = await loadFont();

  const element = createElement(
    "div",
    {
      style: {
        ...SIZE,
        display: "flex",
        background: `linear-gradient(135deg, ${C.app} 55%, #101a33 100%)`,
        fontFamily: "NanumGothic",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 24px 72px 80px",
          flex: 1,
        },
      },
      createElement(
        "div",
        { style: { display: "flex", color: C.up, fontSize: "28px", fontWeight: 700, marginBottom: "22px" } },
        "한국은행 ECOS 공식 통계 기반"
      ),
      createElement(
        "div",
        { style: { display: "flex", fontSize: "88px", fontWeight: 700, color: C.strong, lineHeight: 1.15 } },
        "가계금융 레이더"
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "38px",
            color: C.soft,
            marginTop: "18px",
            lineHeight: 1.4,
          },
        },
        "영끌·빚투·예금, 이자 부담과 수익을 한눈에"
      ),
      createElement(
        "div",
        { style: { display: "flex", gap: "16px", marginTop: "44px" } },
        createElement(Chip, { label: "영끌", color: C.down }),
        createElement(Chip, { label: "빚투", color: C.accent }),
        createElement(Chip, { label: "예금", color: C.info })
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "460px",
          padding: "0 64px 0 0",
        },
      },
      createElement(Radar, { size: 380 })
    )
  );

  const image = new ImageResponse(element, {
    ...SIZE,
    fonts: [{ ...font, style: "normal", weight: 700 }],
  });
  const out = join(process.cwd(), "public", "og-image.png");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await image.arrayBuffer()));
  console.log(`생성 완료: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
