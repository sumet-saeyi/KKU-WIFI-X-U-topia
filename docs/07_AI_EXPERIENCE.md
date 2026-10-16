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
- Upstream streamed UTF-8 decoding across byte boundaries, removal of split status markers, bounded response size, timeout, cancellation, and rejection of degenerate/empty output. Conversation requests now forward explanation text as it arrives; complete output is still validated before enabling actions, follow-ups or speech. Provider-side batching can make a reply arrive all at once.
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

The supplied [ElevenLabs Hacker Guide](https://docs.google.com/document/d/1mCh5MtOzBw0aJpurQVUmIVFfPMAHW3MjNemE-LNiMto/edit) identifies ElevenLabs as the speech provider. The server now uses the official [`@elevenlabs/elevenlabs-js` SDK](https://github.com/elevenlabs/elevenlabs-js) and its [`textToSpeech.convert` API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), adapted from the supplied TypeScript example.

Connected reading sends the selected text and language to `/api/tts`. The server keeps `ELEVENLABS_API_KEY` private and relays MP3 audio (`mp3_44100_128`). The browser buffers one bounded audio chunk and plays it with native browser audio; longer text is split into chunks. The SDK's Node `play()` helper is deliberately not used: it requires a player on the server machine, not the visitor's browser. Read/Stop controls and optional automatic narration apply to replies, guides, lessons, meaning notes and scripts. A failed or stale configuration probe does not disable the next online speech attempt.

The default `eleven_v3` model supports English, Thai and Spanish. Multilingual v2, Flash v2.5 and Turbo v2.5 do not support Thai; Thai requests automatically use v3 when one of those models is configured. Multilingual v2 conversion omits the unsupported language-code parameter. See [model language support](https://elevenlabs.io/docs/overview/models). Set a global voice ID or separate EN/TH/ES IDs. The configured ElevenLabs account must have access to the voice. The SDK example voice is `JBFqnCBsd6RMkjVDRZzb`; a voice name or unavailable ID is not interchangeable with it.

Stop, dialog closure, language changes and disconnection cancel pending narration and dispose of audio URLs. If ElevenLabs is unavailable, missing configuration or blocked by playback policy, the app explains the device-voice fallback. Device voices do not require an ElevenLabs key, but availability depends on the device. A populated voice list without a matching language produces a visible explanation rather than selecting the wrong-language voice. An initially empty list still lets the browser resolve the requested language; later synthesis errors are handled explicitly. See the browser's [available-voices API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices) and [speech error event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/error_event).

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

## Streaming and connection status update

The browser requests `application/x-ndjson` from `/api/companion`. The server sends a start event, explanation-text deltas, and either a validated completion or a safe error code. Existing JSON clients remain supported. `companionTextPreview` decodes only the top-level explanation string and holds unfinished JSON escapes and Unicode surrogate pairs; it never displays the raw plan JSON. U-Bot status markers are withheld even when split between chunks.

An arriving explanation is visibly a **streaming draft**. It has no financial action, follow-up or speech controls. Only complete replies that pass schema and intent/balance checks enter conversational history. Stop cancels the response and upstream chat request; interrupted drafts remain labeled incomplete, cannot propose an action and are not silently replaced by saved guidance. New conversation discards them. Provider outages before any explanation still use the existing honestly labeled saved-guide fallback.

The home, task entry and chat distinguish missing configuration, an unchecked connection, configured credentials and an actual live answer. A status-endpoint failure does not prevent the next question from trying U-Bot. Credential presence is never labeled proof of successful generation.

The 2026-10-16 production suite reports **96 passed, 4 skipped**, including 11 new streaming/status checks. A deliberately open upstream source proves that text is forwarded before completion; browser tests verify early draft display, withheld actions/speech, Stop, incomplete output, history exclusion, New conversation and narrow mobile layout. A separate real U-Bot stream-transport check successfully returned a validated answer. A stricter Thai-reply check observed **one text update (319 characters)** after about **11 seconds**; an English explanation requested at about 150 words likewise arrived in **one 831-character update** after about **11.5 seconds**. Both strict incremental checks failed, despite valid completed replies. A real mobile capture likewise observed a complete explanation followed by validation. These observations do not establish token-by-token provider delivery. The app never adds an artificial typing animation to hide upstream batching.

Use `TEST_REQUIRE_INCREMENTAL_UBOT=1` with the opt-in stream test when you explicitly need evidence of partial explanation text, not merely a successful streamed response envelope. This strict check is allowed to fail when the upstream service batches the answer:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 TEST_LIVE_UBOT=1 TEST_REQUIRE_INCREMENTAL_UBOT=1 npm test -- tests/live-providers.spec.ts -g 'stream transport'
```

At the streaming checkpoint, real ElevenLabs generation had not yet been verified. It has since passed the separate [SDK and live playback checks](#elevenlabs-sdk-and-live-playback-fix). Public hosting still requires the account-access and abuse protections described above.

## Voice and intent recovery update

At this 2026-10-16 recovery checkpoint, the production build and full suite passed: **106 passed, 4 skipped**. Ten additional regression checks verified:

- Read-aloud uses the checkbox's current setting when a reply completes. Turning it off while waiting prevents late speech and stops active narration; turning it on while waiting applies to the finished reply.
- Device initialization, voice-list, playback and asynchronous speech failures leave the answer readable and restore its Read button. Unsupported devices and missing language voices have localized notices inside the visible chat status line. A browser capture verified the Thai notice at 320px; page-level toasts alone would sit behind the native chat dialog.
- The green connection indicator requires an actual live reply, not credential presence. A failed configuration probe still allows a successful answer to establish live status.
- Tested negative instructions such as “I won't save”, “No ahorres” and “ฉันไม่อยากออม” cannot become sample money proposals. Thai “ตัวอย่าง” (example) remains nonnegative. Spanish dollar amounts written as “25 dólares” are recognized; ambiguous comma decimals remain rejected.

These are transport-replaced tests, not evidence of real provider access or audible speech quality. U-Bot batching remains a verification limit; the later ElevenLabs checks below supersede the previously missing-key limitation.

## ElevenLabs SDK and live playback fix

The latest production build exits 0 and the ordinary production suite reports **116 passed, 5 skipped**. Ten added speech checks cover independent online attempts, SDK/model/MP3 settings, safe error categories, cancellation and no automatic retries. The five skipped cases require explicit real-provider opt-in; the two ElevenLabs cases were also run separately and passed.

The reported “Voice is unavailable” issue had two reproduced causes: a failed/stale status probe skipped speech requests entirely, and the local configured voice was unavailable. A direct request with the example voice succeeded. The local voice setting was corrected to `JBFqnCBsd6RMkjVDRZzb`; the existing API key remains private and Git-ignored.

Online reading now tries `/api/tts` regardless of the earlier status probe. The SDK runs only on the server with a 30-second timeout, cancellation, no automatic billable retries, input/origin validation, and safe public error codes. If device fallback also fails, the visible chat status explains missing setup, authorization, quota, unavailable voice or service load without displaying provider responses or credentials.

On 2026-10-16, both opt-in real ElevenLabs checks passed: MP3 generation in English, Thai and Spanish, and playback of each language in a native Chromium audio element. The browser check deliberately fails the unrelated status probe, replaces only U-Bot conversation transport to isolate speech costs, and does not replace `/api/tts`, native audio decoding or `Audio.play()`. It observes nonempty playback blobs, positive duration, `playing` events and no media errors. This verifies local generation and browser playback, not human-rated pronunciation, every device or a public deployment.

For Vercel, configure `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb` and `ELEVENLABS_MODEL_ID=eleven_v3` as server environment variables and redeploy. The ignored local configuration is not transferred through Git. Do not use `NEXT_PUBLIC_` for the key, and protect owner-funded public endpoints as described above.

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

# Real audio generation and native browser playback in all three languages:
TEST_BASE_URL=http://127.0.0.1:3000 TEST_LIVE_ELEVENLABS=1 npm test -- tests/live-providers.spec.ts -g 'real ElevenLabs' --output=/tmp/u-ikigai-live-voice
```

On 2026-10-16, the real U-Bot check passed: login through the discovered public key, an actual coaching reply, and a follow-up retaining the art-studio goal. That initial check used transient credentials. At the user’s later explicit request, login configuration was saved in owner-only, Git-ignored `.env.local`; the credential-containing local notebook is also ignored. The opt-in real Thai persona test also passed after the compatibility brief was added: the reply identified U-Pilot and Ikigai and returned no financial proposal. This is an observed provider check, not a guarantee that every model answer will follow the persona. Uploaded-image behavior is covered by transport/browser tests, not a live image-quality evaluation. Ordinary ElevenLabs tests replace provider transport; the two separately opted-in generation/native-playback checks also passed with the locally configured account. Neither adapter tests nor generated audio alone establish audible quality on every device.
