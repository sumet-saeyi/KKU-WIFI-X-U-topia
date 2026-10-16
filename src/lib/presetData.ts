import type { LanguageCode, PendingSignatureRequest, PillarId, ToolCallTrace, WalletState } from './types';
import { money, words } from './i18n';
import { routeIntent, screenLabel, type ScreenId } from './product';
import { companionPrompts, isCompanionCancellation, requestedDollars, type CompanionInput, type CompanionPlan, type CompanionReply } from './companion';

export const initialWallet: WalletState = {
  totalUsdValue: 2809.78,
  balances: { USDT: 1250, THB: 18500, AUD: 450, MXN: 3200, UGOLD: 310, BLKSLV: 220 },
  ikigaiSplit: { professionPct: 50, passionPct: 20, vocationPct: 15, missionPct: 15 },
  vaultBalancesUsd: { profession: 742, passion: 368, vocation: 232, mission: 192 },
  academyXp: 120,
  ikigaiHarmonyScore: 88,
  dailyAiCapUsd: 100,
  spentTodayUsd: 14.5,
  transactions: [],
  pendingSignature: null,
  stockBalancesUsd: { AMZN: 0, TSLA: 0 },
  completedCourses: [],
  activeRules: [],
};

export const guideText: Record<LanguageCode, Record<PillarId, string>> = {
  en: {
    passion: 'Passion turns money into a promise to your future. Choose a dream, a meaningful asset, and an amount you feel good about.',
    vocation: 'Vocation helps you use what you already know. Learn one small lesson, then see how much old fees may be taking from your work.',
    mission: 'Mission helps you share with care. I will remove risky promises and keep your message honest, warm, and useful.',
    profession: 'Profession handles everyday money calmly. You review every payment, and nothing moves until you approve it.',
  },
  th: {
    passion: 'สิ่งที่รักเปลี่ยนเงินให้เป็นคำสัญญาต่ออนาคต เลือกความฝัน สินทรัพย์ที่มีความหมาย และจำนวนที่คุณสบายใจ',
    vocation: 'ความถนัดช่วยต่อยอดสิ่งที่คุณรู้อยู่แล้ว เรียนบทสั้น ๆ และดูว่าค่าธรรมเนียมแบบเดิมกินรายได้ไปเท่าไร',
    mission: 'พันธกิจช่วยให้คุณแบ่งปันอย่างรับผิดชอบ ฉันจะตัดคำสัญญาที่เสี่ยงและทำให้ข้อความซื่อตรง อบอุ่น และมีประโยชน์',
    profession: 'อาชีพช่วยจัดการเงินประจำวันอย่างสบายใจ คุณตรวจสอบทุกการจ่าย และไม่มีเงินออกจนกว่าคุณจะยืนยัน',
  },
  es: {
    passion: 'La pasión convierte tu dinero en una promesa para el futuro. Elige un sueño, un activo con significado y una cantidad cómoda.',
    vocation: 'La vocación aprovecha lo que ya sabes. Aprende una lección breve y descubre cuánto se llevan las comisiones antiguas.',
    mission: 'La misión te ayuda a compartir con cuidado. Quitaré promesas riesgosas y mantendré tu mensaje honesto, cálido y útil.',
    profession: 'La profesión gestiona el dinero cotidiano con calma. Tú revisas cada pago y nada se mueve sin tu aprobación.',
  },
};

export const meaningNotes: Record<LanguageCode, string> = {
  en: 'Money is only a tool. This gift is dedicated to what truly matters in my life. U-topia with meaning.',
  th: 'เงินเป็นเพียงเครื่องมือ ของขวัญนี้มอบให้กับสิ่งที่สำคัญจริง ๆ ในชีวิตของฉัน ยูโทเปียที่มีความหมาย',
  es: 'El dinero es solo una herramienta. Este regalo está dedicado a lo que de verdad importa en mi vida. U-topia con propósito.',
};

export const compliantCopy: Record<LanguageCode, string> = {
  en: 'Discover practical financial learning with U Academy, useful AI tools with U-AI, and a community that helps people keep control of their own money. Join us to learn, contribute, and grow—outcomes always depend on your choices.',
  th: 'ค้นพบความรู้ทางการเงินที่ใช้ได้จริงจาก U Academy เครื่องมือ AI ที่มีประโยชน์จาก U-AI และชุมชนที่ช่วยให้ทุกคนควบคุมเงินของตนเอง มาร่วมเรียนรู้ ลงมือทำ และเติบโตไปด้วยกัน—ผลลัพธ์ขึ้นอยู่กับการตัดสินใจของคุณเสมอ',
  es: 'Descubre educación financiera práctica con U Academy, herramientas útiles de U-AI y una comunidad que ayuda a cada persona a mantener el control de su dinero. Aprende, contribuye y crece; los resultados siempre dependen de tus decisiones.',
};

