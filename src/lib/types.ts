export type LanguageCode = 'en' | 'th' | 'es';

export type ExperienceMode = 'web' | 'mobile';

export type PillarId = 'passion' | 'vocation' | 'mission' | 'profession';

export interface IkigaiSplit {
  professionPct: number;
  passionPct: number;
  vocationPct: number;
  missionPct: number;
}

export interface WalletTransaction {
  id: string;
  title: string;
  pillar: PillarId;
  amountText: string;
  usdEquivalent: number;
  feeSavedText: string;
  txHash: string;
  timestamp: string;
  chain: string;
}

export interface PendingSignatureRequest {
  id: string;
  title: string;
  subtitle: string;
  pillar: PillarId;
  amountText: string;
  usdValue: number;
  routeDescription: string;
  feeComparison: string;
  guardrailCheck: string;
  intentHash: string;
  onConfirmAction: 'FUND_GOLD_GOAL' | 'FUND_SILVER_GOAL' | 'FUND_STOCK_GOAL' | 'PAY_THB_BILL' | 'ORDER_FRIDGE_GROCERIES' | 'SPLIT_INCOME';
  assetSymbol?: 'UGOLD' | 'BLKSLV' | 'AMZN' | 'TSLA';
  meaningNote?: string;
  recipient?: string;
  goal?: string;
  isAutomated?: boolean;
}

export interface ToolCallTrace {
  id: string;
  timestamp: string;
  pillar: PillarId;
  toolName: string;
  inputParams: Record<string, unknown>;
  guardrailStatus: 'PASSED_NON_CUSTODIAL_CAP' | 'REWRITTEN_COMPLIANT_DAO_TERMS' | 'VERIFIED_AVAX_SESSION';
  latencyMs: number;
  avalancheChain: 'C-Chain (Fuji 43113)' | 'X-Chain Asset Rail' | 'P-Chain Subnet Spec';
  outputSummary: string;
}

export interface WalletState {
  totalUsdValue: number;
  balances: {
    USDT: number;
    THB: number;
    AUD: number;
    MXN: number;
    UGOLD: number;
    BLKSLV: number;
  };
  ikigaiSplit: IkigaiSplit;
  vaultBalancesUsd: {
    profession: number;
    passion: number;
    vocation: number;
    mission: number;
  };
  academyXp: number;
  ikigaiHarmonyScore: number;
  dailyAiCapUsd: number;
  spentTodayUsd: number;
  transactions: WalletTransaction[];
  pendingSignature: PendingSignatureRequest | null;
  stockBalancesUsd?: { AMZN: number; TSLA: number };
  spendingDay?: string;
  completedCourses?: string[];
  activeRules?: string[];
}

export interface AgentResponse {
  text: string;
  latencyMs: number;
  source: 'stage-safe' | 'live';
}
