// 시리즈별 차트 색상 (대시보드/하위 페이지 공통).
// 다크·화이트 두 테마 위에서 모두 읽히는 중간 톤(500~600단계)으로 맞췄다.
export const COLORS = {
  baseRate: "#f59e0b", // amber-500
  tbond3y: "#64748b", // slate-500
  mortgage: "#f43f5e", // rose-500
  mortgageFixed: "#c026d3", // fuchsia-600
  mortgageVar: "#f43f5e", // rose-500
  credit: "#f97316", // orange-500
  deposit: "#0ea5e9", // sky-500
  cpi: "#10b981", // emerald-500
  cpiYoy: "#10b981", // emerald-500
  usdkrw: "#8b5cf6", // violet-500
  kospi: "#06b6d4", // cyan-500
  housePrice: "#ec4899", // pink-500
  hhDebt: "#6366f1", // indigo-500
  hhMortgageDebt: "#a855f7", // purple-500
  econSentiment: "#ca8a04", // yellow-600
  realRate: "#f97316", // orange-500
  savings: "#14b8a6", // teal-500
  mmda: "#64748b", // slate-500
  mortgageOut: "#fb7185", // rose-400
  cd91: "#65a30d", // lime-600
  corpBond3y: "#d946ef", // fuchsia-500
  jeonse: "#3b82f6", // blue-500
  jeonseApt: "#60a5fa", // blue-400
  // 소비자물가(emerald)와 색이 겹치지 않도록 보라 계열로 분리.
  ppi: "#8b5cf6", // violet-500
  bankDeposits: "#0ea5e9", // sky-500
  leadingIdx: "#f97316", // orange-500
  coincidentIdx: "#ca8a04", // yellow-600
  m2: "#6366f1", // indigo-500
  currentAccount: "#10b981", // emerald-500
} as const;

export type ColorKey = keyof typeof COLORS;
