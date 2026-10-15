# 🌸 U-IKIGAI (powered by U-Pilot)

New here? Read [About This App](./ABOUT_THIS_APP.md) for a plain-language overview, features, demo boundaries, and setup instructions.

### *"U-topia With Meaning"* — Zero-Nerd Autonomous Finance for Everyday Humans

![Event](https://img.shields.io/badge/U--Hackathon_2026-FLOW_Summit_Bangkok-10B981?style=for-the-badge)
![Tracks](https://img.shields.io/badge/Tracks-Track_1_(AI)_%2B_Track_2_(Web3)-38BDF8?style=for-the-badge)
![Avalanche](https://img.shields.io/badge/Avalanche_Primary_Network-Fuji_C--Chain_(43113)-E84142?style=for-the-badge)
![UX](https://img.shields.io/badge/UX_Philosophy-Built_For_Humans_Not_Nerds-FBBF24?style=for-the-badge)

---

## Current Working Experience

The app has distinct **Desktop** and **Mobile** interfaces in English, Thai, and Spanish. Familiar tasks lead: pay, save, learn, and share. Desktop has persistent navigation and a money companion; mobile has its own home, balance card, touch-first screens, and bottom navigation. The **生き甲斐 · IKIGAI** selector sits directly above its task, full-width on mobile. Default **Offline practice** (Stage-Safe) runs prepared guidance in the browser. Progress stays on this device. Open **Preferences → Start a fresh practice** to reset.

The default wallet uses **sample money**. Approvals update the local ledger and create clearly labeled demo receipts. The mentor drawer contains an optional live Fuji contract inspector; it requires a deployed vault and your browser wallet. Live AI requires a server-side API key. Full setup, verified behavior, and the external integration boundaries are documented in [Implementation & Verification](./docs/06_IMPLEMENTATION_AND_VERIFICATION.md).

---

## 📚 Master Documentation Index

1. **[`AGENTS.md`](./AGENTS.md)** — Master system instructions, non-interactive build rules, TypeScript data contracts, and verification steps for OpenAI Codex CLI.
2. **[`docs/01_GOAL_AND_JUDGING.md`](./docs/01_GOAL_AND_JUDGING.md)** — Project thesis (*"U-topia With Meaning"*), the **"Zero-Nerd 10-Minute Rule"**, stakeholder alignment, and our 2-Gate Judging Strategy.
3. **[`docs/02_DESIGN_SYSTEM.md`](./docs/02_DESIGN_SYSTEM.md)** — Complete **"Calm Ikigai Futurism"** design system (deep meditative ink `#090F1A`, optical frosted glass, 4 Ikigai pillar color tokens, and breathing Framer Motion animations).
4. **[`docs/03_PILLARS_AND_FEATURES.md`](./docs/03_PILLARS_AND_FEATURES.md)** — Functional specification for all 4 Ikigai Pillar modules, the Jargon-Free Multilingual TTS Voice Engine (`EN` / `ภาษาไทย` / `ES`), the Hybrid LLM/Vision API (`/api/agent`), and the sticky **U-topia Non-Custodial Phone Simulator**.
5. **[`docs/04_AVALANCHE_AND_CONTRACT.md`](./docs/04_AVALANCHE_AND_CONTRACT.md)** — How U-Ikigai leverages the **Avalanche Primary Network (C-Chain, X-Chain, P-Chain)** + complete Solidity source code for `contracts/UIkigaiVault.sol`.
6. **[`docs/05_STAGE_PITCH_AND_DEMO.md`](./docs/05_STAGE_PITCH_AND_DEMO.md)** — Word-for-word 3-minute stage pitch script for Friday's finale and floor mentor Q&A walkthrough.

---

## 🌟 1. Executive Summary: Fixing "Nerd Crypto" for Everyday People

As U-topia CEO Emmanuel Quezada famously put it: *"Crypto is ugly—it's nerds creating nerd things for other nerds."* Normal people do not want to deal with `0x` hex addresses, seed-phrase anxiety, bridge exploits, or confusing gas tokens just to save money, pay a bill, or invest in their dreams.

* **U-topia** built the financial engine: a non-custodial super app supporting **135+ fiat currencies**, stablecoins (`USDT`/`USDC`), **U-Pay** tap-to-phone payments, **U-Card (Visa)**, and **Tokenized Real-World Assets** (`U-GOLD` Digital Gold, `BLK-SLV` BlackRock iShares Silver Trust, and fractional global stocks like `AMZN` & `TSLA`).
* **U.Center** built the human community and education DAO: **U Academy**, **U-AI**, and the global **`F0–F20` FLOW** network.

**U-Ikigai** unites both sides under one philosophy: **"U-topia With Meaning."** Built around the 4 Japanese pillars of **Ikigai** (*Passion, Vocation, Mission, Profession*), U-Ikigai strips away 100% of crypto nerd jargon. Using a **Calm Multilingual Voice & Vision AI Companion** backed by invisible **Avalanche C-Chain smart contract guardrails**, any everyday human—whether a freelancer, digital nomad, cafe owner, parent, or complete beginner—can master global non-custodial finance in **under 10 minutes**.

---

## 🧭 2. The 4 Pillars of U-Ikigai at a Glance

| Ikigai Pillar | Ecosystem Target | Module Name & Core "Zero-Nerd" Capability |
| :--- | :--- | :--- |
| **1. Passion** *(What You Love)* | **10-Min Human Onboarding** *(CEO Emmanuel Quezada)* | **Passion & Life-Goal RWA Vaults:** Zero-jargon 60-second voice-guided flow (`EN`/`ภาษาไทย`/`ES`) to fund a personal dream (travel, creative studio, first home) or send a `$10` gift of Tokenized Gold (`U-GOLD`), BlackRock Silver (`BLK-SLV`), or Stocks (`AMZN`) to anyone—no hex addresses required. |
| **2. Vocation** *(What You Are Good At)* | **U Academy & U-AI Utility** *(CAIO Maya Nicks)* | **Zero-Jargon Skill & Wealth Coach:** Translates complex finance into plain human language via a 2-minute interactive persona diagnostic, a custom 10-minute U Academy micro-course, and an Inflation Shield Simulator (`+50 U Academy XP`). |
| **3. Mission** *(What the World Needs)* | **U.Center DAO Growth** *(President Kyle Kemper & F0–F20 Voters)* | **U-Amplify & Compliance Shield:** LLM regulatory guardrail that strips out risky "guaranteed passive dividend" claims (per `u.center/terms`) and generates compliant 45-sec FLOW Summit viral video scripts + TTS voiceovers + referral QR cards. |
| **4. Profession** *(What You Get Paid For)* | **Agentic AI Payments** *(CEO Emmanuel Quezada & Avalanche)* | **U-Agent Pay & 4-Way Wealth Splitter:** Vision AI scans Bangkok `450 THB` bills (0% U-Pay fee vs. 14% Western Union fee) & open fridges (`1,250 THB` grocery auto-order), generates printable merchant U-Pay QR standees, and auto-splits income across 4 non-custodial Avalanche sub-vaults. |

---

## ⚡ 3. Instant Setup & Verification

```bash
# 1. Install dependencies
npm install --yes

# 2. Run local development server (Stage-Safe Mode works out-of-the-box with zero API keys)
npm run dev

# 3. Verify zero-error production build
npm run build
```
Open **`http://localhost:3000`** to launch the app. Small screens automatically start in the mobile experience.

### Preview the Web and Mobile Experiences

Use the **Desktop / Mobile** selector at the top, or open an experience directly:

- **Desktop:** `http://localhost:3000/desktop` — persistent navigation, spacious task workspace, and a money companion.
- **Mobile:** `http://localhost:3000/mobile` — dedicated home, balance card, bottom navigation, focused tasks, and approval sheets. Larger displays preview it at 430px.

Choose **Show me around** for a three-step introduction, or select one of the four familiar tasks. Saving uses three short steps; paying, receiving income, and merchant cards have separate tabs. Balances change only after **Yes, confirm**. Receipts live in **My money → Recent activity**.

### Verify the Experience

```bash
# Install the browser once for local UI checks
npx --yes playwright install chromium

# Browser journeys, wallet invariants, API errors, and contract compilation
npm test

# Production build with TypeScript checking
npm run build

# Serve the production app
npm start
```

The suite checks widths from 320px to 1440px, the position and all four choices of the Ikigai selector, translated approvals, persistence, cancellation, balances, stock holdings, one-time XP rewards, and operation with the network disabled. To include the production offline-reload check while `npm start` is running:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test
```

Production builds cache the app after the first online visit. Stage-Safe then supports a full reload without a network connection on localhost or HTTPS. Voice playback uses the device’s installed browser voices; unavailable voices are explained on screen. The development server intentionally does not install an offline worker.

### Enable Live AI or Fuji Contract Records

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, and restart the server. The default model is `gpt-5-mini`; override it with `OPENAI_MODEL`. Switch **Preferences → Offline practice** off to use live coaching, caption rewriting, scripts, or photo descriptions. Failed live requests show an error and never silently authorize a payment. API keys remain on the server.

For Fuji, open **Preferences → Mentor Architecture View → Optional live Fuji contract inspector** and choose **Deploy vault on Fuji with my wallet**. Your browser wallet must hold test AVAX and approve the deployment. The confirmed address is saved on this device; use **Connect & verify Fuji vault** afterward. An existing deployed address can also be entered manually or configured with `NEXT_PUBLIC_VAULT_ADDRESS` before building. The inspector verifies chain `43113` and contract code, checks the connected account before each write, and links actual submitted transaction hashes to the Fuji explorer. This integration stores USD values in **cents**. The supplied contract records metadata and events; it does not transfer tokens or enforce a gift maturity date. X-Chain and P-Chain remain documented architecture/roadmap items.

`npm run contract:build` compiles the exact document-04 Solidity source to an ABI/bytecode artifact at `public/contracts/UIkigaiVault.json`; development, production builds, and tests run this automatically. The artifact targets Cancun, following [Avalanche’s compiler compatibility guidance](https://build.avax.network/academy/blockchain/solidity-foundry/03-smart-contracts/03-foundry-quickstart). The tests also deploy this bytecode in an isolated local EVM, submit signed local transactions, and verify spending authorization, caps, reset behavior, split events, and gift storage. These execution tests do not contact Fuji or use real wallet keys.