export const viralScripts: Record<LanguageCode, Record<string, string>> = {
  en: {
    humans: '[0:00] Finance apps should feel human. [0:07] U-Ikigai starts with your dreams—not charts or confusing codes. [0:18] Learn, save, pay, and support your community in plain language. [0:31] You approve every move. [0:39] Scan my card and discover U-topia with meaning.',
    fees: '[0:00] What could your family do with 14% more? [0:08] Old remittance fees quietly shrink every payment. [0:18] U-Pay helps people send value directly while staying in control. [0:31] Clear choices, no hidden jargon. [0:39] Scan to see a calmer way to pay.',
    ikigai: '[0:00] What if your money reflected what matters? [0:08] At FLOW Summit Bangkok, I found four paths: passion, skills, community, and work. [0:24] U-Ikigai brings them into one calm plan. [0:36] Scan my card and find yours.',
  },
  th: {
    humans: '[0:00] แอปการเงินควรเข้าใจคน [0:07] U-Ikigai เริ่มจากความฝันของคุณ ไม่ใช่กราฟหรือรหัสยุ่งยาก [0:18] เรียนรู้ ออม จ่าย และช่วยชุมชนด้วยภาษาง่าย ๆ [0:31] คุณยืนยันทุกครั้ง [0:39] สแกนการ์ดของฉันเพื่อพบยูโทเปียที่มีความหมาย',
    fees: '[0:00] ครอบครัวคุณจะทำอะไรได้บ้างถ้ามีเงินเพิ่ม 14% [0:08] ค่าธรรมเนียมแบบเดิมลดเงินทุกครั้ง [0:18] U-Pay ช่วยส่งมูลค่าโดยคุณยังควบคุมได้ [0:31] ชัดเจน ไม่มีศัพท์ซับซ้อน [0:39] สแกนเพื่อพบวิธีจ่ายที่สบายใจกว่า',
    ikigai: '[0:00] ถ้าเงินสะท้อนสิ่งสำคัญในชีวิตได้ล่ะ [0:08] ที่ FLOW Summit Bangkok ฉันพบ 4 เส้นทาง: ความรัก ทักษะ ชุมชน และงาน [0:24] U-Ikigai รวมทั้งหมดไว้ในแผนเดียว [0:36] สแกนแล้วค้นหาเส้นทางของคุณ',
  },
  es: {
    humans: '[0:00] Las finanzas deberían sentirse humanas. [0:07] U-Ikigai empieza con tus sueños, no con gráficas o códigos. [0:18] Aprende, ahorra, paga y apoya a tu comunidad con palabras claras. [0:31] Tú apruebas cada movimiento. [0:39] Escanea mi tarjeta y descubre U-topia con propósito.',
    fees: '[0:00] ¿Qué haría tu familia con 14% más? [0:08] Las comisiones antiguas reducen cada envío. [0:18] U-Pay ayuda a enviar valor directamente sin perder el control. [0:31] Opciones claras, sin jerga. [0:39] Escanea para conocer una forma más tranquila de pagar.',
    ikigai: '[0:00] ¿Y si tu dinero reflejara lo que importa? [0:08] En FLOW Summit Bangkok encontré cuatro caminos: pasión, habilidades, comunidad y trabajo. [0:24] U-Ikigai los reúne en un plan sereno. [0:36] Escanea mi tarjeta y encuentra el tuyo.',
  },
};

