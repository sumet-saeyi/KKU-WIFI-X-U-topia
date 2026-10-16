# Submission images

Upload `00-cover.png` as the cover, followed by `01`–`05` in the screenshot slots. All six upload files are **1920 × 1080 PNGs (16:9)**; no crop is necessary.

| File | Use |
| --- | --- |
| [00-cover.png](./00-cover.png) | U-Ikigai / U-topia With Meaning cover with the actual demo card |
| [01-desktop-overview.png](./01-desktop-overview.png) | Desktop workspace, four everyday tasks and U-topia card shortcut |
| [02-u-pilot-companion.png](./02-u-pilot-companion.png) | U-Pilot with a previously captured actual live U-Bot reply |
| [03-dreams-and-gifts.png](./03-dreams-and-gifts.png) | Editable personal meaning note and sample saving flow |
| [04-u-topia-card.png](./04-u-topia-card.png) | Actual demo card, freeze control, shared daily limit and sample checkout |
| [05-your-language.png](./05-your-language.png) | Actual mobile homes and card shortcuts in English, Thai and Spanish |

Download [u-ikigai-upload-pack.zip](./u-ikigai-upload-pack.zip) for exactly these six upload images. The earlier approval-only slide is replaced by the U-topia card slide and remains recoverable in Git history.

Screenshots are real browser captures in presentation frames, not generated interfaces. Source captures are in `source/`. The U-Pilot frame was captured from a successful U-Bot request on 2026-10-16. Sample money and provider labels are preserved. It is not proof that every provider is connected or of real financial settlement. No provider secrets or real payment details are included.

The refreshed cover uses the existing original AI-generated illustration, the unchanged project mark, deterministic typography and an actual high-resolution browser capture of the implemented demo card. The card is CSS/SVG UI, not newly generated artwork or an issued card. The **built-in image generation tool** originally created the illustration with this prompt:

> Use case: ads-marketing. Asset type: original illustration for the right-hand panel of a 16:9 U-Ikigai hackathon cover. Artwork only; typography and the real project logo are typeset separately. A serene premium miniature landscape expressing U-topia With Meaning: a rounded sculptural arch opens into layered jade hills, a winding path toward a champagne sun, four subtle muted rose, sky blue, sage and gold glass-petal forms, botanical curves and a quiet sense of growth. Elegant tactile 3D editorial art, soft matte ceramic and frosted glass, deep blue-black ink background, gentle warm studio lighting. One coherent centered subject with dark breathing space and unclipped edges. No text, letters, logos, UI screens, charts, currency symbols, coins, people or watermark; no implication of investment returns or settlement.

To regenerate screenshots without replacing the saved U-Bot capture, start the production app, then run:

```bash
TEST_BASE_URL=http://127.0.0.1:3002 PRESERVE_COMPANION_CAPTURE=1 node scripts/capture-submission-media.mjs
```

Capturing a new actual live U-Bot reply requires `CAPTURE_LIVE_AI=1` (without the preserve setting), configured server credentials, and may consume quota. Without either setting, the companion capture shows its actual welcome interface without pretending to be a live reply. Use `RENDER_COVER_ONLY=1` to regenerate just the cover without replacing saved screenshots. After changing the PNGs, rebuild the ZIP from a fresh archive containing only the six filenames in the table, not `source/` or this README.
