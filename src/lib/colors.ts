// 시리즈별 차트 색상 (대시보드/하위 페이지 공통).
export const COLORS = {
  baseRate: "#fbbf24", // amber
  tbond3y: "#94a3b8", // slate
  mortgage: "#fb7185", // rose
  mortgageFixed: "#e879f9", // fuchsia
  mortgageVar: "#fb7185", // rose
  credit: "#fb923c", // orange
  deposit: "#38bdf8", // sky
  cpi: "#34d399", // emerald
  cpiYoy: "#34d399",
  usdkrw: "#a78bfa", // violet
  kospi: "#22d3ee", // cyan
  housePrice: "#f472b6", // pink
  hhDebt: "#818cf8", // indigo
  hhMortgageDebt: "#c084fc", // purple
  econSentiment: "#facc15", // yellow
  realRate: "#f97316", // orange-500
} as const;

export type ColorKey = keyof typeof COLORS;
