# Implementation and verification

The first five documents define the product vision and stage story. This page distinguishes executable behavior from external services and records how to verify it.

## Executable user journeys

| Area | Implemented behavior | Verification |
| --- | --- | --- |
| Shared workspace | Distinct desktop/sidebar/companion and mobile/home/bottom-navigation experiences; plain-language task cards and helper; three-step tour; task-adjacent Ikigai selector; preferences | Browser checks at 320, 390, 768, 1024, and 1440px; selector above task and unobstructed; desktop/mobile switching; newcomer tour |
| Passion | Dream, named recipient, or family goal; gold, silver, Amazon or Tesla; $10/$25/$50; editable language-specific meaning notes; voice preview; approval and ledger update | Stock purchase and balance-conservation tests; retained selections; approval browser test |
| Vocation | Three personas, three expandable lessons, voice summary, local/live coach, monthly-income and inflation calculators, one-time 50 XP and 4 harmony points | Complete lessons, change pillars, verify saved XP; reward idempotence |
| Mission | Editable localized drafts, highlighted risky phrases in all languages, deterministic/local or live rewrite, topic-based scripts, voiceover, copy, referral QR save | Multilingual phrase tests; offline script/scan journeys; language switching |
| Profession | Prepared 450 THB bill and 1,250 THB fridge cart; optional live photo description; persistent automation rules and explicit example triggers; 3,500 THB income split; printable merchant QR with working local payment URL | Offline grocery approval; merchant link journey; exact split arithmetic |
| Wallet | Sample balances and holdings, desktop companion and dedicated money page, daily limit, shared approval/cancel and success dialogs, timestamped receipts, copy, persistent ledger and reset | Cancellation, payment, refresh, receipt inspection, double-confirm protection |
| Guardrails | Available-balance checks, cumulative daily cap, UTC daily reset, cap enforcement on automated savings, integer-cent arithmetic, harmony ceiling | Pure wallet invariant tests and confirmation-time revalidation |
| Voice | Official ElevenLabs SDK on the server; browser MP3 playback; English, Thai and Spanish; offline device voices; explicit fallback; Stop aborts pending requests and disposes audio | Provider/audio-adapter tests plus separately passed real generation and native Chromium playback in all three languages; audible quality remains device-dependent |
| Offline | Browser-local presets, production caching of /, /mobile, and /desktop after first load, no external fonts/images | Disconnect browser network, reload each route, use coach and payment presets |
| Live AI | Server-side U-Bot login/refresh, bounded text/image requests, UTF-8 stream parsing, explicit output language, timeout, input validation and safe errors | Auth/transport/schema/browser tests; opt-in real-provider checks and current verification limits in document 07 |
| AI companion | Contextual multi-turn conversation from home/header/tasks, per-answer live/offline labels, follow-ups, voice, photo preview, online-first automatic connection, labeled fallback and supported-action reviews; editable meaning-note drafting | See [AI integration and experience](./07_AI_EXPERIENCE.md) and tests/companion.spec.ts for transport, safety, multilingual and mobile verification; actual provider access still needs a configured key |
| Mentor | Native keyboard-accessible drawer; exact source; structured downloadable traces; runtime/roadmap distinctions | Open, inspect source, Escape close; contract source equality |
| Fuji | Optional browser-wallet deployment, missing-network setup, saved deployed address, chain/code validation, account revalidation, cap/split/spend/income/gift metadata writes, real receipt links | Deployment artifact/browser error checks, ABI encoding, wrong-chain refusal, and receipt handling; public execution still requires a funded testnet wallet |
| Solidity | Original specified source preserved exactly; reproducible Cancun deployment artifact | Compare source with document and inspector; compile with solc; deploy and execute signed transactions in a local EVM to prove authority/caps/reset/split events/gift storage |

## Run checks

```bash
npm ci --yes
npx --yes playwright install chromium
npm run build
npm test
```

