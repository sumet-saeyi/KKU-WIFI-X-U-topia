'use client';

import { Icon } from '@/components/ui/Icon';
import { money, words } from '@/lib/i18n';
import { refreshSpendingDay } from '@/lib/wallet';
import type { LanguageCode, WalletState, WalletTransaction } from '@/lib/types';

export function UtopiaCardVisual({ language, frozen = false, compact = false }: { language: LanguageCode; frozen?: boolean; compact?: boolean }) {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  return <div className={`utopia-card${frozen ? ' is-frozen' : ''}${compact ? ' is-compact' : ''}`} role="img" aria-label={w(`U-topia demo card · ${frozen ? 'frozen' : 'ready for practice'} · not an issued payment card`, `บัตร U-topia ตัวอย่าง · ${frozen ? 'ระงับอยู่' : 'พร้อมทดลอง'} · ไม่ใช่บัตรชำระเงินจริง`, `Tarjeta U-topia de ejemplo · ${frozen ? 'congelada' : 'lista para practicar'} · no es una tarjeta emitida`)}>
    <svg className="utopia-card-contours" viewBox="0 0 440 280" fill="none" aria-hidden="true"><circle cx="312" cy="106" r="119" stroke="#e8cf9e" /><circle cx="369" cy="153" r="119" stroke="#e9a9c5" /><circle cx="256" cy="153" r="119" stroke="#9acbdf" /><circle cx="312" cy="201" r="119" stroke="#b6ddc5" /></svg>
    <div className="utopia-card-top"><img src="/brands/u-topia.svg" width="116" height="29" alt="" /><span>{w('DEMO', 'ตัวอย่าง', 'DEMO')}</span></div>
    <div className="utopia-card-middle"><span className="utopia-card-chip" aria-hidden="true"><i /></span><span className="utopia-card-motto">{w('For the life\nyou want to live.', 'เพื่อชีวิต\nที่คุณอยากใช้', 'Para la vida\nque quieres vivir.')}</span></div>
    <div className="utopia-card-bottom"><span>U-CARD<small>{w('WITH MEANING', 'อย่างมีความหมาย', 'CON PROPÓSITO')}</small></span><span className="utopia-card-status"><Icon name={frozen ? 'freeze' : 'leaf'} size={14} />{frozen ? w('Frozen', 'ระงับอยู่', 'Congelada') : w('Sample only', 'ใช้ทดลองเท่านั้น', 'Solo de ejemplo')}</span></div>
  </div>;
}

export function UtopiaCardShortcut({ wallet, language, onOpen, compact = false }: { wallet: WalletState; language: LanguageCode; onOpen: () => void; compact?: boolean }) {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  return <button className={`utopia-card-shortcut${compact ? ' compact-shortcut' : ''}`} onClick={onOpen} aria-label={w('Open U-topia card', 'เปิดบัตร U-topia', 'Abrir tarjeta U-topia')}>
    {compact ? <span className="card-shortcut-icon"><Icon name="pay" size={23} /></span> : <UtopiaCardVisual language={language} frozen={wallet.cardFrozen} compact />}
    <span className="card-shortcut-copy"><span><strong>{w('Your U-topia card', 'บัตร U-topia ของคุณ', 'Tu tarjeta U-topia')}</strong><small>{wallet.cardFrozen ? w('Frozen · demo controls', 'ระงับอยู่ · ควบคุมบัตรตัวอย่าง', 'Congelada · controles de demo') : w('Demo card. Everyday possibilities.', 'บัตรตัวอย่าง เพื่อทุกวันของคุณ', 'Tarjeta demo. Posibilidades cotidianas.')}</small></span><Icon name="arrow" size={18} /></span>
  </button>;
}

interface CardPanelProps {
  wallet: WalletState;
  language: LanguageCode;
  onToggleFrozen: () => void;
  onCheckout: () => void;
  onReceipt: (receipt: WalletTransaction) => void;
}

