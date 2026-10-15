import type { LanguageCode, PillarId } from './types';

export const languageLabels: Record<LanguageCode, string> = {
  en: 'EN',
  th: 'ภาษาไทย',
  es: 'ES',
};

export const localeByLanguage: Record<LanguageCode, string> = {
  en: 'en-US',
  th: 'th-TH',
  es: 'es-MX',
};

const copy = {
  en: {
    tagline: 'U-topia With Meaning',
    eyebrow: 'Your calm money companion',
    intro: 'Put your money behind the life you actually want—without learning crypto.',
    balance: 'Your whole picture',
    architecture: 'Mentor Architecture View',
    stageSafe: 'Stage-Safe',
    liveAi: 'Live AI',
    viewLabel: 'Preview experience',
    webView: 'Web',
    mobileView: 'Mobile',
    journey: ['Choose what matters', 'Try one simple action', 'Review before anything moves'],
    protected: 'You stay in control',
    reviewAction: 'Review this action',
    walletReady: 'Wallet ready',
    remainingToday: 'left today',
    approve: 'Approve with one tap',
    decline: 'Not now',
    activity: 'Recent activity',
    noActivity: 'Your completed actions will appear here.',
    listening: 'Your calm guide is speaking…',
    pillars: {
      passion: { name: 'Passion', question: 'What you love', summary: 'Fund dreams and meaningful gifts' },
      vocation: { name: 'Vocation', question: 'What you are good at', summary: 'Build skills and protect your earning power' },
      mission: { name: 'Mission', question: 'What the world needs', summary: 'Share your story safely' },
      profession: { name: 'Profession', question: 'What you get paid for', summary: 'Pay, earn, and split money automatically' },
    },
  },
  th: {
    tagline: 'ยูโทเปียที่มีความหมาย',
    eyebrow: 'เพื่อนคู่คิดทางการเงินที่ใจเย็น',
    intro: 'ให้เงินสนับสนุนชีวิตที่คุณต้องการ โดยไม่ต้องเรียนรู้เรื่องคริปโต',
    balance: 'ภาพรวมของคุณ',
    architecture: 'มุมมองสถาปัตยกรรมสำหรับเมนเทอร์',
    stageSafe: 'โหมดออฟไลน์',
    liveAi: 'AI สด',
    viewLabel: 'ดูตัวอย่างประสบการณ์',
    webView: 'เว็บ',
    mobileView: 'มือถือ',
    journey: ['เลือกสิ่งที่สำคัญ', 'ลองทำหนึ่งขั้นตอนง่าย ๆ', 'ตรวจสอบก่อนเงินเคลื่อนไหว'],
    protected: 'คุณเป็นผู้ควบคุมเสมอ',
    reviewAction: 'ตรวจสอบรายการนี้',
    walletReady: 'กระเป๋าพร้อมใช้งาน',
    remainingToday: 'ใช้ได้อีกวันนี้',
    approve: 'ยืนยันในแตะเดียว',
    decline: 'ไว้ก่อน',
    activity: 'กิจกรรมล่าสุด',
    noActivity: 'รายการที่เสร็จแล้วจะแสดงที่นี่',
    listening: 'ไกด์ที่ใจเย็นกำลังพูด…',
    pillars: {
      passion: { name: 'สิ่งที่รัก', question: 'สิ่งที่คุณรัก', summary: 'เก็บเงินเพื่อความฝันและของขวัญที่มีความหมาย' },
      vocation: { name: 'ความถนัด', question: 'สิ่งที่คุณทำได้ดี', summary: 'สร้างทักษะและปกป้องรายได้' },
      mission: { name: 'พันธกิจ', question: 'สิ่งที่โลกต้องการ', summary: 'แบ่งปันเรื่องราวอย่างปลอดภัย' },
      profession: { name: 'อาชีพ', question: 'สิ่งที่สร้างรายได้', summary: 'จ่าย รับ และแบ่งเงินอัตโนมัติ' },
    },
  },
  es: {
    tagline: 'U-topia con propósito',
    eyebrow: 'Tu compañero financiero sereno',
    intro: 'Pon tu dinero al servicio de la vida que deseas, sin aprender cripto.',
    balance: 'Tu panorama completo',
    architecture: 'Vista de arquitectura para mentores',
    stageSafe: 'Modo sin conexión',
    liveAi: 'IA en vivo',
    viewLabel: 'Vista de experiencia',
    webView: 'Web',
    mobileView: 'Móvil',
    journey: ['Elige lo que importa', 'Prueba una acción sencilla', 'Revisa antes de mover dinero'],
    protected: 'Tú mantienes el control',
    reviewAction: 'Revisa esta acción',
    walletReady: 'Billetera lista',
    remainingToday: 'disponible hoy',
    approve: 'Aprobar con un toque',
    decline: 'Ahora no',
    activity: 'Actividad reciente',
    noActivity: 'Tus acciones completadas aparecerán aquí.',
    listening: 'Tu guía serena está hablando…',
    pillars: {
      passion: { name: 'Pasión', question: 'Lo que amas', summary: 'Financia sueños y regalos con significado' },
      vocation: { name: 'Vocación', question: 'Lo que haces bien', summary: 'Desarrolla habilidades y protege tus ingresos' },
      mission: { name: 'Misión', question: 'Lo que el mundo necesita', summary: 'Comparte tu historia con seguridad' },
      profession: { name: 'Profesión', question: 'Por lo que te pagan', summary: 'Paga, gana y divide dinero automáticamente' },
    },
  },
} as const;

export function t(language: LanguageCode) {
  return copy[language];
}

export const pillarOrder: PillarId[] = ['passion', 'vocation', 'mission', 'profession'];

export function words(language: LanguageCode, en: string, th: string, es: string): string {
  return language === 'th' ? th : language === 'es' ? es : en;
}

export function money(value: number, language: LanguageCode = 'en', currency = 'USD') {
  return new Intl.NumberFormat(localeByLanguage[language], { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}
