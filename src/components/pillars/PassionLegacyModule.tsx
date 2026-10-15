'use client';

import { FlowSteps } from '@/components/product/FlowSteps';
import { useState } from 'react';
import { meaningNotes, makeTrace, signatureRequest } from '@/lib/presetData';
import { words } from '@/lib/i18n';
import { ModuleHeader, SectionHeading } from './ModuleParts';
import type { BaseModuleProps } from './moduleTypes';

export function PassionLegacyModule({ language, onSpeak, onSignature }: BaseModuleProps) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('dream');
  const [asset, setAsset] = useState<'gold' | 'silver' | 'stock'>('gold');
  const [stock, setStock] = useState<'AMZN' | 'TSLA'>('AMZN');
  const [amount, setAmount] = useState(25);
  const [customNote, setCustomNote] = useState<Partial<Record<typeof language, string>>>({});
  const [recipient, setRecipient] = useState('');
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const note = customNote[language] ?? meaningNotes[language];
  const goals = [
    { id: 'dream', icon: '✦', title: w('My dream', 'ความฝันของฉัน', 'Mi sueño'), detail: w('A creative studio, a trip, a fresh start.', 'สตูดิโอสร้างสรรค์ ทริปในฝัน การเริ่มใหม่', 'Un estudio creativo, un viaje, un nuevo comienzo.') },
    { id: 'gift', icon: '♡', title: w('Someone I love', 'คนที่ฉันรัก', 'Alguien que amo'), detail: w('A small gift with a lasting meaning.', 'ของขวัญเล็ก ๆ ที่มีความหมายยาวนาน', 'Un pequeño regalo con significado duradero.') },
    { id: 'family', icon: '⌂', title: w('My family’s future', 'อนาคตของครอบครัว', 'El futuro de mi familia'), detail: w('A cushion for the people who matter.', 'เงินสำรองเพื่อคนที่สำคัญ', 'Un colchón para las personas que importan.') },
  ];
  const assets = [
    { id: 'gold' as const, icon: '◉', name: w('Digital Gold', 'ทองดิจิทัล', 'Oro digital'), symbol: 'U-GOLD', detail: w('Value linked to physical gold. Start with a small amount.', 'มูลค่าผูกกับทองคำจริง เริ่มด้วยจำนวนเล็กน้อย', 'Valor vinculado al oro físico. Empieza poco a poco.') },
    { id: 'silver' as const, icon: '◌', name: w('Accessible Silver', 'กองทุนโลหะเงิน', 'Plata accesible'), symbol: 'BLK-SLV', detail: w('A small share of a silver fund, from $10.', 'ส่วนเล็ก ๆ ของกองทุนโลหะเงิน เริ่ม $10', 'Una pequeña parte de un fondo de plata, desde $10.') },
    { id: 'stock' as const, icon: '↗', name: w('Global Tech Companies', 'บริษัทเทคโนโลยีระดับโลก', 'Empresas tecnológicas'), symbol: stock, detail: w('A piece of Amazon or Tesla. You choose the company.', 'ส่วนหนึ่งของ Amazon หรือ Tesla คุณเลือกบริษัทได้', 'Una parte de Amazon o Tesla. Tú eliges la empresa.') },
  ];
  const fund = () => {
    const action = asset === 'gold' ? 'FUND_GOLD_GOAL' : asset === 'silver' ? 'FUND_SILVER_GOAL' : 'FUND_STOCK_GOAL';
    const request = signatureRequest(action, amount, language);
    request.assetSymbol = asset === 'gold' ? 'UGOLD' : asset === 'silver' ? 'BLKSLV' : stock;
    request.goal = goal;
    request.meaningNote = note;
    request.recipient = goal === 'gift' ? recipient.trim() : undefined;
    if (goal === 'gift') { request.title = w(`A gift for ${recipient.trim()}`, `ของขวัญให้ ${recipient.trim()}`, `Un regalo para ${recipient.trim()}`); request.subtitle = `${assets.find((item) => item.id === asset)!.name} · ${request.amountText}`; }
    if (goal === 'family') request.subtitle = w('For your family’s peace of mind', 'เพื่อความอุ่นใจของครอบครัว', 'Para la tranquilidad de tu familia');
    if (asset === 'stock') request.routeDescription += ` · ${stock}`;
    onSignature(request, makeTrace('passion', 'prepareMeaningfulGift', { goal, symbol: request.assetSymbol, amount, recipient: request.recipient, meaningNote: note }, 'Prepared a meaningful asset allocation for explicit demo approval.'));
  };

  return <div className="module passion-module">
    <ModuleHeader pillar="passion" language={language} title={w('Make room for what you love', 'เติมพื้นที่ให้สิ่งที่คุณรัก', 'Haz espacio para lo que amas')} description={w('A dream, a gift, a little peace of mind. Begin with an amount that feels right.', 'ความฝัน ของขวัญ หรือความอุ่นใจ เริ่มด้วยจำนวนที่คุณสบายใจ', 'Un sueño, un regalo, un poco de tranquilidad. Empieza con una cantidad cómoda.')} />
    <FlowSteps label={w('Saving progress', 'ความคืบหน้าการออม', 'Progreso de ahorro')} steps={[w('Your purpose', 'เป้าหมาย', 'Tu propósito'), w('Your amount', 'จำนวนเงิน', 'Tu cantidad'), w('Your meaning', 'ความหมาย', 'Tu significado')]} current={step} onSelect={setStep} />
    <section hidden={step !== 0} className="module-section"><SectionHeading step="1" title={w('What are you growing?', 'คุณอยากสร้างสิ่งใด', '¿Qué quieres construir?')} />
      <div className="choice-grid goal-grid">{goals.map((item) => <button key={item.id} aria-pressed={goal === item.id} className={`choice-card ${goal === item.id ? 'active' : ''}`} onClick={() => setGoal(item.id)}><span className="choice-icon">{item.icon}</span><strong>{item.title}</strong><small>{item.detail}</small><i>{goal === item.id ? '✓' : ''}</i></button>)}</div>
      {goal === 'gift' && <div className="gift-recipient"><label htmlFor="gift-recipient">{w('Recipient’s name or phone', 'ชื่อหรือเบอร์โทรผู้รับ', 'Nombre o teléfono del destinatario')}</label><input id="gift-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} autoComplete="off" maxLength={80} /><small>{w('Used for this demo gift. No message is sent.', 'ใช้กับของขวัญตัวอย่างนี้ ไม่มีการส่งข้อความ', 'Se usa para este regalo de ejemplo. No se envía un mensaje.')}</small></div>}
    </section>
    <section hidden={step !== 1} className="module-section"><SectionHeading step="2" title={w('Choose what to hold', 'เลือกสิ่งที่อยากเก็บ', 'Elige qué conservar')} description={w('Each option has a simple explanation.', 'ทุกตัวเลือกมีคำอธิบายง่าย ๆ', 'Cada opción tiene una explicación sencilla.')} />
      <div className="asset-list">{assets.map((item) => <button key={item.id} aria-pressed={asset === item.id} className={`asset-card ${asset === item.id ? 'active' : ''}`} onClick={() => setAsset(item.id)}><span className="asset-icon">{item.icon}</span><span><strong>{item.name}<em>{item.symbol}</em></strong><small>{item.detail}</small></span><i>{asset === item.id ? '✓' : ''}</i></button>)}</div>
      {asset === 'stock' && <div className="amount-picker"><span>{w('Choose a company', 'เลือกบริษัท', 'Elige una empresa')}</span><div>{(['AMZN', 'TSLA'] as const).map((symbol) => <button key={symbol} aria-pressed={stock === symbol} className={stock === symbol ? 'active' : ''} onClick={() => setStock(symbol)}>{symbol === 'AMZN' ? 'Amazon' : 'Tesla'}</button>)}</div></div>}
      <div className="amount-picker"><span>{w('A comfortable amount', 'จำนวนที่สบายใจ', 'Una cantidad cómoda')}</span><div>{[10, 25, 50].map((value) => <button key={value} aria-pressed={amount === value} className={amount === value ? 'active' : ''} onClick={() => setAmount(value)}>${value}</button>)}</div></div>
    </section>
    <section hidden={step !== 2} className="module-section note-section"><SectionHeading step="3" title={w('Give it a meaning', 'เติมความหมายให้เป้าหมาย', 'Dale un significado')} /><label className="sr-only" htmlFor="meaning-note">{w('Meaning note', 'บันทึกความหมาย', 'Nota con significado')}</label><textarea id="meaning-note" value={note} onChange={(event) => setCustomNote({ ...customNote, [language]: event.target.value })} maxLength={600} /><button className="secondary-action" onClick={() => onSpeak(note)} disabled={!note.trim()}>◉ {w('Hear my note', 'ฟังบันทึกของฉัน', 'Escuchar mi nota')}</button></section>
    <div className="flow-actions">{step > 0 && <button className="text-button" onClick={() => setStep(step - 1)}>← {w('Back', 'ย้อนกลับ', 'Atrás')}</button>}{step < 2 && <button className="button button-primary" onClick={() => setStep(step + 1)} disabled={step === 0 && goal === 'gift' && !recipient.trim()}>{w('Continue', 'ต่อไป', 'Continuar')} →</button>}</div>
    <button hidden={step !== 2} className="primary-action passion-action" onClick={fund} disabled={goal === 'gift' && !recipient.trim()}><span>♡</span><span><strong>{w('Review my saving plan', 'ตรวจสอบแผนออมของฉัน', 'Revisar mi plan de ahorro')} · ${amount}</strong><small>{goal === 'gift' && !recipient.trim() ? w('Add a recipient to continue', 'เพิ่มผู้รับเพื่อดำเนินการต่อ', 'Añade un destinatario para continuar') : w('Review the details before approving', 'ตรวจสอบรายละเอียดก่อนยืนยัน', 'Revisa los detalles antes de aprobar')}</small></span><b>→</b></button>
  </div>;
}
