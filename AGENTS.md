# AGENTS.md — OpenAI Codex CLI Master Build Specification

## 1. MANDATORY CODEX CLI OPERATING RULES
1. **Core UX Rule ("For Humans, Not Nerds"):**
   - This app is built for **everyday people who are NOT crypto or finance nerds** (freelancers, creators, travelers, local shop owners, parents, students, and families).
   - Never expose raw intimidating crypto jargon on the main user surface without a warm, plain-language human translation. Hide hex addresses, gas settings, and ABI details inside the toggleable **"Mentor Architecture View"** drawer (`MentorDrawer.tsx`) so everyday users experience pure calm while technical judges can still inspect the under-the-hood Web3 mechanics.
2. **Read All Linked Docs First:** Before generating or modifying code, read:
   - `docs/01_GOAL_AND_JUDGING.md`
   - `docs/02_DESIGN_SYSTEM.md`
   - `docs/03_PILLARS_AND_FEATURES.md`
   - `docs/04_AVALANCHE_AND_CONTRACT.md`
   - `docs/05_STAGE_PITCH_AND_DEMO.md`
3. **Non-Interactive Execution Only:** Never run CLI commands that block waiting for user input. Always pass `--yes` or `-y`.
4. **Complete Implementation — Zero Stubs:** Never write `// TODO` or placeholder text. Every button, preset, language switch (`en`, `th`, `es`), TTS voice trigger, and wallet transaction must function end-to-end.
5. **SSR & Hydration Safety:** Guard browser-only APIs (`window`, `window.speechSynthesis`, `navigator.clipboard`) inside `typeof window !== 'undefined'` checks and `"use client"` components.
6. **Stage-Safe Offline Guarantee (`<150ms`):** All features must work 100% offline or on congested conference Wi-Fi using rich deterministic responses in `src/lib/presetData.ts` when `stageSafeMode` is enabled (default `true`), while supporting live LLM API keys in `/api/agent/route.ts` when `stageSafeMode` is toggled off.
7. **Mandatory Build Gate:** Always run `npm run build` after editing files and fix any TypeScript or ESLint errors until exit code is `0`.

---

## 2. TARGET REPOSITORY FILE TREE

```text
├── README.md
├── AGENTS.md
├── docs/
│   ├── 01_GOAL_AND_JUDGING.md
│   ├── 02_DESIGN_SYSTEM.md
│   ├── 03_PILLARS_AND_FEATURES.md
│   ├── 04_AVALANCHE_AND_CONTRACT.md
│   └── 05_STAGE_PITCH_AND_DEMO.md
├── contracts/
│   └── UIkigaiVault.sol
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── api/
    │       └── agent/
    │           └── route.ts
    ├── components/
    │   ├── Navbar.tsx
    │   ├── IkigaiCompass.tsx
    │   ├── PhoneSimulator.tsx
    │   ├── MentorDrawer.tsx
    │   └── pillars/
    │       ├── PassionLegacyModule.tsx
    │       ├── VocationAcademyModule.tsx
    │       ├── MissionAmplifyModule.tsx
    │       └── ProfessionAgentPayModule.tsx
    └── lib/
        ├── types.ts
        ├── i18n.ts
        ├── tts.ts
        └── presetData.ts
```

---

## 3. CORE TYPESCRIPT CONTRACTS (`src/lib/types.ts`)

```typescript
export type LanguageCode = 'en' | 'th' | 'es';

export type PillarId = 'passion' | 'vocation' | 'mission' | 'profession';

export interface IkigaiSplit {
  professionPct: number; // Default 50% (Daily Living & U-Card)
  passionPct: number;    // Default 20% (Life Goals, Dreams & Family Legacy)
  vocationPct: number;   // Default 15% (U Academy & U-AI Skills)
  missionPct: number;    // Default 15% (U.Center DAO & Community Impact)
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
    USDT: number;   // Default 1250.00
    THB: number;    // Default 18500
    AUD: number;    // Default 450.00
    MXN: number;    // Default 3200
    UGOLD: number;  // Default 310.00 (Tokenized Digital Gold)
    BLKSLV: number; // Default 220.00 (BlackRock iShares Silver Trust)
  };
  ikigaiSplit: IkigaiSplit;
  vaultBalancesUsd: {
    profession: number;
    passion: number;
    vocation: number;
    mission: number;
  };
  academyXp: number;          // Default 120
  ikigaiHarmonyScore: number; // Default 88 -> increases up to 100 as user interacts
  dailyAiCapUsd: number;      // Default 100.00
  spentTodayUsd: number;      // Default 14.50
  transactions: WalletTransaction[];
  pendingSignature: PendingSignatureRequest | null;
}
```

## 4. IMPLEMENTATION VERIFICATION

- Preserve the core type contracts and the exact Solidity source from document 04; compatible optional state fields may extend the demo.
- Run `npm test` for browser journeys, wallet invariants, API validation, and contract compilation. Browser installation is non-interactive: `npx --yes playwright install chromium`.
- Verify offline reload against a production build: `TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test` with `npm start` running.
- Keep sample ledger receipts distinct from real transaction hashes. Show raw network details only inside the mentor view. Document required live configuration and verification limits in `docs/06_IMPLEMENTATION_AND_VERIFICATION.md`.
- A green build alone does not prove responsive layout, complete localization, offline behavior, or payment invariants. Exercise those user journeys before claiming completion.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
