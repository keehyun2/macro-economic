"use client";

// 전문 용어 툴팁 — 마우스 올리기·탭·키보드 포커스로 짧은 정의가 뜬다.
// 정의 텍스트는 항상 DOM에 두고(SEO·보조기기) 보임만 토글한다.
// 위치: 열릴 때 용어 위치를 측정해 뷰포트 좌우 끝으로 넘어가면 안으로 밀어 넣고,
// 위쪽 공간이 부족하면 아래로 뒤집는다(모바일 화면 가장자리·상단 용어 대응).
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TERMS, type TermId } from "@/lib/terms";

// 서버 렌더에서는 useLayoutEffect가 경고를 내므로 환경에 따라 골라 쓴다.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const info = TERMS[id];
  const [open, setOpen] = useState(false);
  // hover(데스크톱)로 이미 열려 있으면 click 토글이 다시 닫지 않게 한다.
  // 모바일 탭은 브라우저가 mouseenter를 합성해 열어주므로 click은 동작 없음,
  // 다른 곳을 탭하면 mouseleave가 와서 닫힌다.
  const hovered = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useIsoLayoutEffect(() => {
    if (!open) return;
    const btn = btnRef.current;
    const tip = tipRef.current;
    if (!btn || !tip) return;

    const place = () => {
      const vw = window.innerWidth;
      const r = btn.getBoundingClientRect();
      const w = Math.min(300, vw - 32);
      const PAD = 12;
      // 폭을 먼저 확정해야 줄바꿈 뒤의 실제 높이로 뒤집을지 판단할 수 있다.
      tip.style.width = `${w}px`;
      const idealLeft = r.left + r.width / 2 - w / 2;
      const clamped = Math.min(Math.max(idealLeft, PAD), Math.max(PAD, vw - w - PAD));
      // tip의 위치 기준은 이 컴포넌트의 래퍼 span(≈ 버튼)이므로 버튼 좌측으로 환산.
      tip.style.left = `${clamped - r.left}px`;
      const below = r.top < tip.offsetHeight + 20;
      tip.style.top = below ? "calc(100% + 6px)" : "";
      tip.style.bottom = below ? "" : "calc(100% + 6px)";
    };
    place();
    // 열려 있는 동안 스크롤·리사이즈로 용어가 움직이면 다시 맞춘다.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, id]);

  return (
    <span className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        aria-describedby={tipId}
        aria-expanded={open}
        onMouseEnter={() => {
          hovered.current = true;
          setOpen(true);
        }}
        onMouseLeave={() => {
          hovered.current = false;
          setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => {
          if (!hovered.current) setOpen((v) => !v);
        }}
        className="cursor-help text-inherit underline decoration-dotted decoration-info underline-offset-4"
      >
        {children ?? info.term}
        <sup className="ml-0.5 text-[0.65em] font-normal text-info" aria-hidden="true">
          ?
        </sup>
      </button>
      <span
        ref={tipRef}
        id={tipId}
        role="tooltip"
        className={`absolute z-30 rounded-lg border border-line-strong bg-pop px-3 py-2 text-left text-xs leading-relaxed text-body shadow-xl transition-opacity duration-100 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <b className="text-soft">{info.term}</b>
        <br />
        {info.def}
      </span>
    </span>
  );
}
