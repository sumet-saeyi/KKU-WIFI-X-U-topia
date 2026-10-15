'use client';

import { IkigaiMark } from '@/components/IkigaiMark';
import { Icon } from '@/components/ui/Icon';
import { words } from '@/lib/i18n';
import { screenLabel, screenIcons, screenOrder, type ScreenId } from '@/lib/product';
import type { ExperienceMode, LanguageCode } from '@/lib/types';

interface NavigationProps { screen: ScreenId; language: LanguageCode; onNavigate: (screen: ScreenId) => void; onHelp: () => void; onSettings: () => void; }

export function ProductBrand({ language }: { language: LanguageCode }) {
  return <span className="product-brand"><span className="product-brand-mark"><IkigaiMark compact /></span><span>U-IKIGAI<small>{words(language, 'Money with meaning.', 'เงินที่มีความหมาย', 'Dinero con propósito.')}</small></span></span>;
}

export function DesktopNavigation({ screen, language, onNavigate, onHelp, onSettings }: NavigationProps) {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  return <aside className="desktop-navigation" aria-label={w('Main navigation', 'เมนูหลัก', 'Navegación principal')}><button className="brand-home" onClick={() => onNavigate('home')} aria-label={w('U-Ikigai home', 'หน้าหลัก U-Ikigai', 'Inicio U-Ikigai')}><ProductBrand language={language} /></button><div className="nav-section-label">{w('A LITTLE MORE BALANCE', 'เติมสมดุลให้ชีวิต', 'UN POCO MÁS DE EQUILIBRIO')}</div><nav>{screenOrder.map((id) => <button key={id} aria-current={screen === id ? 'page' : undefined} className={screen === id ? `selected ${id}` : ''} onClick={() => onNavigate(id)}><Icon name={screenIcons[id]} /><span>{screenLabel(id, language)}</span>{screen === id && <i />}</button>)}</nav><div className="sidebar-note"><span className="tiny-spark">✦</span><p>{w('Your money should fit your life.', 'ให้เงินเข้ากับชีวิตของคุณ', 'Tu dinero debería encajar en tu vida.')}</p><small>{w('One small step at a time.', 'ทีละก้าวเล็ก ๆ', 'Un pequeño paso a la vez.')}</small></div><div className="sidebar-bottom"><button onClick={onHelp}><Icon name="help" size={19} />{w('A little help', 'ขอคำแนะนำ', 'Un poco de ayuda')}</button><button onClick={onSettings}><Icon name="settings" size={19} />{w('Preferences', 'การตั้งค่า', 'Preferencias')}</button><div className="sidebar-person"><span>U</span><div><strong>{w('Your personal space', 'พื้นที่ส่วนตัวของคุณ', 'Tu espacio personal')}</strong><small>{w('Made for everyday life', 'เพื่อชีวิตประจำวัน', 'Para la vida cotidiana')}</small></div></div></div></aside>;
}

export function ViewSwitcher({ mode, language, onChange }: { mode: ExperienceMode; language: LanguageCode; onChange: (mode: ExperienceMode) => void }) {
  return <div className="view-switcher" role="group" aria-label={words(language, 'Choose experience', 'เลือกประสบการณ์', 'Elegir experiencia')}><button aria-pressed={mode === 'web'} className={mode === 'web' ? 'selected' : ''} onClick={() => onChange('web')}><Icon name="monitor" size={15} />{words(language, 'Desktop', 'เดสก์ท็อป', 'Escritorio')}</button><button aria-pressed={mode === 'mobile'} className={mode === 'mobile' ? 'selected' : ''} onClick={() => onChange('mobile')}><Icon name="phone" size={15} />{words(language, 'Mobile', 'มือถือ', 'Móvil')}</button></div>;
}

export function MobileNavigation({ screen, language, onNavigate }: Pick<NavigationProps, 'screen' | 'language' | 'onNavigate'>) {
  const items: ScreenId[] = ['home', 'profession', 'passion', 'vocation', 'wallet'];
  const short = { home: words(language, 'Home', 'หน้าหลัก', 'Inicio'), profession: words(language, 'Pay', 'จ่าย', 'Pagar'), passion: words(language, 'Dreams', 'ความฝัน', 'Sueños'), vocation: words(language, 'Grow', 'เติบโต', 'Crecer'), wallet: words(language, 'Money', 'เงิน', 'Dinero') };
  return <nav className="mobile-navigation" aria-label={words(language, 'Mobile navigation', 'เมนูมือถือ', 'Navegación móvil')}>{items.map((id) => <button key={id} aria-current={screen === id ? 'page' : undefined} className={screen === id ? 'selected' : ''} onClick={() => onNavigate(id)}><Icon name={screenIcons[id]} size={22} /><span>{short[id as keyof typeof short]}</span>{screen === id && <i />}</button>)}</nav>;
}
