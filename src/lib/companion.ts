import { words } from './i18n';
import { ikigaiPersona } from './persona';
import type { LanguageCode, PendingSignatureRequest, WalletState } from './types';
import type { ScreenId } from './product';

export interface CompanionMessage { role: 'user' | 'assistant'; text: string; }
export interface CompanionContext { screen: ScreenId; availableUsd: number; availableThb: number; remainingDailyUsd: number; }
export const planKinds = ['none', 'navigate', 'save_gold', 'sample_bill', 'sample_groceries', 'sample_income'] as const;
export interface CompanionPlan { kind: typeof planKinds[number]; screen: ScreenId; amountUsd: number | null; title: string; why: string; }
export interface CompanionReply { text: string; followUps: string[]; plan: CompanionPlan; }
export interface CompanionInput { language: LanguageCode; stageSafeMode: boolean; messages: CompanionMessage[]; context: CompanionContext; image?: string; sessionId?: string; }
export interface CompanionResult extends CompanionReply { source: 'stage-safe' | 'live'; latencyMs: number; }
export const companionScreens: ScreenId[] = ['home', 'wallet', 'passion', 'profession', 'vocation', 'mission'];

export function companionContext(wallet: WalletState, screen: ScreenId): CompanionContext {
  return { screen, availableUsd: wallet.balances.USDT, availableThb: wallet.balances.THB, remainingDailyUsd: Math.max(0, wallet.dailyAiCapUsd - wallet.spentTodayUsd) };
}

export function parseCompanionInput(value: unknown): CompanionInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as CompanionInput;
  if (!['en', 'th', 'es'].includes(input.language) || typeof input.stageSafeMode !== 'boolean') return null;
  if (!Array.isArray(input.messages) || !input.messages.length || input.messages.length > 10 || input.messages.at(-1)?.role !== 'user') return null;
  if (input.messages.some((item) => !item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 2000)) return null;
  const context = input.context;
  if (!context || !companionScreens.includes(context.screen) || [context.availableUsd, context.availableThb, context.remainingDailyUsd].some((number) => !Number.isFinite(number) || number < 0 || number > 100_000_000)) return null;
  if (input.image !== undefined && (typeof input.image !== 'string' || input.image.length > 5_700_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(input.image))) return null;
  if (input.sessionId !== undefined && (typeof input.sessionId !== 'string' || !/^c_[A-Za-z0-9_-]{10,96}$/.test(input.sessionId))) return null;
  return { language: input.language, stageSafeMode: input.stageSafeMode, messages: input.messages.map(({ role, text }) => ({ role, text: text.trim() })), context: { screen: context.screen, availableUsd: context.availableUsd, availableThb: context.availableThb, remainingDailyUsd: context.remainingDailyUsd }, ...(input.image ? { image: input.image } : {}), ...(input.sessionId ? { sessionId: input.sessionId } : {}) };
}

/** U-Bot has no native schema guarantee. Natural-language replies can explain, never propose actions. */
export function parseUBotCompanionReply(raw: string, screen: ScreenId): CompanionReply | null {
  const text = raw.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i, '$1').trim();
  if (text.startsWith('{') || text.startsWith('[')) {
    try { return parseCompanionReply(JSON.parse(text)); } catch { return null; }
  }
  return text && text.length <= 6000 ? { text, followUps: [], plan: { kind: 'none', screen, amountUsd: null, title: '', why: '' } } : null;
}

export function parseCompanionReply(value: unknown): CompanionReply | null {
  if (!value || typeof value !== 'object') return null;
  const reply = value as CompanionReply;
  if (typeof reply.text !== 'string' || !reply.text.trim() || reply.text.length > 6000 || !Array.isArray(reply.followUps) || reply.followUps.length > 3 || reply.followUps.some((text) => typeof text !== 'string' || !text.trim() || text.length > 160)) return null;
  const plan = reply.plan;
  if (!plan || !planKinds.includes(plan.kind) || !companionScreens.includes(plan.screen) || typeof plan.title !== 'string' || plan.title.length > 120 || typeof plan.why !== 'string' || plan.why.length > 500) return null;
  if (plan.kind === 'save_gold' ? typeof plan.amountUsd !== 'number' || !Number.isFinite(plan.amountUsd) || plan.amountUsd < 1 || plan.amountUsd > 1000 || Math.abs(plan.amountUsd * 100 - Math.round(plan.amountUsd * 100)) > 0.00001 : plan.amountUsd !== null) return null;
  if (plan.kind === 'save_gold' && plan.screen !== 'passion') return null;
  if (plan.kind.startsWith('sample_') && plan.screen !== 'profession') return null;
  return { text: reply.text.trim(), followUps: reply.followUps.map((text) => text.trim()), plan: { kind: plan.kind, screen: plan.screen, amountUsd: plan.amountUsd, title: plan.title, why: plan.why } };
}

