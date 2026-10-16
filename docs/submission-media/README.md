# Submission images

Upload `00-cover.png` as the cover, followed by `01`–`05` in the screenshot slots. All six upload files are **1920 × 1080 PNGs (16:9)**; no crop is necessary.

| File | Use |
| --- | --- |
| `00-cover.png` | U-Ikigai / U-topia With Meaning cover |
| `01-desktop-overview.png` | Desktop workspace and four everyday tasks |
| `02-u-pilot-companion.png` | U-Pilot with an actual live U-Bot reply |
| `03-dreams-and-gifts.png` | Editable personal meaning note and sample saving flow |
| `04-your-approval.png` | Sample bill review; nothing was confirmed or paid |
| `05-your-language.png` | Actual mobile homes in English, Thai and Spanish |

Screenshots are real browser captures in presentation frames, not generated interfaces. Source captures are in `source/`. The U-Pilot frame was captured from a successful U-Bot request on 2026-10-16. Sample money and provider labels are preserved. It is not proof that every provider is connected or of real financial settlement. No provider secrets or real payment details are included.

The cover uses original AI-generated illustration, the unchanged project mark and deterministic typography. The **built-in image generation tool** created the illustration with this prompt:

> Use case: ads-marketing. Asset type: original illustration for the right-hand panel of a 16:9 U-Ikigai hackathon cover. Artwork only; typography and the real project logo are typeset separately. A serene premium miniature landscape expressing U-topia With Meaning: a rounded sculptural arch opens into layered jade hills, a winding path toward a champagne sun, four subtle muted rose, sky blue, sage and gold glass-petal forms, botanical curves and a quiet sense of growth. Elegant tactile 3D editorial art, soft matte ceramic and frosted glass, deep blue-black ink background, gentle warm studio lighting. One coherent centered subject with dark breathing space and unclipped edges. No text, letters, logos, UI screens, charts, currency symbols, coins, people or watermark; no implication of investment returns or settlement.

To regenerate screenshots, start the production app, then run `node scripts/capture-submission-media.mjs`. Capturing actual live U-Bot replies requires the explicit `CAPTURE_LIVE_AI=1` setting and configured server credentials, and may consume account quota. Otherwise the companion capture shows its actual welcome interface without pretending to be a live reply. Use `RENDER_COVER_ONLY=1` to regenerate just the cover without replacing the saved live screenshots.
