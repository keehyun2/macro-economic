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
  savings: "#2dd4bf", // teal-400
  mmda: "#94a3b8", // slate-400
  mortgageOut: "#fda4af", // rose-300
  cd91: "#a3e635", // lime-400
  corpBond3y: "#d946ef", // fuchsia-500
  jeonse: "#60a5fa", // blue-400
  jeonseApt: "#93c5fd", // blue-300
  ppi: "#86efac", // green-300
  bankDeposits: "#0ea5e9", // sky-500
  leadingIdx: "#fb923c", // orange-400
  coincidentIdx: "#facc15", // yellow-400
  m2: "#6366f1", // indigo-500
  currentAccount: "#10b981", // emerald-500
} as const;

export type ColorKey = keyof typeof COLORS;