export const companionSchema = {
  type: 'object', additionalProperties: false, required: ['text', 'followUps', 'plan'], properties: {
    text: { type: 'string' }, followUps: { type: 'array', items: { type: 'string' } },
    plan: { type: 'object', additionalProperties: false, required: ['kind', 'screen', 'amountUsd', 'title', 'why'], properties: {
      kind: { type: 'string', enum: planKinds }, screen: { type: 'string', enum: companionScreens }, amountUsd: { type: ['number', 'null'] }, title: { type: 'string' }, why: { type: 'string' },
    } },
  },
};

export function companionInstructions(input: CompanionInput): string {
  return `${ikigaiPersona(input.language)}

# Conversation task
Use the supplied conversation history for follow-ups. The current task and SAMPLE wallet context are ${JSON.stringify(input.context)}. This context is not a real bank account. Return the required JSON with text (under 180 words), 0–3 short follow-up questions the user can ask, and one plan.
The only plan kinds are: none for explanations or clarification; navigate to an existing screen; save_gold ONLY when the user explicitly asks to allocate a precise USD amount to gold (1–1000, max two decimals); sample_bill ONLY for the explicitly requested prepared 450 THB electricity example; sample_groceries ONLY for the prepared 1250 THB example; sample_income ONLY for the prepared incoming 3500 THB example. These three sample actions have FIXED amounts; amountUsd must be null. Do not turn arbitrary bills, destinations or payment amounts into these examples. Use navigate for other requests, e.g. saving without an asset choice or giving a gift. Financial plans are proposals for a separate review, never approvals. save_gold must point to passion; sample actions to profession. amountUsd is null for all other kinds. State why the suggested step helps. If it exceeds the supplied available balance or daily remaining allowance, explain and offer a nonfinancial navigate plan instead. Use none for dangerous, unsupported or unrelated requests. For images, only describe visible information, state uncertainty, and set plan.kind to none: an uploaded image can NEVER authorize a financial proposal. No markdown tables or HTML. The app does not have web search, live prices, real bookings, or live asset purchases.`;
}

export function planAction(plan: CompanionPlan): PendingSignatureRequest['onConfirmAction'] | null {
  return ({ save_gold: 'FUND_GOLD_GOAL', sample_bill: 'PAY_THB_BILL', sample_groceries: 'ORDER_FRIDGE_GROCERIES', sample_income: 'SPLIT_INCOME' } as const)[plan.kind as 'save_gold'] ?? null;
}

export function requestedDollars(text: string): number | null {
  if (/[-−]\s*\$/.test(text)) return null;
  const matches = [...text.matchAll(/\$\s*([-−]?\s*\d[\d,.]*)|([-−]?\s*\d[\d,.]*)\s*(?:usd|dollars?|d[oó]lares?|ดอลลาร์)/gi)];
  if (matches.length !== 1) return null;
  const raw = (matches[0][1] ?? matches[0][2]).trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw.replaceAll(',', ''));
  return Number.isFinite(amount) && amount >= 1 && amount <= 1000 ? amount : null;
}

export function isCompanionCancellation(text: string): boolean {
  // Thai has no word spaces: “อย่า” must not match inside “ตัวอย่าง” (example).
  return /\b(?:cancel|stop|don.t|do not|won.t|will not|not asking|not (?:going|ready) to|cancelar|no (?:quiero|voy a|necesito|autorizo|hagas|ahorr\w*|pag\w*|compr\w*|pid\w*|recib\w*))\b|ไม่(?:ต้อง|อยาก|ออม|จ่าย|ซื้อ|สั่ง|เอา|ทำ)|ยกเลิก|อย่า(?!ง)/i.test(text);
}

