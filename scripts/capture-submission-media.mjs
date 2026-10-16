import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:3002';
const liveAi = process.env.CAPTURE_LIVE_AI === '1';
const output = new URL('../docs/submission-media/', import.meta.url);
const source = new URL('source/', output);
await mkdir(source, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const image = async (url) => `data:${url.pathname.endsWith('.svg') ? 'image/svg+xml' : 'image/png'};base64,${(await readFile(url)).toString('base64')}`;
const projectLogo = await image(new URL('../public/branding/u-ikigai-logo.png', import.meta.url));
const canvas = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const css = `*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden}body{background:#0b151b;color:#edead8;font-family:Arial,sans-serif}.slide{position:relative;width:1920px;height:1080px;overflow:hidden;background:radial-gradient(ellipse at 15% 15%,#24433835,transparent 55%),#0b151b}.brand{position:absolute;left:76px;top:54px;display:flex;align-items:center;gap:18px;font-size:23px;letter-spacing:3px;font-weight:600}.brand img{width:55px;height:55px}.brand small{display:block;color:#9eb5a8;font-size:12px;letter-spacing:1px;font-weight:400;margin-top:8px}.index{position:absolute;right:76px;top:76px;color:#9eb5a8;font-size:16px;letter-spacing:2px}.copy{position:absolute;left:76px;top:265px;width:520px}.eyebrow{font-size:16px;letter-spacing:3px;color:#b6ddc5;margin-bottom:27px}.copy h1{font-family:Georgia,serif;font-size:75px;font-weight:400;line-height:1.09;letter-spacing:-2.5px;margin:0 0 30px}.copy p{font-size:25px;line-height:1.65;color:#adc3b5;max-width:480px}.note{position:absolute;left:76px;bottom:63px;font-size:15px;line-height:1.8;color:#829c8f;letter-spacing:.2px}.screen{position:absolute;right:65px;top:192px;width:1210px;border:1px solid #c9e5cf35;border-radius:18px;overflow:hidden;box-shadow:0 35px 100px #0005;background:#101c22}.screen img{display:block;width:100%}.chrome{height:31px;display:flex;align-items:center;gap:7px;padding:0 15px;background:#16252b;border-bottom:1px solid #ffffff0a}.chrome i{width:6px;height:6px;border-radius:50%;background:#96ad9c50}.chrome span{margin:auto;color:#9cb1a2;font-size:10px;letter-spacing:1px}.dialog-screen{position:absolute;top:154px;right:210px;height:850px;width:auto;border:1px solid #c9e5cf35;border-radius:23px;box-shadow:0 35px 100px #0005}.phones{position:absolute;left:720px;top:174px;display:flex;gap:28px}.phone{width:350px}.phone-label{text-align:center;color:#bed6c4;font-size:17px;letter-spacing:2px;margin-bottom:18px}.phone img{display:block;width:350px;border:1px solid #c9e5cf35;border-radius:24px;box-shadow:0 25px 65px #0005}.cover .copy{top:275px;width:800px}.cover .copy h1{font-size:109px;line-height:1.04;letter-spacing:-4px}.cover .copy p{font-size:30px;max-width:720px;line-height:1.6}.art{position:absolute;right:0;top:0;width:1060px;height:1080px;object-fit:cover;mask-image:linear-gradient(to right,transparent,#000 14%);opacity:.97}.cover .brand{font-size:34px;letter-spacing:4px}.cover .brand img{width:76px;height:76px}.cover .brand small{font-size:14px}.cover-badges{display:flex;gap:10px;margin-top:36px}.cover-badges span{font-size:15px;color:#c4d9c7;border:1px solid #b6ddc52c;border-radius:30px;padding:12px 17px;background:#b6ddc506}.partner-row{display:flex;align-items:center;gap:24px}.partner-row>span{font-size:12px;color:#9eb5a8;letter-spacing:1px}.partner-row img{max-width:105px;max-height:25px;object-fit:contain}.partner-row .ubot{width:25px;height:25px;padding:3px;background:#f4f2ff;border-radius:6px}.partner-row .avalanche{width:25px;height:23px}.partner-row .partner{display:flex;gap:7px;align-items:center;color:#c7daca;font-size:15px}`;

const brand = `<div class="brand"><img src="${projectLogo}" alt="U-Ikigai mark"><div>U-IKIGAI<small>U-topia With Meaning</small></div></div>`;
const cardMediaCss = '.card-screen{top:265px}.card-screen .chrome{height:40px}.cover-card{position:absolute;right:115px;bottom:160px;width:640px;transform:rotate(-7deg);border-radius:24px;box-shadow:0 35px 100px #0009}.cover-card img{display:block;width:100%;border-radius:24px}.cover .art{opacity:.7}';
async function render(filename, title, subtitle, content, index, note = 'Actual app capture · Sample-money prototype') {
  await canvas.setContent(`<html><head><style>${css}${cardMediaCss}</style></head><body><main class="slide">${brand}<div class="index">${index} / THE EXPERIENCE</div><section class="copy"><div class="eyebrow">MONEY WITH MEANING</div><h1>${title}</h1><p>${subtitle}</p></section>${content}<div class="note">${note}<br>Every move starts with your approval.</div></main></body></html>`);
  await canvas.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
  await canvas.screenshot({ path: fileURLToPath(new URL(filename, output)), animations: 'disabled' });
  console.log(`Saved ${filename} (1920 × 1080)`);
}
async function pageFor(width = 1440, height = 980, deviceScaleFactor = 1) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor, reducedMotion: 'reduce' });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak() {} } }));
  await page.route('**/api/tts', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
  await page.route('**/api/agent', (route) => route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 503, json: { code: 'not_configured' } }));
  if (!liveAi) await page.route('**/api/companion', (route) => route.fulfill({ status: 503, json: { code: 'not_configured' } }));
  await page.goto(`${origin}/${width < 900 ? 'mobile' : 'desktop'}`);
  await expect(page.locator('.home-task.profession')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function capture(page, filename, locator) {
  const path = new URL(filename, source);
  await (locator || page).screenshot({ path: fileURLToPath(path), animations: 'disabled' });
  return image(path);
}

try {
  if (process.env.RENDER_COVER_ONLY !== '1') {
  const home = await pageFor(1440, 980);
  const homeImage = await capture(home, 'desktop-overview.png');
  await render('01-desktop-overview.png', 'A richer life.<br>In every sense.', 'Four familiar tasks.<br>One calmer place to begin.', `<div class="screen"><div class="chrome"><i></i><i></i><i></i><span>U-IKIGAI / MY DAY</span></div><img src="${homeImage}" alt="Actual desktop home"></div>`, '01');
  await home.close();

  if (process.env.PRESERVE_COMPANION_CAPTURE === '1') {
    await readFile(new URL('02-u-pilot-companion.png', output));
    console.log('Preserved the existing U-Pilot presentation capture without a new provider call.');
  } else {
  const chat = await pageFor(1440, 1000);
  await chat.getByRole('button', { name: 'Ask AI companion', exact: true }).click();
  if (liveAi) {
    await chat.locator('#ai-question').fill("I'm a freelancer saving for a small creative studio. What is one practical, free step I can take today? Keep it under 60 words.");
    await chat.locator('.ai-send').click();
    await expect(chat.locator('.ai-message.assistant')).toBeVisible({ timeout: 70000 });
    await chat.locator('.ai-chat-history').evaluate((element) => { element.scrollTop = 0; });
  }
  const actualLive = liveAi && (await chat.locator('.ai-message.assistant .ai-message-author').textContent())?.includes('U-Bot');
  console.log(`U-Pilot capture: ${actualLive ? 'actual live U-Bot reply' : 'actual welcome/saved-guide interface; not a live-provider claim'}`);
  const chatImage = await capture(chat, 'u-pilot.png', chat.getByRole('dialog', { name: 'Your AI companion', exact: true }));
  await render('02-u-pilot-companion.png', 'One question.<br>A little clarity.', 'Meet U-Pilot.<br>Explore a goal. Ask a follow-up.<br>Take the next step at your pace.', `<img class="dialog-screen" src="${chatImage}" alt="Actual U-Pilot interface">`, '02', actualLive ? 'Actual U-Bot reply · Sample-wallet context' : 'Actual app capture · Live AI availability is not implied');
  await chat.close();
  }

  const saving = await pageFor(1440, 980);
  await saving.locator('.home-task.passion').click();
  await saving.getByRole('button', { name: /Someone I love/ }).click();
  await saving.getByRole('textbox', { name: 'Recipient’s name or phone', exact: true }).fill('Maya');
  await saving.getByRole('button', { name: /Continue/ }).click();
  await saving.getByRole('button', { name: /Continue/ }).click();
  await saving.getByRole('textbox', { name: 'Meaning note', exact: true }).fill('For the little studio where your next big idea begins. I believe in what you are becoming.');
  await expect(saving.getByRole('button', { name: /Review my saving plan/ })).toBeVisible();
  await saving.evaluate(() => window.scrollTo(0, 0));
  const giftImage = await capture(saving, 'dreams-and-gifts.png');
  await render('03-dreams-and-gifts.png', 'A small gift.<br>A lasting meaning.', 'A dream, a name and a few words.<br>Because the reason matters<br>as much as the amount.', `<div class="screen"><div class="chrome"><i></i><i></i><i></i><span>U-IKIGAI / DREAMS & GIFTS</span></div><img src="${giftImage}" alt="Actual saving-note flow"></div>`, '03');
  await saving.close();

  const payment = await pageFor(1680, 1100, 2);
  await payment.getByRole('button', { name: 'Open U-topia card', exact: true }).click();
  const cardPanel = payment.locator('.utopia-card-panel');
  await expect(cardPanel).toBeVisible();
  const cardImage = await capture(payment, 'u-topia-card.png', cardPanel);
  await capture(payment, 'card-front.png', cardPanel.locator('.utopia-card'));
  await render('04-u-topia-card.png', 'Your everyday.<br>Your U-topia<br>card.', 'A little more freedom.<br>Freeze it. Review a sample cart.<br>Every move is still your call.', `<div class="screen card-screen"><div class="chrome"><i></i><i></i><i></i><span>U-IKIGAI / U-TOPIA CARD DEMO</span></div><img src="${cardImage}" alt="Actual U-topia demo card and functioning controls"></div>`, '04', 'Actual card UI · Sample money only · No issued payment card');
  await cardPanel.getByRole('button', { name: 'Try a grocery checkout', exact: true }).click();
  const review = payment.getByRole('dialog', { name: 'Review your action', exact: true });
  await expect(review).toBeVisible();
  await capture(payment, 'payment-review.png', review);
  await payment.close();

  const phones = [];
  for (const [language, name] of [['en', 'ENGLISH'], ['th', 'ภาษาไทย'], ['es', 'ESPAÑOL']]) {
    const page = await pageFor(390, 844);
    await page.locator('.language-select select').selectOption(language);
    await page.evaluate(() => window.scrollTo(0, 0));
    phones.push(`<div class="phone"><div class="phone-label">${name}</div><img src="${await capture(page, `mobile-${language}.png`)}" alt="Actual mobile home in ${language}"></div>`);
    await page.close();
  }
  await render('05-your-language.png', 'Your language.<br>Your pace.', 'English, Thai and Spanish.<br>One familiar experience.<br>A little closer to home.', `<div class="phones">${phones.join('')}</div>`, '05');
  }

  const artPath = new URL('cover-art.png', source);
  try {
    const art = await image(artPath);
    let card = '';
    try { card = `<div class="cover-card"><img src="${await image(new URL('card-front.png', source))}" alt="Actual U-topia demo card"></div>`; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const partners = await Promise.all(['ubot', 'u-topia', 'elevenlabs', 'avalanche'].map(async (name) => `<div class="partner"><img class="${name}" src="${await image(new URL(`../public/brands/${name}.svg`, import.meta.url))}" alt="${name}">${['ubot', 'avalanche'].includes(name) ? (name === 'ubot' ? 'U-Bot' : 'Avalanche') : ''}</div>`));
    await canvas.setContent(`<html><head><style>${css}${cardMediaCss}.art{object-fit:contain;right:25px;mask-image:linear-gradient(to right,transparent,#000 12%,#000 92%,transparent)}</style></head><body><main class="slide cover"><img class="art" src="${art}" alt="Original purpose-inspired cover illustration">${card}${brand}<div class="index">U-HACKATHON 2026</div><section class="copy"><div class="eyebrow">生き甲斐 / A LIFE WITH PURPOSE</div><h1>U-topia<br>With Meaning.</h1><p>Your money is a tool.<br>Your life is the point.</p><div class="cover-badges"><span>AI companion</span><span>U-topia card demo</span><span>3 languages</span></div></section><div class="note"><div class="partner-row"><span>POWERED BY</span>${partners.join('')}</div></div></main></body></html>`);
    await canvas.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
    await canvas.screenshot({ path: fileURLToPath(new URL('00-cover.png', output)), animations: 'disabled' });
    console.log('Saved 00-cover.png (1920 × 1080)');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log('Cover artwork is not available yet. Run this command again after saving source/cover-art.png.');
  }
  if (errors.length) throw new Error(`Browser errors during capture: ${errors.join('; ')}`);
  for (const name of ['00-cover', '01-desktop-overview', '02-u-pilot-companion', '03-dreams-and-gifts', '04-u-topia-card', '05-your-language']) {
    const metadata = await sharp(fileURLToPath(new URL(`${name}.png`, output))).metadata();
    if (metadata.width !== 1920 || metadata.height !== 1080) throw new Error(`Incorrect aspect ratio: ${name}`);
  }
} finally {
  await browser.close();
}