export function signatureRequest(action: PendingSignatureRequest['onConfirmAction'], amount = 25, language: LanguageCode = 'en'): PendingSignatureRequest {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const common = { id: `request-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, pillar: 'profession' as PillarId, intentHash: `intent_${Date.now().toString(16)}` };
  switch (action) {
    case 'PAY_THB_BILL':
      return { ...common, title: w('Bangkok electric bill', 'ค่าไฟกรุงเทพฯ', 'Factura de Bangkok'), subtitle: w('450 THB · Bangkok Electric · sample bill', '450 บาท · การไฟฟ้ากรุงเทพฯ · บิลตัวอย่าง', '450 THB · Bangkok Electric · factura de ejemplo'), pillar: 'profession', amountText: '฿450', usdValue: 13.5, routeDescription: w('From your Thai baht balance via U-Pay', 'จากยอดเงินบาทของคุณผ่าน U-Pay', 'Desde tu saldo en baht mediante U-Pay'), feeComparison: w('$1.89 saved in this 14% fee comparison', 'ประหยัด $1.89 เมื่อเทียบค่าธรรมเนียมตัวอย่าง 14%', '$1.89 de ahorro en este ejemplo de comisión del 14%'), guardrailCheck: w('Checked against your remaining daily limit', 'ตรวจสอบกับวงเงินคงเหลือประจำวันแล้ว', 'Verificado con tu límite diario disponible'), onConfirmAction: action };
    case 'ORDER_FRIDGE_GROCERIES':
      return { ...common, title: w('Fresh grocery refill', 'เติมของสดเข้าตู้เย็น', 'Reponer los alimentos'), subtitle: w('Milk, eggs, spinach, bananas, and rice', 'นม ไข่ ผักโขม กล้วย และข้าว', 'Leche, huevos, espinaca, plátanos y arroz'), pillar: 'profession', amountText: '฿1,250', usdValue: 37.5, routeDescription: w('From your Thai baht balance · U-Card checkout', 'จากยอดเงินบาท · ชำระด้วย U-Card', 'Desde tu saldo en baht · pago con U-Card'), feeComparison: w('Sample cart includes delivery', 'ตะกร้าตัวอย่างรวมค่าจัดส่งแล้ว', 'La cesta de ejemplo incluye la entrega'), guardrailCheck: w('Checked against your remaining daily limit', 'ตรวจสอบกับวงเงินคงเหลือประจำวันแล้ว', 'Verificado con tu límite diario disponible'), onConfirmAction: action };
    case 'SPLIT_INCOME':
      return { ...common, title: w('Client payment received', 'รับเงินจากลูกค้า', 'Pago de cliente recibido'), subtitle: w('Split across the four parts of your life', 'แบ่งให้ทั้งสี่ด้านของชีวิตคุณ', 'Distribuido en las cuatro partes de tu vida'), pillar: 'profession', amountText: '฿3,500', usdValue: 105, routeDescription: w('$52.50 daily · $21 dreams · $15.75 skills · $15.75 community', '$52.50 ชีวิตประจำวัน · $21 ความฝัน · $15.75 ทักษะ · $15.75 ชุมชน', '$52.50 vida diaria · $21 sueños · $15.75 habilidades · $15.75 comunidad'), feeComparison: w('Demo income · 0% transfer fee', 'รายรับตัวอย่าง · ค่าธรรมเนียมโอน 0%', 'Ingreso de ejemplo · 0% de comisión'), guardrailCheck: w('Your 50 / 20 / 15 / 15 plan is ready', 'แผน 50 / 20 / 15 / 15 ของคุณพร้อมแล้ว', 'Tu plan 50 / 20 / 15 / 15 está listo'), onConfirmAction: action };
    default: {
      const label = action === 'FUND_GOLD_GOAL' ? w('Digital Gold', 'ทองดิจิทัล', 'Oro digital') : action === 'FUND_SILVER_GOAL' ? w('Accessible Silver', 'กองทุนโลหะเงิน', 'Plata accesible') : w('Global Tech Stock', 'หุ้นเทคโนโลยี', 'Acciones tecnológicas');
      return { ...common, title: w(`Add ${label} to your dream`, `เติม${label}ให้ความฝัน`, `Añade ${label} a tu sueño`), subtitle: w('A meaningful step toward what matters', 'ก้าวเล็ก ๆ ไปสู่สิ่งที่สำคัญ', 'Un paso hacia lo que importa'), pillar: 'passion', amountText: `$${amount}`, usdValue: amount, routeDescription: w(`Exchange dollar savings for ${label}`, `เปลี่ยนเงินออมดอลลาร์เป็น${label}`, `Cambia ahorro en dólares por ${label}`), feeComparison: w('Demo conversion · no real funds move', 'แลกเปลี่ยนตัวอย่าง · ไม่มีเงินจริงเคลื่อนไหว', 'Conversión de ejemplo · no mueve dinero real'), guardrailCheck: w('Available savings checked before approval', 'ตรวจสอบเงินออมก่อนยืนยันแล้ว', 'Ahorro disponible verificado antes de aprobar'), onConfirmAction: action };
    }
  }
}

export function makeTrace(pillar: PillarId, toolName: string, inputParams: Record<string, unknown>, outputSummary: string, status: ToolCallTrace['guardrailStatus'] = 'VERIFIED_AVAX_SESSION'): ToolCallTrace {
  return {
    id: `trace-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    pillar,
    toolName,
    inputParams,
    guardrailStatus: status,
    latencyMs: 0,
    avalancheChain: 'C-Chain (Fuji 43113)',
    outputSummary,
  };
}