/** Model output is untrusted. Only explicit, supported user intents can propose money actions. */
export function restrictCompanionPlan(reply: CompanionReply, input: CompanionInput): CompanionReply {
  const plan = reply.plan;
  if (!planAction(plan)) return reply;
  const userText = input.messages.filter((item) => item.role === 'user').slice(-3).map((item) => item.text.toLowerCase());
  const intent = userText.join(' ');
  const latest = userText.at(-1) ?? '';
  const quantities = [...latest.matchAll(/\d+(?:[.,]\d+)*/g)].map((match) => Number(match[0].replaceAll(',', '')));
  const lastAmountMessage = [...userText].reverse().find((text) => /\$|usd|dollars?|d[oó]lares?|ดอลลาร์/.test(text));
  const amount = lastAmountMessage ? requestedDollars(lastAmountMessage) : null;
  const allowed = !input.image && !isCompanionCancellation(latest) && (plan.kind === 'save_gold'
    ? /gold|ทอง|oro/.test(intent) && /sav|put|add|make it|change|ออม|เติม|เปลี่ยน|ahorr|añad|cambia/.test(latest) && requestedDollars(latest) === amount && amount === plan.amountUsd && amount !== null && amount <= input.context.availableUsd && amount <= input.context.remainingDailyUsd
    : /sample|example|ตัวอย่าง|ejemplo/.test(latest) && (plan.kind === 'sample_bill'
      ? /bill|บิล|factura/.test(latest) && /pay|จ่าย|pagar/.test(latest) && quantities.every((amount) => amount === 450 || amount === 13.5) && input.context.availableThb >= 450 && input.context.remainingDailyUsd >= 13.5
      : plan.kind === 'sample_groceries'
        ? /grocer|fridge|ตู้เย็น|ซื้อของ|compras|refrigerador/.test(latest) && /order|buy|สั่ง|ซื้อ|pedir|comprar/.test(latest) && quantities.every((amount) => amount === 1250 || amount === 37.5) && input.context.availableThb >= 1250 && input.context.remainingDailyUsd >= 37.5
        : /income|incoming|รับเงิน|ingreso/.test(latest) && /try|receive|ลอง|รับ|probar|recibir/.test(latest) && quantities.every((amount) => amount === 3500 || amount === 105)));
  return allowed ? reply : { ...reply, plan: { kind: 'none', screen: input.context.screen, amountUsd: null, title: '', why: '' } };
}

export function companionPrompts(screen: ScreenId, language: LanguageCode): string[] {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const prompts: Record<ScreenId, string[]> = {
    home: [w('Help me choose a first step', 'ช่วยฉันเลือกก้าวแรก', 'Ayúdame a elegir el primer paso'), w('I want to save for my family', 'ฉันอยากออมเพื่อครอบครัว', 'Quiero ahorrar para mi familia'), w('Explain the sample bill', 'อธิบายบิลตัวอย่าง', 'Explica la factura de ejemplo')],
    passion: [w('Help me plan a meaningful gift', 'ช่วยฉันวางแผนของขวัญที่มีความหมาย', 'Ayúdame a planear un regalo con significado'), w('Save $25 in my gold goal', 'ออม $25 ในเป้าหมายทองของฉัน', 'Ahorrar $25 en mi meta de oro'), w('What are the risks?', 'มีความเสี่ยงอะไรบ้าง', '¿Cuáles son los riesgos?')],
    profession: [w('Help me pay the sample bill', 'ช่วยฉันจ่ายบิลตัวอย่าง', 'Ayúdame a pagar la factura de ejemplo'), w('Explain the grocery example', 'อธิบายตัวอย่างซื้อของเข้าตู้เย็น', 'Explica el ejemplo de compras'), w('Try the sample incoming payment', 'ลองรับเงินตัวอย่าง', 'Probar el ingreso de ejemplo')],
    vocation: [w('Explain digital money simply', 'อธิบายเงินดิจิทัลง่าย ๆ', 'Explica el dinero digital de forma sencilla'), w('Help me understand fees', 'ช่วยฉันเข้าใจค่าธรรมเนียม', 'Ayúdame a entender las comisiones'), w('How do I keep control?', 'ฉันจะควบคุมเงินได้อย่างไร', '¿Cómo mantengo el control?')],
    mission: [w('Help me write an honest post', 'ช่วยฉันเขียนโพสต์อย่างจริงใจ', 'Ayúdame a escribir una publicación honesta'), w('Why avoid guaranteed returns?', 'ทำไมต้องเลี่ยงการรับประกันผลตอบแทน', '¿Por qué evitar rendimientos garantizados?'), w('Help me tell my story', 'ช่วยฉันเล่าเรื่องของตัวเอง', 'Ayúdame a contar mi historia')],
    wallet: [w('Explain my sample balance', 'อธิบายยอดเงินตัวอย่างของฉัน', 'Explica mi saldo de ejemplo'), w('How much can I use today?', 'วันนี้ฉันใช้ได้อีกเท่าไร', '¿Cuánto puedo usar hoy?'), w('What happens when I confirm?', 'เมื่อยืนยันแล้วจะเกิดอะไรขึ้น', '¿Qué pasa al confirmar?')],
  };
  return prompts[screen];
}
