# 03 — Functional Specification: 4 Ikigai Pillars, TTS Voice & Phone Simulator

## 1. Jargon-Free Multilingual Calm TTS Voice Engine (`src/lib/tts.ts` & `src/lib/i18n.ts`)
- Supports 3 instant languages selectable from the top navbar:
  1. **English (`en` -> `en-US`)**
  2. **Thai (`th` -> `th-TH` — `ภาษาไทย`)**
  3. **Spanish (`es` -> `es-MX` — `Español`)**
- Speaks warm, plain-language human guidance (zero crypto jargon) whenever a user clicks a pillar or triggers **"🔊 Listen to Calm AI Guide"**.

---

## 2. Pillar 1: Passion (What You Love) -> `PassionLegacyModule.tsx`
### "Zero-Nerd Passion & Life-Goal Vaults (60-Second RWA Funding & Gifting)"
- **User Story:** Any everyday person—whether a young creator saving for a dream trip, a freelancer building a freedom fund, or a parent/grandparent gifting to family—can buy and lock appreciating Real-World Assets in 60 seconds without ever seeing a `0x` address, gas slider, or seed phrase.
- **Interactive Controls:**
  1. **Choose Who or What You Love (3 Universal Human Presets):**
     - **Preset A — Personal Dream & Passion Vault:** *"My Creative Studio / Sabbatical Travel Fund"*
     - **Preset B — Gift to Someone You Love (No Wallet Address Needed):** *"Send a Meaningful Asset Gift to a Partner, Friend, or Child Vault"*
     - **Preset C — Family Peace-of-Mind Cushion:** *"Multi-Generation Family Gold & Silver Reserve"*
  2. **Pick a Real-World Asset in Plain English (`$10` / `$25` / `$50`):**
     - **Tokenized Digital Gold (`U-GOLD`)** — *"Real physical gold value—protects your money when paper currency drops."*
     - **BlackRock Silver ETF (`BLK-SLV`)** — *"Wall Street silver fund made accessible from just $10."*
     - **Fractional Global Stock (`AMZN` / `TSLA`)** — *"Own a piece of the world's top tech companies."*
  3. **Attach Your Ikigai Meaning / Voice Note (Multilingual + TTS Preview):**
     - Pre-filled meaningful note in EN/TH/ES: *"Money is only a tool; this $25 of Digital Gold is dedicated to what truly matters in my life. U-topia with meaning."*
     - Button: **"🔊 Hear Meaning Note Aloud"**
  4. **Primary CTA Button:** **"🌸 Fund Passion Vault ($0 Nerd Jargon • 1 Tap)"**
     - Sends a `PendingSignatureRequest` to the right-hand `PhoneSimulator`.
     - Approving on the phone simulator converts `USDT` into `UGOLD`, `BLKSLV`, or `AMZN`, increments `vaultBalancesUsd.passion`, and logs the Avalanche Fuji C-Chain receipt (`0x8f2d...e491`) automatically in the background.

---

