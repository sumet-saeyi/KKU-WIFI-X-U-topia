import { words } from './i18n';
import type { IconName } from '@/components/ui/Icon';
import type { LanguageCode, PillarId } from './types';

export type ScreenId = 'home' | PillarId | 'wallet';
export const screenOrder: ScreenId[] = ['home', 'profession', 'passion', 'vocation', 'mission', 'wallet'];
export const screenIcons: Record<ScreenId, IconName> = { home: 'home', profession: 'pay', passion: 'heart', vocation: 'learn', mission: 'share', wallet: 'wallet' };
export const pillarNames: Record<PillarId, string> = { profession: 'Profession', passion: 'Passion', vocation: 'Vocation', mission: 'Mission' };

export function screenLabel(id: ScreenId, language: LanguageCode) {
  return {
    home: words(language, 'My day', 'วันของฉัน', 'Mi día'),
    profession: words(language, 'Pay & get paid', 'จ่ายและรับเงิน', 'Pagar y cobrar'),
    passion: words(language, 'Dreams & gifts', 'ความฝันและของขวัญ', 'Sueños y regalos'),
    vocation: words(language, 'Learn & grow', 'เรียนรู้และเติบโต', 'Aprender y crecer'),
    mission: words(language, 'Share & inspire', 'แบ่งปันและสร้างแรงใจ', 'Compartir e inspirar'),
    wallet: words(language, 'My money', 'เงินของฉัน', 'Mi dinero'),
  }[id];
}

export function routeIntent(text: string): PillarId | null {
  const input = text.toLowerCase();
  if (/bill|pay|paid|grocer|income|จ่าย|บิล|รับเงิน|ตู้เย็น|pagar|factura|cobrar|comida/.test(input)) return 'profession';
  if (/dream|sav|gift|gold|trip|ออม|ฝัน|ของขวัญ|ทอง|sueño|ahorr|regalo|oro/.test(input)) return 'passion';
  if (/learn|skill|coach|เรียน|ทักษะ|aprender|habilidad|guía/.test(input)) return 'vocation';
  if (/shar|post|story|community|แบ่งปัน|โพสต์|ชุมชน|compart|historia|comunidad/.test(input)) return 'mission';
  return null;
}