export function UtopiaCardPanel({ wallet, language, onToggleFrozen, onCheckout, onReceipt }: CardPanelProps) {
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const current = refreshSpendingDay(wallet);
  const remaining = Math.max(0, Math.round((current.dailyAiCapUsd - current.spentTodayUsd) * 100) / 100);
  const latest = wallet.transactions.find((transaction) => transaction.paymentMethod === 'utopia-card');
  const blocked = wallet.cardFrozen ? w('Unfreeze your demo card to try a checkout.', 'ยกเลิกการระงับบัตรตัวอย่างก่อนลองชำระ', 'Descongela tu tarjeta de ejemplo para probar un pago.')
    : remaining < 37.5 ? w('This cart is above today’s remaining shared limit.', 'ตะกร้านี้เกินวงเงินร่วมที่เหลือวันนี้', 'Esta cesta supera el límite compartido disponible hoy.')
    : wallet.balances.THB < 1250 ? w('There is not enough sample baht for this cart.', 'เงินบาทตัวอย่างไม่เพียงพอสำหรับตะกร้านี้', 'No hay suficiente baht de ejemplo para esta cesta.') : '';
  return <section className="utopia-card-panel" aria-label={w('U-topia card controls', 'ควบคุมบัตร U-topia', 'Controles de tarjeta U-topia')}>
    <div className="utopia-card-heading"><div><span className="eyebrow">{w('EVERYDAY, WITH MEANING', 'ทุกวัน มีความหมาย', 'CADA DÍA, CON PROPÓSITO')}</span><h2>{w('Your U-topia card.', 'บัตร U-topia ของคุณ', 'Tu tarjeta U-topia.')}</h2></div><span className="card-demo-label">{w('Demo · not issued', 'บัตรตัวอย่าง · ยังไม่ออกบัตรจริง', 'Demo · no emitida')}</span></div>
    <div className="utopia-card-layout"><div className="utopia-card-display"><UtopiaCardVisual language={language} frozen={wallet.cardFrozen} /><p className="card-honest-note"><Icon name="shield" size={15} />{w('A card experience to explore. No card number, real charges or issued card.', 'ลองใช้ประสบการณ์บัตร ไม่มีเลขบัตร ไม่ตัดเงินจริง และยังไม่ออกบัตรจริง', 'Una experiencia para explorar. Sin número de tarjeta, cargos reales ni tarjeta emitida.')}</p></div>
      <div className="utopia-card-controls"><div className="card-freeze-row"><span className={`card-state${wallet.cardFrozen ? ' frozen' : ''}`} role="status"><i />{wallet.cardFrozen ? w('Frozen for now', 'ระงับชั่วคราว', 'Congelada por ahora') : w('Ready for practice', 'พร้อมทดลอง', 'Lista para practicar')}</span><button className="card-freeze-button" onClick={onToggleFrozen} aria-pressed={Boolean(wallet.cardFrozen)}><Icon name={wallet.cardFrozen ? 'leaf' : 'freeze'} size={17} />{wallet.cardFrozen ? w('Unfreeze card', 'ยกเลิกการระงับ', 'Descongelar tarjeta') : w('Freeze card', 'ระงับบัตร', 'Congelar tarjeta')}</button></div>
        <div className="card-budget"><div><span>{w('Shared daily safety limit', 'วงเงินความปลอดภัยร่วมต่อวัน', 'Límite diario de seguridad compartido')}</span><strong>{money(current.spentTodayUsd, language)} <small>/ {money(current.dailyAiCapUsd, language)}</small></strong></div><progress value={Math.min(current.spentTodayUsd, current.dailyAiCapUsd)} max={current.dailyAiCapUsd || 1} aria-label={w('Daily safety limit used', 'วงเงินความปลอดภัยที่ใช้วันนี้', 'Límite diario de seguridad usado')} /><p>{money(remaining, language)} {w('left today · shared with bills and AI-assisted actions', 'ใช้ได้อีกวันนี้ · ใช้ร่วมกับบิลและรายการที่ AI ช่วย', 'disponibles hoy · compartidos con facturas y acciones asistidas por IA')}</p></div>
        <div className="card-funding"><span>{w('Pays from sample Thai baht', 'จ่ายจากเงินบาทตัวอย่าง', 'Paga desde tu baht de ejemplo')}</span><strong>{money(wallet.balances.THB, language, 'THB')}</strong></div>
        <button className="button button-primary card-checkout" onClick={onCheckout} disabled={Boolean(blocked) || Boolean(wallet.pendingSignature)}><Icon name="pay" size={18} />{w('Try a grocery checkout', 'ลองชำระค่าของสด', 'Probar un pago de alimentos')}<Icon name="arrow" size={17} /></button>
        <p className="card-checkout-note">{blocked || w('1,250 THB sample cart · review first, confirm only if you want to.', 'ตะกร้าตัวอย่าง 1,250 บาท · ตรวจสอบก่อน ยืนยันเมื่อคุณต้องการเท่านั้น', 'Cesta de ejemplo de 1,250 THB · revisa primero y confirma solo si quieres.')}</p>
      </div></div>
    {latest && <button className="card-last-payment" onClick={() => onReceipt(latest)}><Icon name="receipt" size={19} /><span><small>{w('LATEST CARD PRACTICE', 'รายการบัตรตัวอย่างล่าสุด', 'ÚLTIMA PRÁCTICA CON TARJETA')}</small><strong>{latest.title}</strong></span><b>{latest.amountText}</b><Icon name="chevron" size={17} /></button>}
  </section>;
}