The default test command starts or reuses a development server at `127.0.0.1:3001`. Production offline caching is intentionally disabled in development. For the complete production suite, serve the build with `npm start`, then run:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test
```

The default tests do not spend real money, sign an external transaction, or use real provider credentials. U-Bot and ElevenLabs tests replace upstream transport. The explicitly opt-in tests in `tests/live-providers.spec.ts` use configured provider accounts and may consume quota; see document 07 for their separate results. UI tests check the rendered app and exercise state changes rather than relying on a successful HTTP response alone.

Contract execution tests deploy the generated bytecode in an isolated EthereumJS EVM configured with chain ID 43113 and Cancun semantics. Disposable deterministic keys are used only in that in-memory state. This proves the compiled contract’s behavior but is not evidence of a public Fuji deployment. `npm run contract:build` emits the artifact and a SHA-256 fingerprint of the exact source; it is also run before development, production builds, and the test suite.

## External integration boundaries

- The default application is a financial simulator, and local demo receipts are not on-chain hashes.
- The optional Fuji inspector submits actual testnet contract records only after the user connects a wallet and confirms its own transaction prompt. It does not turn the demo ledger into a real payment processor.
- The supplied Solidity source is preserved verbatim. It records gifts and split events but contains no token transfers, escrow, withdrawals, or time-lock release. Its per-field default split behavior also cannot represent a configured zero allocation; production custody needs a separate contract design and review.
- X-Chain asset settlement, P-Chain L1 provisioning, U-Pay merchant acquisition, U-Card checkout, real stock/gold purchases, and beneficiary messaging require external integrations. The demo does not claim these are live.
- The saved automation rules are evaluated through **Run example** while the app is open. They do not schedule bookings or move funds after the browser closes.
- Merchant QR links open the application origin used to generate the card. A second device must be able to reach that origin. Referral cards encode the configured U.Center referral URL; external referral attribution is not tested here.
- Fee rates, currencies, and asset values are illustrative stage inputs. The caption scanner removes listed risky wording; it is not legal certification.
- A production offline reload requires an initial online visit and service-worker support on HTTPS or localhost. Local data remains on the device, and resetting the demo clears its sample ledger. Browser TTS requires installed voices for the chosen language.

## Stage rehearsal

1. Open /desktop. Use **Preferences → Start a fresh practice**. AI connects automatically; disconnect after loading to rehearse the saved-guide fallback. Show the newcomer guide with **Show me around**.
2. Choose **Pay & get paid**, select Thai, try the Bangkok bill, and choose **Yes, confirm**. Review the receipt in **My money → Recent activity**.
3. Open **Receive money**, simulate incoming 3,500 THB, and confirm all four allocations.
4. Use the **生き甲斐 · IKIGAI** selector above the task to choose **Dreams & gifts**. Follow purpose, amount, and meaning, then review the saving plan.
5. Choose **Learn & grow**, read all three lessons, and complete the sandbox to add 50 XP. The fee calculator is an optional disclosure.
6. Choose **Share & inspire**, scan the risky draft, then use **Make a video** to create a story and referral QR. Change language and preview the voiceover.
7. Open /mobile or select **Mobile**. Use its bottom navigation, open **Money**, and try another payment. Cancel with Escape or **Not now**.
8. Open **Preferences → Mentor Architecture View** to inspect traces and exact contract source. Show the live inspector only when a deployed vault and test wallet are available.

The redesigned product was checked with a successful production build and 41 passing production tests, including full offline reload of all three routes. Screenshot review covers desktop and mobile homes, the task-adjacent selector, payment review, preferences, and the mentor drawer. Additional browser checks cover keyboard tabs, all three voice languages, read-aloud preferences, restricted storage, QR saving, clipboard copy, printing, trace export, and saved automation rules. These checks do not establish usability-study results or a competition outcome.

## Redesign completion audit

| Requested outcome | Current implementation and evidence |
| --- | --- |
| Remake the whole human-facing experience | New home, navigation, task selector, progressive saving flow, focused payment/sharing tabs, dedicated money page, review/success dialogs, help and preferences. Existing ledger and contract behavior is preserved by invariant and local-EVM tests. |
| Separate desktop and mobile UX | Direct /desktop and /mobile routes plus automatic mobile selection on small screens. Desktop uses a sidebar and money companion; mobile uses a dedicated home, touch controls, bottom navigation, and approval sheet. Production browser tests verify both layouts and offline reload of each route. |
| Easy for people without technical knowledge | Familiar task labels, three-step guided introduction, plain-language intent routing, explanations before confirmation, larger text, language selection, voice guidance and optional details. Technical network data remains inside the mentor drawer. Newcomer, keyboard, language, cancellation and restricted-storage journeys pass. |
| Fix the 生き甲斐 control and redo its icon | Selector is directly above its active task and full-width on mobile. Native selection and all four destinations are verified unobstructed from 320–1440px. Shared four-petal SVG branding and app icon use the same design. |
| Preserve complete offline demo functionality | All four modules, assets, rewards, rules, income splitting, merchant links and receipts remain functional. API and wallet tests verify validation and arithmetic. Production checks pass with the browser disconnected. |
| Build and verification gate | npm run build exits 0; TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test reports 41 passed. |

The design is ready for a local stage rehearsal. Winning the competition, real-user ease-of-use outcomes, live AI availability, and public Fuji execution are not claimed by these implementation checks; external-service requirements remain documented above.

## Online-first update

At the user’s request, the manual Offline practice control was removed. The app tries U-Bot whenever connected, preserves clearly labeled deterministic guides when disconnected or a text provider is unavailable, and retries online with the next request. The shared system persona lives in `src/lib/persona.ts`; both AI routes use it. Photo failures do not fabricate analysis. Provider logos are local, attributed assets cached for offline reload. Routine browser tests replace provider requests to avoid billing configured accounts. Public Fuji deployment and real ElevenLabs generation are still not claimed.

## Branding and repository presentation update — 2026-10-16

The footer and chat header now include the official Avalanche symbol alongside U-Bot, U-topia and ElevenLabs. The compact header wraps its attribution label on narrow screens without hiding a logo or covering Close. Production offline reload verifies the new local asset on all three app routes.

The existing four-petal project mark is exported as transparent and dark-background 1024 × 1024 PNGs under `public/branding/`. `npm run logo:export` regenerates them from `public/icon.svg`. Tests verify their HTTP image types, dimensions, alpha channel, dark background and visible center.

The production build exits 0, and the production suite reports **85 passed, 3 skipped**. The skipped tests explicitly require real provider accounts; this branding check does not claim a new live-provider or Fuji deployment verification. Screenshot review covers desktop and mobile attribution at 320, 390 and 1440px. README screenshots can be refreshed against the running production server with `npm run docs:screenshots`; that capture command disables provider transport and does not consume account quota.

## Streaming and submission-media update — 2026-10-16

U-Pilot now forwards explanation-text deltas to the browser, displays a provisional draft and waits for the completed validated reply before exposing actions, follow-ups or read-aloud. Stop, disconnects and invalid output cannot turn a partial reply into an approved plan or a history message. Connection labels distinguish configuration from an observed live answer. The production suite reports **96 passed, 4 skipped**; upstream buffering limits and separate real-provider observations are recorded in [the AI guide](./07_AI_EXPERIENCE.md#streaming-and-connection-status-update).

## Voice and recovery follow-up — 2026-10-16

At this recovery checkpoint, the production build exited 0 and the full production suite reported **106 passed, 4 skipped**. Ten added checks covered changing read-aloud while a reply is pending, synchronous/asynchronous device-speech failures, missing language voices, a failing device cancellation API, verified-answer status colors, and negative financial instructions in English, Thai and Spanish. Voice failure/fallback explanations appear inside the chat's visible status line, not only in a page toast behind its modal. A 320px Thai browser capture was reviewed for the missing-language notice. Offline reload, wallet arithmetic, explicit approval and exact-contract execution checks still pass. Ordinary tests replace provider transport; the later real ElevenLabs checks below supersede the missing-key limitation. See the [recovery record](./07_AI_EXPERIENCE.md#voice-and-intent-recovery-update).

## ElevenLabs SDK and real playback fix — 2026-10-16

The current production build exits 0; the full production suite reports **116 passed, 5 skipped**. The voice fix removes a stale-status gate, uses the official ElevenLabs SDK server-side with no automatic billable retries, preserves Thai support when a v2 model is configured, and gives safe, localized setup/authorization/quota/voice/load explanations. The unavailable local voice setting was corrected to the SDK example voice without changing or exposing the existing API key.

Two separately opted-in real ElevenLabs checks passed: MP3 generation in English, Thai and Spanish, and native Chromium decoding/playback in all three languages despite a deliberately failed status probe. The speech API and browser playback were not replaced in that test; only U-Bot conversation transport was isolated. Offline reload, wallet approval/invariants and contract execution still pass. Provider secrets remain Git-ignored and are absent from the changed tracked files and built browser assets. These results do not verify pronunciation on every device or a public deployment; hosted environments need their own private configuration and access protections. See the [SDK/live playback record](./07_AI_EXPERIENCE.md#elevenlabs-sdk-and-live-playback-fix).

The [submission media pack](./submission-media/README.md) contains one cover and five framed screenshots, all 1920 × 1080 PNGs. The cover combines original generated artwork with the existing logo and typeset copy. Screenshots are actual browser captures, including a real U-Bot reply, a sample gift note, an unconfirmed bill review and English/Thai/Spanish mobile homes. They are not generated UI mockups or evidence of real financial settlement.
