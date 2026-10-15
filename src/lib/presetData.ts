import type { LanguageCode, PendingSignatureRequest, PillarId, ToolCallTrace, WalletState } from './types';
import { words } from './i18n';

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
