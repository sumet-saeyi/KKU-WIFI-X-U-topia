# AI integration and experience

## U-Pilot in the app

Ask U-Pilot from the header, the home-screen question box, or any task. People can ask follow-up questions, hear replies, attach a photo in connected mode, or review a suggested next step. Desktop has a conversation dialog; mobile has a focused screen and a keyboard-sized composer.

The same U-Bot connection powers the learning coach, editable meaning-note drafts, caption rewriting, video scripts, grocery explanations and uploaded-photo descriptions. AI only explains or proposes; it never directly executes payments.

## Online first, automatic saved-guide backup

U-Pilot tries **U-Bot automatically** whenever the browser has a connection. There is no Offline practice switch. A missing or failed status check does not disable the next live request.

- Successful replies are labeled **U-Bot**.
- With no network, saved guides in `src/lib/presetData.ts` run locally without a model request. They say **Saved guide · not live AI**.
- If a live text request fails because of unavailable configuration or service, chat shows a saved guide with an explicit fallback notice. Feature drafts also retain their actual source. The next question tries U-Bot again; a failure never permanently locks the app into a local mode.
- Reconnecting updates the UI automatically. Already-sent questions are not resubmitted in the background.
- Photos never fall back to invented descriptions. Failed photo requests keep the attachment available for an explicit retry. Cancellation and invalid model proposals remain errors, not successful fallback answers.
- ElevenLabs is used when its server key is present and a connection is available. Otherwise the selected-language device voice remains available with a clear provider label.

Configuration checks show only credential presence. They do not prove login, remaining quota, voice access, or generation.

## U-Pilot system persona

`src/lib/persona.ts` is the shared system persona for both conversation and feature routes. It defines U-Pilot as a warm, calm, nonjudgmental Ikigai companion: answer the question first, use everyday language, and ask at most one focused clarifying question. Meaningful steps may be small, ordinary, and free; the assistant does not push every question toward investing.

The four app areas guide exploration of dreams and loved ones, skills, community, and everyday work. They are an app framework, not a claim that all ikigai fits a four-circle career diagram. English, Thai (ฉัน/คุณ), and Mexican Spanish have consistent identity and localized introductions.

