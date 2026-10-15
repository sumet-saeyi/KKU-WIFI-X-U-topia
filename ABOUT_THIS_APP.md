# About This App — U-Ikigai

## Money with meaning. Built for everyday people.

U-Ikigai is a multilingual financial companion prototype that connects money with the things that matter in life: everyday needs, personal dreams, useful skills, and community.

It is designed for freelancers, creators, travelers, shop owners, students, parents, and families—not just people who already understand finance or crypto. Familiar tasks and short explanations lead the experience. Technical details stay in a separate mentor view.

**The current app is an interactive demo using sample money. It is not a bank, brokerage, or live payment service.**

## Why Ikigai?

生き甲斐, or *Ikigai*, is commonly understood as a reason for being. U-Ikigai uses this idea to ask a practical question: what would you like your money to help you do?

The product’s slogan is **“U-topia With Meaning.”** Its aim is to make financial tools feel connected to life rather than complicated technology.

## Four familiar ways to begin

| In the app | What you can try | Ikigai theme |
| --- | --- | --- |
| **Pay & get paid** | Review a sample bill or grocery order, simulate receiving income, and create a printable merchant payment QR card. | Profession: everyday work and income |
| **Dreams & gifts** | Choose a dream, a loved one, or your family’s future; select a sample gold, silver, or stock holding; and attach a personal meaning note. | Passion: what you love |
| **Learn & grow** | Explore three short lessons, ask a coach for guidance, compare illustrative fees and purchasing power, and earn learning points. | Vocation: skills and confidence |
| **Share & inspire** | Review a caption for risky promises, create a 45-second video script, preview its narration, and save a referral QR code. | Mission: helping others |

**My money** brings sample balances, holdings, recent activity, and receipts together. A **生き甲斐 · IKIGAI** selector above each task lets you change focus without losing your in-session choices.

## Different experiences for desktop and mobile

Desktop provides persistent side navigation, a spacious workspace, and a money companion alongside the current task.

Mobile has its own home screen, a balance card, focused task screens, bottom navigation, and payment-review sheets. It is not simply a smaller desktop layout.

After starting the app locally, open:

- [Home](http://localhost:3000/) — automatically starts with the mobile experience on small screens.
- [Desktop](http://localhost:3000/desktop) — opens the desktop experience directly.
- [Mobile](http://localhost:3000/mobile) — opens the mobile experience directly; larger screens show a compact preview.

These are local development addresses, not public deployment links.

## A comfortable first try

1. Choose **Show me around** for a short introduction, or select **Pay & get paid**.
2. Try the **Bangkok bill** example for 450 THB.
3. Read the amount, purpose, and payment explanation. Choose **Yes, confirm** to update the sample ledger, or **Not now** to cancel.
4. Open **My money → Recent activity** to view your receipt.
5. Explore **Dreams & gifts**, which guides you through purpose, amount, and meaning in three steps.

No real payment is made by these demo actions. The home-screen helper also accepts familiar requests such as “I want to save” and takes you to the relevant task.

## Language, voice, and accessibility

The everyday interface supports **English, Thai, and Spanish**. You can change language in the header or in **Preferences**.

Read-aloud guidance explains tasks in the selected language. Automatic narration can be turned off, while individual listening controls remain available. Actual voice availability depends on the browser and voices installed on the device.

The interface includes keyboard-operable tabs, visible focus indicators, reduced-motion support, readable text, and touch-friendly controls.

## Designed for unreliable Wi-Fi

**Offline practice** is enabled by default. Prepared coaching, sample payment scenarios, caption review, and video scripts run locally without an AI API key.

A production build caches the app for offline reload after an initial online visit. This requires service-worker support and HTTPS or localhost. The development server does not enable offline reload caching. External referral destinations and connected services still require a network connection.

Sample balances, completed lessons, saved rules, language, and view preferences are stored in the browser on the current device. They are not a cloud-synced account. Use **Preferences → Start a fresh practice** to reset the sample ledger and learning progress.

## What is real, and what is simulated?

The interface, local balance calculations, approval flow, learning progress, copy controls, QR generation, downloads, and printable cards are implemented interactions.

Payments, grocery purchases, stock and precious-metal holdings, and incoming income use sample data. Demo receipts are not blockchain transaction hashes. Saved automation rules run only when you explicitly try their example; they do not book flights or move money after the browser closes.

An optional connected AI mode needs server-side configuration. A separate **Preferences → Mentor Architecture View** exposes the contract source, tool traces, architecture, and an optional Avalanche Fuji testnet inspector. The inspector requires a compatible browser wallet and test funds for actual testnet writes. The supplied contract records metadata and events; it does not transfer assets or enforce gift-release dates. X-Chain and P-Chain integrations remain architecture and roadmap items.

Fees, exchange values, and asset amounts are illustrative. Caption review helps identify listed risky wording; it is not legal certification. The app does not promise investment returns.

## Run the app

From the repository folder, with Node.js and npm available:

```bash
npm ci --yes
npm run dev
```

Open [localhost:3000](http://localhost:3000/). Default offline-practice features need no API key or connected wallet.

For a production build:

```bash
npm run build
npm start
```

To run the automated checks:

```bash
npx --yes playwright install chromium
npm test
```

For production offline-reload tests, keep `npm start` running in one terminal and run this in another:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test
```

## Behind the experience

The app uses Next.js, React, and TypeScript, with browser-local demo state, deterministic offline guidance, native SVG visuals, QR tools, and an optional Solidity contract workflow. Playwright tests cover user journeys alongside wallet invariants, API validation, and isolated local contract execution.

See the [main README](./README.md) for project background and configuration, and [Implementation & Verification](./docs/06_IMPLEMENTATION_AND_VERIFICATION.md) for detailed behavior, test coverage, and external-service limits.