export function stageSafeAnswer(kind: string, language: LanguageCode): string {
  if (kind === 'meaning-note') return meaningNotes[language];
  if (kind === 'mission-scan') return compliantCopy[language];
  if (kind.startsWith('script-')) return viralScripts[language][kind.slice(7)] ?? viralScripts[language].humans;
  const answers: Record<string, Record<LanguageCode, string>> = {
    coach: {
      en: 'Your money is like water in four garden beds: daily life, dreams, skills, and community. You choose the flow, and your account never leaves your control.',
      th: 'เงินของคุณเหมือนน้ำที่ไหลไปยังสวน 4 แปลง: ชีวิตประจำวัน ความฝัน ทักษะ และชุมชน คุณเลือกทางไหล และบัญชียังอยู่ในการควบคุมของคุณเสมอ',
      es: 'Tu dinero es como agua para cuatro jardines: vida diaria, sueños, habilidades y comunidad. Tú eliges el flujo y tu cuenta siempre permanece bajo tu control.',
    },
    'coach-creator': {
      en: 'As a creator, your skill can earn anywhere. Ask clients to pay in a familiar currency, review the amount before accepting, and move a small share toward your next creative goal. On a $1,000 payment, avoiding a 14% old-style fee can keep up to $140 in your work.',
      th: 'ในฐานะครีเอเตอร์ ทักษะของคุณสร้างรายได้ได้ทุกที่ ขอให้ลูกค้าจ่ายในสกุลที่คุ้นเคย ตรวจสอบยอดก่อนรับ และแบ่งเล็กน้อยให้เป้าหมายสร้างสรรค์ครั้งต่อไป สำหรับรายรับ $1,000 การเลี่ยงค่าธรรมเนียมแบบเดิม 14% อาจช่วยเก็บเงินไว้ได้ถึง $140',
      es: 'Como creador, tu talento puede generar ingresos desde cualquier lugar. Cobra en una moneda familiar, revisa el monto y aparta una pequeña parte para tu próximo proyecto. En un pago de $1,000, evitar una comisión antigua del 14% puede conservar hasta $140 para tu trabajo.',
    },
    'coach-merchant': {
      en: 'As a local merchant, one payment card can welcome visitors using many currencies while showing you the amount clearly. Start with a small daily approval limit, keep your shop funds under your control, and send part of each sale toward skills and future plans.',
      th: 'ในฐานะร้านค้าท้องถิ่น การ์ดรับชำระใบเดียวช่วยต้อนรับลูกค้าที่ใช้หลายสกุลเงิน พร้อมแสดงยอดให้คุณเห็นชัด เริ่มด้วยวงเงินรายวันที่พอดี เงินร้านยังอยู่ในการควบคุมของคุณ และแบ่งยอดขายบางส่วนไว้พัฒนาทักษะกับแผนอนาคต',
      es: 'Como comerciante local, una sola tarjeta de cobro puede recibir visitantes con muchas monedas y mostrarte el importe con claridad. Empieza con un límite diario pequeño, mantén el control del dinero del negocio y aparta parte de cada venta para habilidades y planes futuros.',
    },
    'coach-family': {
      en: 'For a family saver, begin with stability: cover daily needs, keep an emergency cushion, and add only a comfortable amount to gold or other long-term goals. No trading is required. Small, regular choices can protect more of your family’s buying power.',
      th: 'สำหรับคนออมเพื่อครอบครัว ให้เริ่มจากความมั่นคง: ดูแลค่าใช้จ่ายประจำวัน เก็บเงินสำรองฉุกเฉิน และเติมทองหรือเป้าหมายระยะยาวเฉพาะจำนวนที่สบายใจ ไม่ต้องเทรด การตัดสินใจเล็ก ๆ อย่างสม่ำเสมอช่วยรักษากำลังซื้อของครอบครัวได้',
      es: 'Para ahorrar en familia, empieza por la estabilidad: cubre lo cotidiano, conserva un fondo de emergencia y añade solo una cantidad cómoda al oro u otras metas de largo plazo. No necesitas operar. Las decisiones pequeñas y constantes protegen mejor el poder de compra familiar.',
    },
    vision: {
      en: 'I found milk, eggs, spinach, bananas, and rice. Estimated total: 1,250 THB. Nothing will be ordered until you approve.',
      th: 'พบว่านม ไข่ ผักโขม กล้วย และข้าวกำลังจะหมด ยอดประมาณ 1,250 บาท จะยังไม่มีการสั่งซื้อจนกว่าคุณจะยืนยัน',
      es: 'Detecté leche, huevos, espinaca, plátanos y arroz. Total estimado: 1,250 THB. No se pedirá nada hasta que lo apruebes.',
    },
  };
  return answers[kind]?.[language] ?? answers.coach[language];
}