Persona, task/output requirements, and supplied context are separated following the [official OpenAI prompt engineering guidance](https://developers.openai.com/api/docs/guides/prompt-engineering); the provider remains U-Bot. The persona is sent as a system-role message. A real-provider check found that U-Bot could still reply with its generic service persona, so the adapter also sends the application response-writing brief and bounded conversation in both the latest user-message content and top-level `userText` field. That brief respects the underlying service’s rules and contains no authentication data. This is a transport compatibility measure, not a claim that application prompts override provider policy. It describes only actual app capabilities, prohibits importing unrelated account memories, and keeps approval and secret-handling boundaries. Prompt instructions are not a substitute for the existing schema, intent, balance, cap, and confirmation checks.

## Powered by attribution

The app footer and compact chat header show **Powered by U-Bot, U-topia, ElevenLabs and Avalanche** with locally stored original logos. Sources and brand notes are in `public/brands/README.md`. Avalanche identifies the optional contract integration, not an AI provider or a claim of public deployment. Attribution does not imply endorsement or that an unavailable provider generated a particular answer; source and voice labels still identify actual use. The service worker caches all four assets for offline reload.

## U-Bot client adaptation

`src/lib/ubot.ts` adapts the supplied Python client to the existing Next.js server, without requiring a separate Python process:

- Supabase email/password login, in-memory access and refresh tokens, proactive refresh near expiry, and one retry after an unauthorized response.
- Optional bearer-token configuration. A bearer-only setup cannot renew itself when expired; configure login or replace the token.
- Optional explicit public Supabase key. Otherwise the server checks U-Bot’s public bundles and accepts only an anonymous key matching the supplied project. Service-role and other-project JWTs are rejected.
- One shared login operation for concurrent requests, but separate conversation session IDs. No global chat history is shared between browser tabs.
- Upstream streamed UTF-8 decoding across byte boundaries, removal of split status markers, bounded response size, timeout, cancellation, and rejection of degenerate/empty output. The app currently buffers the full answer for JSON validation before display; this is not browser token-by-token streaming.
- No automatic retry of a billable chat on a rate limit or server error. The person can choose Retry.
- Account-history and account-code utilities remain server-side and are never called automatically or exposed as public account-data routes.

`/api/agent` handles individual feature requests. `/api/companion` handles bounded conversation and sample-wallet context. Both call U-Bot’s `/api/chat`, using `mode`, `sessionId`, `messages` and `userText`. Images use the text/image content format confirmed in U-Bot’s public client. No password, access token or refresh token is sent to the browser or included in a model prompt.

The companion retains the opening exchange plus recent messages, at most ten text messages total, to preserve the original question without unbounded history. New conversation clears local history and generates a new provider session ID. Closing the dialog keeps local text history in the tab, but discards unsent photos.

The optional Avalanche context is grounded in the [official Primary Network documentation](https://build.avax.network/docs/primary-network), checked 2026-10-16. It distinguishes C-Chain contracts, P-Chain coordination and X-Chain assets, and makes clear that this app’s sample wallet is not real settlement.

## Safe action path

```text
Question + bounded sample context
  → U-Bot explanation and optional JSON proposal
  → local schema validation and supported-intent checks
  → person chooses Review this example
  → balance and daily-limit checks
  → person explicitly confirms
  → local sample ledger and receipt update
```

U-Bot does not offer the previous provider’s native structured-output guarantee. The server requests JSON and validates it at runtime. A plain-language answer can be displayed as guidance with no action. Invalid structured output is rejected; it cannot become an approval.

Supported proposals remain the fixed bill, grocery and income examples, plus an explicitly requested precise sample gold allocation. Amounts must fit the sample balance and assisted-action allowance. Cancellation, ambiguous amounts, unsupported destinations and mismatched amounts cannot propose a financial action.

Images are informational only; server and browser both suppress financial proposals from photo replies. Reading a real bill never authorizes payment.

## ElevenLabs speech

The supplied [ElevenLabs Hacker Guide](https://docs.google.com/document/d/1mCh5MtOzBw0aJpurQVUmIVFfPMAHW3MjNemE-LNiMto/edit) identifies ElevenLabs as the speech provider. This integration follows its [speech streaming API](https://elevenlabs.io/docs/api-reference/text-to-speech/stream).

Connected reading sends the selected text and language to `/api/tts`. The server keeps `ELEVENLABS_API_KEY` private and relays MP3 audio. The browser buffers one bounded audio chunk before playing it; longer text is split into chunks. Read/Stop controls and optional automatic narration apply to replies, guides, lessons, meaning notes and scripts.

The default `eleven_v3` model supports English, Thai and Spanish. Multilingual v2 and Flash v2.5 do not support Thai; see [model language support](https://elevenlabs.io/docs/overview/models). Set a global voice ID or separate EN/TH/ES IDs. The configured ElevenLabs account must have access to the voice.

Stop, dialog closure, language changes and disconnection cancel pending narration and dispose of audio URLs. If ElevenLabs is unavailable, missing configuration or blocked by playback policy, the app explains the device-voice fallback. Device voices do not require an ElevenLabs key, but availability depends on the device.

This is text-to-speech only, not a microphone, speech-recognition, voice-cloning or ElevenLabs Agents integration.

## Photos, privacy and account limits

Connected photo questions accept JPG, PNG or WebP under 4 MB. People preview/remove a photo before explicitly sending it with the composer; Enter and Send behave identically. Unsent photos are discarded on close, language changes or New conversation. Home questions and suggestion chips do not reuse an earlier attachment. Saved guides do not pretend to see images.

Local chat history stays in memory in the current tab, not in the persistent wallet. Connected requests share up to ten messages, current task, sample dollar/baht balances, remaining daily allowance and any current photo with U-Bot. Reading aloud shares selected text with ElevenLabs. The interface discloses these boundaries.

U-Bot may retain connected requests in the configured account. New conversation does not delete provider-side history. No provider-wide zero-retention guarantee is made. Do not enter secrets or sensitive payment details. Tool traces record source, language, task, message count, photo presence, proposed action and latency, not message text or photo data.

The demonstration endpoints use server-owned provider accounts. Before public hosting, add authentication, per-account usage limits and abuse controls. This remains a local financial simulator, not a production multi-user AI or payment service.

## Configure the providers

1. Use the variable names in `.env.example` to create an ignored `.env.local`.
2. Set `UBOT_EMAIL` and a rotated `UBOT_PASSWORD`. Optionally set `UBOT_TESTER_ID` and `UBOT_SUPABASE_ANON_KEY`, or use `UBOT_BEARER_TOKEN`. The default `UBOT_MODE` is `fast`.
3. Set `ELEVENLABS_API_KEY` for generated speech. Optional settings are `ELEVENLABS_MODEL_ID`, `ELEVENLABS_VOICE_ID`, and the `_EN`, `_TH`, `_ES` voice overrides.
4. Never paste credentials into chat, commit them, or put them in a `NEXT_PUBLIC_` variable.
5. Restart the server. For production, run `npm run build`, then `npm start`.
6. Open **Preferences → Mentor Architecture View → AI integration & connection → Check AI connection**.
7. Send a question and a follow-up; the app connects automatically. Then choose **Read aloud**. Check the actual provider label and any fallback notice.

The earlier OpenAI-key setup is no longer used by the application’s live routes.

## Verification

Ordinary browser tests replace provider transport through `tests/fixtures.ts`, so a configured real account is never charged by routine journeys. Additional tests cover shared system-persona injection in all three languages, online-first startup, automatic fallback and recovery, safe photo failure, origin checks, and logo rendering at 320/390/1440 pixels. The suite also covers U-Bot login/key discovery, token refresh and unauthorized retry, bounded streams and UTF-8, conversation isolation, schema/action validation, English/Thai/Spanish controls, images, photo privacy, speech requests/playback/disposal, explicit fallback, offline reload and the existing wallet and contract invariants.

Real-provider tests are explicitly opt-in; mocks never count as proof of account access. Run them sequentially with separate output directories to avoid Playwright artifact collisions.

```bash
# Built app running on port 3000:
TEST_BASE_URL=http://127.0.0.1:3000 TEST_PRODUCTION=1 npm test

# Real U-Bot login, feature reply and conversational follow-up:
TEST_BASE_URL=http://127.0.0.1:3000 TEST_LIVE_UBOT=1 npm test -- tests/live-providers.spec.ts -g 'real U-Bot' --output=/tmp/u-ikigai-live-ubot

# Real Thai Ikigai identity (not a mock):
TEST_BASE_URL=http://127.0.0.1:3000 TEST_LIVE_UBOT=1 npm test -- tests/live-providers.spec.ts -g 'Ikigai persona' --output=/tmp/u-ikigai-live-persona

# Real audio generation in all three languages:
TEST_BASE_URL=http://127.0.0.1:3000 TEST_LIVE_ELEVENLABS=1 npm test -- tests/live-providers.spec.ts -g 'real ElevenLabs' --output=/tmp/u-ikigai-live-voice
```

On 2026-10-16, the real U-Bot check passed: login through the discovered public key, an actual coaching reply, and a follow-up retaining the art-studio goal. That initial check used transient credentials. At the user’s later explicit request, login configuration was saved in owner-only, Git-ignored `.env.local`; the credential-containing local notebook is also ignored. The opt-in real Thai persona test also passed after the compatibility brief was added: the reply identified U-Pilot and Ikigai and returned no financial proposal. This is an observed provider check, not a guarantee that every model answer will follow the persona. Uploaded-image behavior is covered by transport/browser tests, not a live image-quality evaluation. ElevenLabs request/playback/fallback tests use replaced transport and audio; real ElevenLabs generation still requires its API key. Neither adapter tests nor generated audio alone establish audible quality on every device.
