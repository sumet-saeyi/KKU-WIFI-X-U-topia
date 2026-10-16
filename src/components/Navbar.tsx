'use client';

import { Icon } from '@/components/ui/Icon';
import { ProductBrand, ViewSwitcher } from '@/components/product/Navigation';
import { words } from '@/lib/i18n';
import { screenLabel, type ScreenId } from '@/lib/product';
import type { ExperienceMode, LanguageCode } from '@/lib/types';

interface NavbarProps { language: LanguageCode; experienceMode: ExperienceMode; screen: ScreenId; onLanguageChange: (language: LanguageCode) => void; onExperienceModeChange: (mode: ExperienceMode) => void; onHelp: () => void; onSettings: () => void; onHome: () => void; onAskAi: () => void; }

export function Navbar({ language, experienceMode, screen, onLanguageChange, onExperienceModeChange, onHelp, onSettings, onHome, onAskAi }: NavbarProps) {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  return <><div className="preview-toolbar"><span>{w('ONE LIFE. TWO WAYS TO EXPERIENCE IT.', 'หนึ่งชีวิต สองประสบการณ์', 'UNA VIDA. DOS FORMAS DE VIVIRLA.')}</span><ViewSwitcher mode={experienceMode} language={language} onChange={onExperienceModeChange} /></div><header className="product-header">
    <div className="desktop-header-title"><small>U-IKIGAI / {w('YOUR PERSONAL SPACE', 'พื้นที่ของคุณ', 'TU ESPACIO PERSONAL')}</small><strong>{screenLabel(screen, language)}</strong></div>
    <div className="mobile-header-title">{screen === 'home' ? <ProductBrand language={language} /> : <><button className="icon-button" onClick={onHome} aria-label={w('Back to home', 'กลับหน้าหลัก', 'Volver al inicio')}><Icon name="back" /></button><strong>{screenLabel(screen, language)}</strong></>}</div>
    <div className="header-actions"><button className="header-ai" onClick={onAskAi} aria-label={w('Ask AI companion', 'ถามเพื่อน AI', 'Preguntar al compañero de IA')}><Icon name="spark" size={18} /><span>AI</span></button><span className="practice-indicator"><i />{w('Practice space', 'พื้นที่ทดลอง', 'Espacio de práctica')}</span><label className="language-select"><Icon name="globe" size={16} /><span className="sr-only">{w('Language', 'ภาษา', 'Idioma')}</span><select value={language} onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}><option value="en">EN</option><option value="th">ไทย</option><option value="es">ES</option></select></label><button className="icon-button header-help" onClick={onHelp} aria-label={w('Help me get started', 'ช่วยฉันเริ่มต้น', 'Ayúdame a empezar')}><Icon name="help" size={20} /></button><button className="avatar-button" onClick={onSettings} aria-label={w('Open preferences', 'เปิดการตั้งค่า', 'Abrir preferencias')}>U<span /></button></div>
  </header></>;
}
