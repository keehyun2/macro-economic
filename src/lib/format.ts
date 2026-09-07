// 표시 형식 유틸 (ko-KR 관례).
export function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  return v.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(v: number | null | undefined, digits = 2): string {
  return `${fmtNum(v, digits)}%`;
}

/** 부호 붙은 비율점(%p) — 금리 변화 등. */
export function fmtPp(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const s = v > 0 ? "+" : "";
  return `${s}${fmtNum(v, digits)}%p`;
}

export function fmtSigned(v: number | null | undefined, digits = 2, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const s = v > 0 ? "+" : "";
  return `${s}${fmtNum(v, digits)}${suffix}`;
}

/** 십억원 → 조원. */
export function fmtTrillionWon(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  return `${fmtNum(v / 1000, digits)}조원`;
}

/** 원 → 만원. */
export function fmtManWon(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  return `${fmtNum(v / 10000, digits)}만원`;
}

/** 부호 붙인 만원 — 시뮬레이터 증감 표시용(음수 기호는 유니코드 −). */
export function fmtManWonSigned(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  return `${v > 0 ? "+" : ""}${fmtManWon(v, digits).replace("-", "−")}`;
}

/** '2026-08' | '2026Q2' → '2026.08' | '2026년 2Q'. */
export function fmtT(t: string | undefined, style: "dot" | "long" = "dot"): string {
  if (!t) return "–";
  if (t.includes("Q")) {
    const [y, q] = [t.slice(0, 4), t.slice(5)];
    return style === "dot" ? `${y}.${q}` : `${y}년 ${q}분기`;
  }
  const [y, m] = [t.slice(0, 4), t.slice(5, 7)];
  return style === "dot" ? `${y}.${m}` : `${y}년 ${Number(m)}월`;
}
