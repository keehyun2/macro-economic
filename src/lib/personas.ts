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
    desc: "월 납입액이 고정돼 금리 변동에 상대적으로 방어적 — 금리 상승이 이득을 만들지는 않고, 하락기엔 갈아타 비용이 고려 대상. 만기 재고정 시점엔 그때 금리를 다시 적용받는다.",
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
    desc: "예금 금리가 오르면 이득, 물가가 더 오르면 실질 수익이 깎인다. 세전 실질 스프레드 = 예금금리 − 물가상승률이 승부처.",
    sens: { deposit: 1.0, baseRate: 0.4, cpiYoy: -1.2, usdkrw: -0.1 },
  },
  {
    id: "bondInvestor",
    emoji: "💼",
    name: "채권투자자",
    oneLine: "채권·채권펀드 보유 가계",
    desc: "금리가 내리면 채권값이 오르고, 오르면 평가손실 가능성이 커진다. 다만 만기까지 보유하면 액면 이자는 그대로 받는다 — 평가손과 실현손은 다르다. 물가 상승은 금리 인상 압력으로 이어진다.",
    sens: { tbond3y: -1.3, baseRate: -0.8, cpiYoy: -0.5 },
  },
  {
    id: "overseasInvestor",
    emoji: "🌏",
    name: "해외투자자",
    oneLine: "해외 주식·펀드로 투자하는 가계",
    desc: "해외 자산 수익은 현지 주가(미국 주가로 대리)와 환율이 함께 결정한다. 원화 약세(환율 상승)는 해외자산의 원화 평가를 끌어올리고, 원화 강세(환율 하락)는 통화 효과로 수익을 깎아먹는다.",
    sens: { usdkrw: 1.2, worldPct: 1.0, cpiYoy: -0.2 },
  },
  {
    id: "importConsumer",
    emoji: "🛒",
    name: "수입소비자 · 직구족",
    oneLine: "해외직구·수입품으로 소비하는 가계",
    desc: "원화 강세(환율 하락)는 직구·수입품을 원화 기준으로 싸게 만든다. 환율 상승은 그대로 지갑 부담이 되고, 수입물가는 소비자물가까지 밀어올린다.",
    sens: { usdkrw: -1.2, cpiYoy: -0.4 },
  },
  {
    id: "jeonseRenter",
    emoji: "🏚️",
    name: "전세족 · 세입자",
    oneLine: "전세 보증금을 묶어두고 사는 가계",
    desc: "전세가 상승은 갱신 때 더 큰 보증금을 요구한다 — 차액은 추가 저축이나 대출로 메워야 한다. 예금 금리 상승은 보증금을 불리는 저축의 수익을 높이고, 대출로 메우면 그 비용은 신용대출 금리를 따라간다.",
    sens: { jeonsePct: -1.2, deposit: 0.5, credit: -0.4, cpiYoy: -0.2 },
  },
  {
    id: "waitingBuyer",
    emoji: "🔑",
    name: "무주택 실수요 대기자",
    oneLine: "살 집을 찾아 모으고 기다리는 가계",
    desc: "집값 상승은 내야 할 총액을 키워 손해고, 금리 상승은 대출 비용을 키워 손해다 — 영끌족과 정반대 포지션. 다만 금리 상승이 집값을 누르는 반대 효과는 이 모델의 직접 효과에 들어 있지 않다. 예금 금리 상승은 계약금·중도금을 모으는 속도를 돕는다.",
    sens: { housePct: -1.2, mortgage: -0.5, baseRate: -0.3, deposit: 0.5 },
  },
  {
    id: "retiree",
    emoji: "👴",
    name: "은퇴자 · 연금생활자",
    oneLine: "고정 소득으로 지출을 맞추는 가계",
    desc: "소득이 물가를 따라가지 못한다 — 예금족과 같은 지표를 쓰지만 승부처가 '수익 경쟁'이 아니라 '지출 방어'라는 점이 다르다. 예금 금리 상승은 생계 자금의 이자 소득을 보태고, 환율 상승은 수입 물가를 밀어 올려 지출을 늘린다.",
    sens: { cpiYoy: -1.5, deposit: 0.6, usdkrw: -0.3 },
  },
  {
    id: "bizOwner",
    emoji: "🏭",
    name: "자영업자 · 사업자대출자",
    oneLine: "운전자금 대출로 장사를 이어가는 가계",
    desc: "빚투족의 차입이 '선택'이라면 이쪽 차입은 '생계'다 — 같은 금리 등락도 결이 다르다. 신용대출 금리 상승은 그대로 운전 비용이 되고, 금리 인상·물가 상승은 소비 위축과 원가 상승으로 매출까지 압박한다. 환율 상승은 수입 원자재 비용을 올린다.",
    sens: { credit: -1.2, baseRate: -0.4, cpiYoy: -0.4, usdkrw: -0.2 },
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
  worldPct: "미국 주가",
  housePct: "주택가격",
  jeonsePct: "전세가격",
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
