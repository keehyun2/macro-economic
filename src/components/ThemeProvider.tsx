"use client";

// 다크(기본)/화이트 테마 전환 — <html>의 .light 클래스와 localStorage로 상태를 유지한다.
// 최초 페인트 전에 layout.tsx의 인라인 스크립트가 클래스를 이미 설정하므로
// DOM 클래스를 외부 스토어로 읽는다(useSyncExternalStore — 이펙트 없이 하이드레이션 후 동기화).
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

const THEME_KEY = "theme";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 시크릿 모드 등 단순 저장 실패는 무시한다.
  }
  for (const l of listeners) l();
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => {
    applyTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "화이트 테마로 전환" : "다크 테마로 전환"}
      title={theme === "dark" ? "화이트 테마" : "다크 테마"}
      className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-hover hover:text-soft"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

// 차트 프레임 색 — recharts의 SVG 속성(stroke 등)에는 CSS 변수를 쓸 수 없어
// 테마에 따라 실제 색값을 내려준다.
export interface ChartColors {
  grid: string;
  axis: string;
  refLine: string;
  refLabel: string;
  /** 빈 원 마커의 구멍을 채울 배경색(카드 배경과 동일). */
  dotFill: string;
}

const CHART_COLORS: Record<Theme, ChartColors> = {
  dark: {
    grid: "#1e293b",
    axis: "#94a3b8",
    refLine: "#475569",
    refLabel: "#f59e0b",
    dotFill: "#0f172a",
  },
  light: {
    grid: "#e2e8f0",
    axis: "#475569",
    refLine: "#94a3b8",
    refLabel: "#b45309",
    dotFill: "#ffffff",
  },
};

export function useChartColors(): ChartColors {
  const { theme } = useTheme();
  return CHART_COLORS[theme];
}