## 3. Pillar 2: Vocation (What You Are Good At) -> `VocationAcademyModule.tsx`
### "Zero-Jargon U-AI & U Academy 10-Minute Coach"
- **User Story:** Turns **U Academy** ("the Netflix of knowledge") and **U-AI** into a friendly personal mentor that translates intimidating finance/AI concepts into everyday human analogies.
- **Interactive Controls:**
  1. **Choose Your Everyday Human Profile (3 Instant Presets):**
     - **Profile 1: Creator, Freelancer & Digital Nomad** (*"Get paid globally in 135+ currencies without losing 5–14% to banks & PayPal"*)
     - **Profile 2: Local Cafe, Street Merchant or Tuk-Tuk Entrepreneur** (*"Accept tourist cards, stablecoins & gold right on your phone via U-Pay"*)
     - **Profile 3: Everyday Earner & Family Saver** (*"Stop losing purchasing power to local currency inflation—without learning complicated trading"*)
  2. **The "Nerd-to-Human" Jargon Translator & 10-Minute Micro-Course:**
     - Displays 3 bite-sized interactive cards showing:
       - *What Nerds Call It:* `"Non-Custodial Multi-Chain RWA Tokenization"` -> *What It Actually Means For You:* `"Your digital safe where only your fingerprint opens the door, holding real gold and dollars."*
     - Includes a **"🔊 Listen to 60-Second Plain-English Summary"** TTS button.
  3. **Interactive Purchasing-Power & Fee Saver Calculator:**
     - Slider for **Monthly Income / Cross-Border Transfer (`$100` to `$3,000`)**.
     - Compares **Old Banks & Western Union (Up to 14% fees + inflation loss)** vs. **U-topia Non-Custodial Account (0% P2P fees + stable USD/AUD/Gold)**.
  4. **Primary CTA Button:** **"🎓 Complete 10-Min Human Sandbox (+50 U Academy XP)"**
     - Increments `academyXp` by `+50` and raises `ikigaiHarmonyScore` by `+4%`.

---

## 4. Pillar 3: Mission (What the World Needs) -> `MissionAmplifyModule.tsx`
### "U-Amplify DAO Studio & Promoter Compliance Shield"
- **User Story:** Empowers U.Center community members (`F0–F20` FLOW ranks) to share the platform with friends and social followers in natural, authentic language while automatically stripping out illegal "get-rich-quick / guaranteed dividend" claims.
- **Interactive Controls:**
  1. **Part A — AI Regulatory Compliance Scanner (`u.center/terms` Guardrail):**
     - Editable textarea pre-loaded with a risky promoter post:
       `"Buy a $2,500 U.Center Diamond share package today for guaranteed 15% monthly passive dividends and guaranteed crypto profits!"`
     - Button: **"🛡️ Scan & Harmonize Into Authentic Compliant Copy"**
     - Highlights banned securities phrases in coral red and outputs a **100% Compliant, Human-First Rewrite** in English, Thai (`ภาษาไทย`), and Spanish focused on **zero-nerd financial literacy (U Academy), practical AI tools (U-AI), non-custodial freedom, and `F0–F20` FLOW community impact**.
  2. **Part B — FLOW Summit Bangkok 45-Second Viral Short & QR Generator:**
     - Topic Selector:
       - *"Finally: A Finance App Built for Normal Humans, Not Crypto Nerds"*
       - *"Why Paying 14% Remittance Fees Is History with U-topia"*
       - *"Finding Your Financial Ikigai at FLOW Summit Bangkok"*
     - Outputs a `[0:00–0:45]` TikTok/Reels script + **"🔊 Preview Voiceover (TTS)"** + a shareable **U.Center Ambassador Referral QR Card**.

---

## 5. Pillar 4: Profession (What You Get Paid For) -> `ProfessionAgentPayModule.tsx`
### "U-Agent Pay Vision Scanner, Merchant QR Standee & 4-Way Wealth Splitter"
- **User Story:** Lets anyone pay bills, restock groceries, accept business payments in 135+ currencies, and auto-budget their income simply by snapping a photo or speaking a sentence.
- **Interactive Controls:**
  1. **Part A — "U-Agent Pay" Vision & Autonomous Checkout (3 One-Click Demo Scenarios):**
     - **Scenario 1: Snap & Pay Bangkok Bill / QR (`450 THB` / `$13.50 USD`)**
       - Parses the Thai receipt, compares **0% U-Pay P2P Fee vs. 14% Western Union Fee ($1.89 saved)**, verifies the daily AI spending cap (`$13.50 <= $100.00 cap`), and triggers a 1-tap biometric approval on the Phone Simulator.
     - **Scenario 2: Smart Fridge Photo -> Autonomous Grocery Order (`1,250 THB` / `$37.50 USD`)**
       - Vision AI detects missing milk, eggs, and produce from a fridge photo, builds the cart, and prepares a virtual **U-Card (Visa)** checkout.
     - **Scenario 3: Plain-English Autonomous Rules ("Set & Forget")**
       - One-click rule chips:
         - *"✈️ Auto-book Bangkok-to-Brisbane flight when price drops below $420"*
         - *"🪙 Auto-move $25 into my Passion Gold Vault every Friday"*
  2. **Part B — Autonomous 4-Pillar Ikigai Income Splitter:**
     - Every time a freelancer, creator, or merchant receives a payment via **U-Pay**, the smart contract automatically splits it across their 4 Ikigai vaults (*50% Profession / Daily Spending*, *20% Passion / Dreams & Gold*, *15% Vocation / U Academy*, *15% Mission / Community*).
     - Button: **"⚡ Simulate Incoming 3,500 THB ($105 USD) Client / Merchant Payment"** animates the live split on the Phone Simulator.
  3. **Part C — Instant "U-Pay Business QR Standee" Generator:**
     - Generates a printable multilingual QR standee for any freelancer, cafe, or local vendor accepting 135+ currencies with 0% P2P fees.