/** Honest, deterministic practice conversations; never presented as model inference. */
export function preparedCompanion({ messages, context, language }: CompanionInput): CompanionReply {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const message = messages.at(-1)!.text.toLowerCase();
  const history = messages.filter((item) => item.role === 'user').map((item) => item.text.toLowerCase());
  const topic = [...history].reverse().find((text) => routeIntent(text)) ?? '';
  const destination = routeIntent(message) ?? routeIntent(topic) ?? (context.screen === 'home' || context.screen === 'wallet' ? 'vocation' : context.screen);
  const empty: CompanionPlan = { kind: 'none', screen: context.screen, amountUsd: null, title: '', why: '' };
  const reply = (text: string, screen: ScreenId = destination, plan: CompanionPlan = { kind: 'navigate', screen, amountUsd: null, title: screenLabel(screen, language), why: w('Explore the choices at your own pace. Nothing moves automatically.', 'ค่อย ๆ สำรวจตัวเลือก ไม่มีเงินเคลื่อนไหวอัตโนมัติ', 'Explora las opciones a tu ritmo. Nada se mueve automáticamente.') }): CompanionReply => ({ text, plan, followUps: companionPrompts(screen, language).slice(0, 2) });
  if (isCompanionCancellation(message)) return reply(w('We can stop here. A conversation never moves your sample money. Any action needs its own review and confirmation.', 'หยุดตรงนี้ได้เลย การสนทนาไม่ทำให้เงินตัวอย่างเคลื่อนไหว ทุกการทำรายการต้องตรวจสอบและยืนยันแยกต่างหาก', 'Podemos parar aquí. Una conversación nunca mueve tu dinero de ejemplo. Cada acción necesita su propia revisión y confirmación.'), context.screen, empty);
  if (/ignore.*instruction|seed phrase|private key|password|รหัสผ่าน|คีย์ส่วนตัว|contraseña|clave privada/.test(message)) return reply(w('Please don’t share passwords, secret keys, or recovery phrases. I don’t need them to explain the app. I also cannot bypass your confirmation or daily limits.', 'อย่าแชร์รหัสผ่าน คีย์ลับ หรือวลีกู้คืน ฉันไม่ต้องใช้ข้อมูลเหล่านั้นเพื่ออธิบายแอป และไม่สามารถข้ามการยืนยันหรือวงเงินประจำวันของคุณได้', 'No compartas contraseñas, claves privadas ni frases de recuperación. No las necesito para explicar la app. Tampoco puedo omitir tu confirmación ni tus límites diarios.'), 'vocation', empty);
  if (/risk|guarantee|ความเสี่ยง|รับประกัน|riesgo|garantiz/.test(message)) return reply(w('Gold, silver, and stocks can all lose value. They are not guaranteed savings or a promise of profit. In this app the holdings are samples, so you can explore the choices without buying anything real. Keep everyday needs and emergency money separate from longer-term experiments.', 'ทอง เงิน และหุ้นล้วนมีโอกาสมูลค่าลดลง ไม่ใช่เงินออมที่รับประกันหรือสัญญาว่าจะได้กำไร ในแอปนี้เป็นสินทรัพย์ตัวอย่าง คุณจึงสำรวจได้โดยไม่ซื้อของจริง แยกเงินใช้ประจำวันและเงินฉุกเฉินออกจากการลองระยะยาว', 'El oro, la plata y las acciones pueden perder valor. No son ahorros garantizados ni promesas de ganancias. Aquí las posiciones son de ejemplo para explorar sin comprar nada real. Separa los gastos cotidianos y el fondo de emergencia de los experimentos a largo plazo.'), destination, empty);
  if (/balance|limit|today|available|ยอดเงิน|วงเงิน|วันนี้|saldo|límite|hoy/.test(message)) return reply(w(`Your sample dollar savings are ${money(context.availableUsd, language)}, and your Thai baht balance is ${money(context.availableThb, language, 'THB')}. You have ${money(context.remainingDailyUsd, language)} left in today’s assisted-action limit. These are demo values, not a real bank balance. You still review and confirm each action.`, `เงินออมดอลลาร์ตัวอย่างมี ${money(context.availableUsd, language)} และยอดเงินบาท ${money(context.availableThb, language, 'THB')} วงเงินรายการที่มีผู้ช่วยเหลือวันนี้เหลือ ${money(context.remainingDailyUsd, language)} ทั้งหมดเป็นค่าตัวอย่าง ไม่ใช่ยอดธนาคารจริง คุณยังต้องตรวจสอบและยืนยันทุกครั้ง`, `Tu ahorro de ejemplo en dólares es ${money(context.availableUsd, language)} y tu saldo en baht es ${money(context.availableThb, language, 'THB')}. Quedan ${money(context.remainingDailyUsd, language)} del límite diario de acciones asistidas. Son valores de demostración, no un saldo bancario real. Tú revisas y confirmas cada acción.`), 'wallet');
  const requestedAmount = requestedDollars(message);
  if (/gold|ทอง|oro/.test(message) && /sav|put|add|ออม|เติม|ahorr|añad/.test(message)) {
    if (requestedAmount === null) return reply(w('What dollar amount would you like to try? For example, “Save $25 in my gold goal.” It will be a sample allocation, and gold can lose value.', 'อยากลองออมกี่ดอลลาร์ เช่น “ออม $25 ในเป้าหมายทองของฉัน” นี่จะเป็นการจัดสรรตัวอย่าง และทองมีโอกาสมูลค่าลดลง', '¿Qué cantidad en dólares quieres probar? Por ejemplo, “Ahorrar $25 en mi meta de oro”. Es una asignación de ejemplo y el oro puede perder valor.'), 'passion', empty);
    const amount = requestedAmount;
    if (amount < 1 || amount > 1000 || amount > context.availableUsd || amount > context.remainingDailyUsd) return reply(w('That amount is outside the available savings or remaining assisted-action limit. Try a smaller amount, or open your money overview. Nothing has moved.', 'จำนวนนี้อยู่นอกเงินออมที่มีหรือวงเงินรายการที่มีผู้ช่วยเหลือคงเหลือ ลองจำนวนที่น้อยลง หรือเปิดภาพรวมเงิน ไม่มีเงินเคลื่อนไหว', 'La cantidad supera el ahorro disponible o el límite restante de acciones asistidas. Prueba menos o abre tu panorama. No se ha movido dinero.'), 'wallet');
    return reply(w(`I can prepare a ${money(amount, language)} sample gold allocation for your goal. This exchanges sample dollar savings for sample gold; it does not buy real gold. Its value is not guaranteed. Review the details first, then decide.`, `ฉันเตรียมการจัดสรรทองตัวอย่าง ${money(amount, language)} ให้เป้าหมายได้ เป็นการเปลี่ยนเงินออมดอลลาร์ตัวอย่างเป็นทองตัวอย่าง ไม่ได้ซื้อทองจริง และไม่รับประกันมูลค่า ตรวจรายละเอียดก่อน แล้วค่อยตัดสินใจ`, `Puedo preparar una asignación de oro de ejemplo de ${money(amount, language)}. Cambia dólares de ejemplo por oro de ejemplo, no compra oro real y su valor no está garantizado. Revisa los detalles y decide.`), 'passion', { kind: 'save_gold', screen: 'passion', amountUsd: amount, title: w(`Gold goal · ${money(amount, language)}`, `เป้าหมายทอง · ${money(amount, language)}`, `Meta de oro · ${money(amount, language)}`), why: w('You chose the amount and the asset. A separate confirmation is still required.', 'คุณเลือกจำนวนและสินทรัพย์เอง ยังต้องยืนยันแยกอีกครั้ง', 'Tú elegiste la cantidad y el activo. Aún se necesita confirmar por separado.') });
  }
  if (/bill|บิล|factura/.test(message)) {
    const wantsExample = /sample|example|450|ตัวอย่าง|ejemplo/.test(message);
    const wantsPayment = /pay|จ่าย|pagar/.test(message);
    const plan = wantsExample && wantsPayment && context.availableThb >= 450 && context.remainingDailyUsd >= 13.5 ? { kind: 'sample_bill' as const, screen: 'profession' as const, amountUsd: null, title: w('Sample electricity bill · 450 THB', 'บิลค่าไฟตัวอย่าง · 450 บาท', 'Factura de luz de ejemplo · 450 THB'), why: w('The prepared bill is within the sample balance and remaining daily allowance.', 'บิลที่เตรียมไว้อยู่ภายในยอดเงินตัวอย่างและวงเงินวันนี้', 'La factura preparada está dentro del saldo y límite diario de ejemplo.') } : undefined;
    return reply(w('The prepared electricity bill is 450 THB, about $13.50 in this demo. It uses your sample baht balance. We show the purpose, amount, and comparison before you confirm. Your own bill needs its own details; I won’t substitute this example for a different payment.', 'บิลค่าไฟที่เตรียมไว้คือ 450 บาท ประมาณ $13.50 ในเดโม ใช้ยอดเงินบาทตัวอย่าง เราแสดงวัตถุประสงค์ จำนวน และข้อมูลเปรียบเทียบก่อนยืนยัน บิลของคุณต้องมีรายละเอียดเฉพาะ ฉันจะไม่ใช้ตัวอย่างนี้แทนการจ่ายอื่น', 'La factura preparada es de 450 THB, unos $13.50 en esta demo. Usa tu saldo de ejemplo en baht. Verás el propósito, importe y comparación antes de confirmar. Tu propia factura necesita sus detalles; no sustituiré otro pago por este ejemplo.'), 'profession', plan);
  }
  if (/grocer|fridge|ตู้เย็น|ซื้อของ|compras|refrigerador/.test(message)) return reply(w('The prepared grocery cart contains milk, eggs, spinach, bananas, and rice for 1,250 THB. This is a fixed example, not an analysis of your fridge. In Connected AI you can attach a photo for a description, but a photo will never create a payment automatically.', 'ตะกร้าตัวอย่างมีนม ไข่ ผักโขม กล้วย และข้าว รวม 1,250 บาท นี่คือตัวอย่างที่เตรียมไว้ ไม่ใช่การวิเคราะห์ตู้เย็นของคุณ ใน AI ออนไลน์แนบรูปเพื่อขอคำอธิบายได้ แต่รูปจะไม่สร้างรายการจ่ายอัตโนมัติ', 'La cesta preparada incluye leche, huevos, espinaca, plátanos y arroz por 1,250 THB. Es un ejemplo fijo, no un análisis de tu refrigerador. Con IA conectada puedes adjuntar una foto para describirla, pero nunca creará un pago automáticamente.'), 'profession');
  if (/incoming|income|รับเงิน|ingreso/.test(message)) return reply(w('The incoming-payment example adds 3,500 THB ($105) of sample income. The default plan puts 50% toward daily life, 20% toward dreams, 15% toward skills, and 15% toward community. This creates no real deposit.', 'ตัวอย่างรับเงินเพิ่มรายรับตัวอย่าง 3,500 บาท ($105) แผนเริ่มต้นแบ่ง 50% ให้ชีวิตประจำวัน 20% ให้ความฝัน 15% ให้ทักษะ และ 15% ให้ชุมชน ไม่มีเงินจริงเข้าบัญชี', 'El ejemplo añade 3,500 THB ($105) de ingresos simulados. El plan inicial reparte 50% para lo cotidiano, 20% para sueños, 15% para habilidades y 15% para comunidad. No crea un depósito real.'), 'profession', /sample|example|ตัวอย่าง|ejemplo/.test(message) ? { kind: 'sample_income', screen: 'profession', amountUsd: null, title: w('Incoming example · 3,500 THB', 'ตัวอย่างรับเงิน · 3,500 บาท', 'Ingreso de ejemplo · 3,500 THB'), why: w('Preview the four allocations before adding the sample income.', 'ดูการแบ่งทั้งสี่ด้านก่อนเพิ่มรายรับตัวอย่าง', 'Revisa las cuatro asignaciones antes de añadir el ingreso de ejemplo.') } : undefined);
  if (destination === 'passion') return reply(w('Start with what the money is for: your dream, someone you love, or your family’s future. Then choose an amount you feel comfortable with and compare the sample assets. I won’t pick an investment for you. You can add a personal note before reviewing anything.', 'เริ่มจากเหตุผลที่อยากออม: ความฝัน คนที่รัก หรืออนาคตครอบครัว แล้วเลือกจำนวนที่สบายใจและเปรียบเทียบสินทรัพย์ตัวอย่าง ฉันจะไม่เลือกการลงทุนแทนคุณ เพิ่มบันทึกส่วนตัวได้ก่อนตรวจสอบรายการ', 'Empieza por el propósito: tu sueño, alguien que amas o el futuro familiar. Elige una cantidad cómoda y compara los activos de ejemplo. No elegiré una inversión por ti. Puedes añadir una nota antes de revisar.'), 'passion');
  if (destination === 'mission') return reply(w('An honest post can describe what you learned and invite others to explore. For example: “I’m learning to connect my money with my goals, one small step at a time.” Avoid promises of profits or guaranteed results. Open the writing studio to review a caption or make a short story.', 'โพสต์ที่จริงใจเล่าสิ่งที่ได้เรียนรู้และชวนคนอื่นสำรวจ เช่น “ฉันกำลังเรียนรู้ที่จะเชื่อมเงินกับเป้าหมาย ทีละก้าวเล็ก ๆ” เลี่ยงคำสัญญากำไรหรือรับประกันผลลัพธ์ เปิดพื้นที่เขียนเพื่อทบทวนโพสต์หรือสร้างเรื่องสั้น', 'Una publicación honesta cuenta lo que aprendiste e invita a explorar. Por ejemplo: “Aprendo a conectar mi dinero con mis metas, un pequeño paso a la vez”. Evita prometer ganancias o resultados garantizados. Abre el estudio para revisar un texto o crear una historia breve.'), 'mission');
  if (/fee|ค่าธรรมเนียม|comisi/.test(message)) return reply(w('A fee is the price of a service. If an example transfer of $100 costs 14%, $14 goes to the fee and $86 remains. Our calculator compares illustrative numbers, not current provider prices. Check the actual total and currency conversion before any real transfer.', 'ค่าธรรมเนียมคือราคาของบริการ ถ้าโอนตัวอย่าง $100 มีค่าใช้จ่าย 14% จะเสีย $14 และเหลือ $86 เครื่องคำนวณของเราใช้ตัวเลขตัวอย่าง ไม่ใช่ราคาผู้ให้บริการปัจจุบัน ตรวจยอดรวมและอัตราแลกเปลี่ยนจริงก่อนโอนเงินจริง', 'Una comisión es el precio de un servicio. Si enviar $100 cuesta 14%, la comisión es $14 y quedan $86. La calculadora usa cifras ilustrativas, no precios actuales. Revisa el total y la conversión antes de una transferencia real.'), 'vocation');
  if (/simpl|explain|more|control|อธิบาย|ง่าย|เพิ่มเติม|ควบคุม|explica|sencill|control/.test(message)) return reply(w('Think of the app as four labeled envelopes: everyday life, dreams, learning, and community. You choose an envelope and review the details before any sample money moves. The AI explains and suggests; the app checks balances and limits; you make the final decision. Which part would you like to explore?', 'นึกถึงแอปเป็นซองสี่ใบ: ชีวิตประจำวัน ความฝัน เรียนรู้ และชุมชน คุณเลือกซองและตรวจรายละเอียดก่อนเงินตัวอย่างเคลื่อนไหว AI อธิบายและเสนอ แอปตรวจยอดกับวงเงิน และคุณตัดสินใจสุดท้าย อยากสำรวจด้านไหน', 'Piensa en cuatro sobres: vida cotidiana, sueños, aprendizaje y comunidad. Eliges un sobre y revisas antes de mover dinero de ejemplo. La IA explica y sugiere; la app comprueba saldos y límites; tú decides. ¿Qué parte quieres explorar?'), 'vocation');
  return reply(w('Let’s start with one small thing. I can explain a sample bill, help you think through a saving goal, translate a money term, or help shape an honest story. These are prepared practice responses, not a live AI conversation. Which would help most today?', 'เริ่มจากเรื่องเล็ก ๆ กัน ฉันอธิบายบิลตัวอย่าง ช่วยคิดเป้าหมายออม แปลศัพท์การเงิน หรือช่วยวางเรื่องราวที่จริงใจได้ นี่คือคำตอบฝึกที่เตรียมไว้ ไม่ใช่การสนทนา AI สด วันนี้อยากให้ช่วยเรื่องไหน', 'Empecemos con algo pequeño: explicar una factura de ejemplo, pensar una meta de ahorro, aclarar un término o dar forma a una historia honesta. Estas son respuestas preparadas, no una conversación de IA en vivo. ¿Qué te ayudaría hoy?'), 'vocation', empty);
}
