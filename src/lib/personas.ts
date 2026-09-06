// 페르소나 정의와 점수 모델.
// 점수 = clamp(50 × Σ(민감도 × 정규화 요인 z), −100, +100).
// 민감도 부호: +는 그 요인의 상승이 이득, −는 손해. 크기는 민감도 배수.
import type { FactorKey, FactorState } from "./indicators";

export type Z = Partial<Record<FactorKey, number>>;

export interface Persona {
  id: string;
  emoji: string;
  name: string;
  oneLine: string;
  desc: string;
  sens: Z;
}

export const PERSONAS: Persona[] = [
  {
    id: "variableMortgage",
    emoji: "🏠",
    name: "영끌족 · 변동금리",
    oneLine: "변동금리 주택담보대출로 산 집",
    desc: "금리가 오르면 이자가 바로 늘고, 집값 상승은 자산 이득. 원금 대비 이자 부담이 시장 상황을 그대로 따라간다.",
    sens: { baseRate: -1.2, mortgage: -0.8, cpiYoy: -0.4, usdkrw: -0.2, housePct: 0.8 },
  },
  {
    id: "fixedMortgage",
    emoji: "🔒",
    name: "영끌족 · 고정금리",
    oneLine: "고정금리 주담대로 락인한 집",
    desc: "금리 상승기엔 낮은 금리에 묶어둔 기회이득, 하락기엔 갈아타 비용이 고려 대상. 만기 재고정 시점엔 방향이 뒤집힌다.",
    sens: { baseRate: 0.3, cpiYoy: -0.3, housePct: 0.8 },
  },
  {
    id: "debtInvestor",
    emoji: "📈",
    name: "빚투족",
    oneLine: "빌린 돈으로 투자하는 가계",
    desc: "차입 비용(신용대출 금리) 대비 자산 수익(KOSPI)의 싸움. 금리가 오르면 손익분기선이 같이 올라간다.",
    sens: { credit: -1.2, baseRate: -0.4, kospiPct: 1.2, cpiYoy: -0.2 },
  },
  {
    id: "saver",
    emoji: "🏦",
    name: "예금족",
    oneLine: "예금·적금으로 모으는 가계",
    desc: "예금 금리가 오르면 이득, 물가가 더 오르면 실질 수익이 깎인다. 실질금리 = 예금금리 − 물가상승률이 승부처.",
    sens: { deposit: 1.0, baseRate: 0.4, cpiYoy: -1.2, usdkrw: -0.1 },
  },
  {
    id: "bondInvestor",
    emoji: "💼",
    name: "채권투자자",
    oneLine: "채권·채권펀드 보유 가계",
    desc: "금리가 내리면 채권값이 오른다(이득), 금리가 오르면 평가손. 물가 상승은 금리 인상 압력으로 이어진다.",
    sens: { tbond3y: -1.3, baseRate: -0.8, cpiYoy: -0.5 },
  },
  {
    id: "overseas",
    emoji: "✈️",
    name: "해외투자자 · 수입소비자",
    oneLine: "환율에 노출된 가계",
    desc: "원화 약세(환율 상승)는 해외투자 평가에 이득, 수입 소비자에겐 손해 — 같은 화살표의 반대 방향.",
    sens: { usdkrw: 1.2, cpiYoy: -0.2 },
  },
];

export type Verdict = "win" | "neutral" | "lose";

export interface Contribution {
  factor: FactorKey;
  label: string;
  /** 지표의 실제 움직임 방향(정규화 z의 부호) — 태그 화살표는 이 값을 따른다. */
  factorZ: number;
  /** 이 지표가 페르소나에 미친 영향(민감도 × z) — 태그 색은 이 부호를 따른다. */
  impact: number;
}

export interface PersonaScore {
  persona: Persona;
  score: number;
  verdict: Verdict;
  contributions: Contribution[]; // |영향| 큰 순
}

const FACTOR_LABELS: Record<FactorKey, string> = {
  baseRate: "기준금리",
  tbond3y: "국고채(3년)",
  mortgage: "주담대 금리",
  credit: "신용대출 금리",
  deposit: "예금 금리",
  cpiYoy: "물가상승률",
  usdkrw: "원/달러",
  kospiPct: "KOSPI",
  housePct: "주택가격",
};

export function verdictOf(score: number): Verdict {
  if (score >= 20) return "win";
  if (score <= -20) return "lose";
  return "neutral";
}

export function scorePersona(persona: Persona, z: Z): PersonaScore {
  let raw = 0;
  const contributions: Contribution[] = [];
  for (const [k, sens] of Object.entries(persona.sens) as [FactorKey, number][]) {
    const zv = z[k] ?? 0;
    const impact = sens * zv;
    raw += impact;
    if (Math.abs(impact) >= 0.05)
      contributions.push({ factor: k, label: FACTOR_LABELS[k], factorZ: zv, impact });
  }
  const score = Math.round(Math.max(-100, Math.min(100, raw * 50)));
  return {
    persona,
    score,
    verdict: verdictOf(score),
    contributions: contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3),
  };
}

/** 최근 3개월 시장 상태를 z 벡터로. */
export function currentZ(factors: Record<FactorKey, FactorState>): Z {
  const z: Z = {};
  for (const f of Object.values(factors)) z[f.def.key] = f.z;
  return z;
}
