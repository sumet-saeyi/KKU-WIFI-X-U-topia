'use client';

import { AgentSourceNote } from '@/components/product/AgentSourceNote';

import { Tabs } from '@/components/ui/Tabs';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { makeTrace, signatureRequest } from '@/lib/presetData';
import { words } from '@/lib/i18n';
import { ModuleHeader, SectionHeading } from './ModuleParts';
import type { AgentResult, BaseModuleProps } from './moduleTypes';

interface ProfessionProps extends BaseModuleProps { activeRules: string[]; onToggleRule: (id: string) => void; }

export function ProfessionAgentPayModule({ language, stageSafeMode, onSignature, onTrace, runAgent, notify, activeRules, onToggleRule }: ProfessionProps) {
  const [tab, setTab] = useState('pay');
  const [busy, setBusy] = useState('');
  const [vision, setVision] = useState<(AgentResult & { language: string }) | null>(null);
  const [merchant, setMerchant] = useState('Sawasdee Corner Cafe');
  const [qrUrl, setQrUrl] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const scenarios = [
    { id: 'bill', icon: '▤', label: w('Bangkok bill', 'บิลกรุงเทพฯ', 'Factura de Bangkok'), value: '450 THB', detail: w('Read the sample receipt. Review one simple payment.', 'อ่านใบเสร็จตัวอย่าง แล้วตรวจสอบการจ่าย', 'Lee el recibo de ejemplo y revisa un pago sencillo.') },
    { id: 'fridge', icon: '▦', label: w('Smart fridge', 'ตู้เย็นอัจฉริยะ', 'Refrigerador inteligente'), value: '1,250 THB', detail: w('Spot missing basics. Review a fresh grocery cart.', 'ดูว่าของอะไรขาด แล้วตรวจตะกร้าของสด', 'Detecta lo que falta y revisa una cesta de alimentos.') },
  ];
  const rules = [
    { id: 'flight', icon: '↗', label: w('Watch Bangkok → Brisbane flights under $420', 'ติดตามเที่ยวบินกรุงเทพฯ → บริสเบน ต่ำกว่า $420', 'Vigilar vuelos Bangkok → Brisbane por menos de $420') },
    { id: 'gold', icon: '◉', label: w('Save $25 in my gold goal every Friday', 'ออม $25 ในเป้าหมายทองทุกวันศุกร์', 'Ahorrar $25 en mi meta de oro cada viernes') },
  ];
  const prepareScenario = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const start = performance.now();
      if (id === 'fridge') {
        const result = await runAgent('vision', 'Describe the groceries in the fridge preset: milk, eggs, spinach, bananas and rice. Example cart 1250 THB. This is a prepared demo scenario, not an uploaded photo. Explain that approval is needed.');
        setVision({ ...result, language });
      }
      const request = signatureRequest(id === 'fridge' ? 'ORDER_FRIDGE_GROCERIES' : 'PAY_THB_BILL', 25, language);
      const trace = makeTrace('profession', id === 'fridge' ? 'prepareGroceryCheckout' : 'readSampleReceipt', { totalThb: id === 'fridge' ? 1250 : 450, mode: stageSafeMode ? 'offline' : 'live' }, 'Prepared the selected example for wallet approval.', 'PASSED_NON_CUSTODIAL_CAP');
      trace.latencyMs = Math.round(performance.now() - start); onSignature(request, trace);
    } catch (error) { notify((error as Error).message); } finally { setBusy(''); }
  };
  const runRule = (id: string) => {
    if (id === 'flight') {
      notify(w('Example fare: $438. Watching for a price below $420; no booking yet.', 'ราคาตัวอย่าง $438 กำลังรอราคาต่ำกว่า $420 ยังไม่จอง', 'Tarifa de ejemplo: $438. Esperando un precio menor a $420; aún no hay reserva.'));
      onTrace(makeTrace('profession', 'evaluateFlightRule', { fare: 438, threshold: 420 }, 'Trigger not met. No booking or payment prepared.'));
    } else { const request = signatureRequest('FUND_GOLD_GOAL', 25, language); request.isAutomated = true; onSignature(request, makeTrace('passion', 'evaluateFridaySavingRule', { amountUsd: 25, trigger: 'Friday example' }, 'Prepared the Friday savings example for user approval.')); }
  };
  const makeQr = () => {
    if (typeof window === 'undefined' || !merchant.trim()) return;
    const url = new URL(window.location.origin); url.searchParams.set('merchant', merchant.trim());
    setQrUrl(url.toString());
    onTrace(makeTrace('profession', 'createMerchantCard', { merchant: merchant.trim() }, 'Generated a QR that opens the local merchant payment demo.'));
  };
  const analyzePhoto = async () => {
    if (!photo || stageSafeMode) return;
    setBusy('photo');
    try { setVision({ ...await runAgent('vision-photo', 'Describe the visible bill or fridge contents in the selected language. Extract visible amounts if present. Do not invent totals, missing items, purchases, or payment instructions.', photo), language }); }
    catch (error) { notify((error as Error).message); } finally { setBusy(''); }
  };
  return <div className="module profession-module">
    <ModuleHeader pillar="profession" language={language} title={w('Everyday money, a little easier', 'เรื่องเงินทุกวัน ง่ายขึ้นอีกนิด', 'El dinero cotidiano, más sencillo')} description={w('Pay a bill. Fill the fridge. Give every new payment a purpose.', 'จ่ายบิล เติมของเข้าตู้เย็น ให้รายรับใหม่มีเป้าหมาย', 'Paga una factura. Llena el refrigerador. Dale un propósito a cada ingreso.')} />
    <Tabs id="payment" label={w('Payment tasks', 'งานชำระเงิน', 'Tareas de pago')} value={tab} onChange={setTab} items={[{ id: 'pay', label: w('Pay a bill', 'จ่ายบิล', 'Pagar una factura') }, { id: 'receive', label: w('Receive money', 'รับเงิน', 'Recibir dinero') }, { id: 'merchant', label: w('Accept payments', 'รับชำระเงิน', 'Aceptar pagos') }]} />
    <section role="tabpanel" id="payment-panel-pay" aria-labelledby="payment-tab-pay" hidden={tab !== 'pay'} className="module-section"><SectionHeading step="1" title={w('What can I help with?', 'อยากให้ช่วยเรื่องไหน', '¿En qué puedo ayudarte?')} description={w('Try a prepared example. Review it before anything moves.', 'ลองตัวอย่างที่เตรียมไว้ ตรวจสอบก่อนเงินเคลื่อนไหว', 'Prueba un ejemplo preparado. Revísalo antes de mover dinero.')} />
      <div className="scenario-grid">{scenarios.map((scenario) => <button key={scenario.id} className="scenario-card" onClick={() => prepareScenario(scenario.id)} disabled={Boolean(busy)}><span className="scan-icon">{scenario.icon}</span><span><small>{w('TRY AN EXAMPLE', 'ลองตัวอย่าง', 'PRUEBA UN EJEMPLO')}</small><strong>{scenario.label}<em>{scenario.value}</em></strong><p>{scenario.detail}</p></span><b>{busy === scenario.id ? '…' : '→'}</b></button>)}</div>
      <details className="sample-receipt"><summary>{w('See the sample bill', 'ดูบิลตัวอย่าง', 'Ver la factura de ejemplo')}</summary><div><span>BANGKOK ELECTRIC</span><p>{w('Monthly electricity', 'ค่าไฟฟ้ารายเดือน', 'Electricidad mensual')}</p><strong>450.00 THB</strong><small>{w('Prepared demo receipt · ≈ $13.50', 'ใบเสร็จเดโม · ประมาณ $13.50', 'Recibo de demostración · ≈ $13.50')}</small></div></details>
      {vision?.language === language && <div className="vision-result" aria-live="polite"><span>✓</span><p><AgentSourceNote source={vision.source} language={language} />{vision.text}</p></div>}
      {!stageSafeMode && <div className="photo-analysis"><label htmlFor="vision-photo">{w('Or ask about your own photo', 'หรือถามเกี่ยวกับรูปของคุณ', 'O pregunta sobre tu propia foto')}</label><input id="vision-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const file = event.target.files?.[0]; if (!file) return;
        if (file.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { notify(w('Choose a JPG, PNG, or WebP under 4 MB.', 'เลือกรูป JPG, PNG หรือ WebP ไม่เกิน 4 MB', 'Elige un JPG, PNG o WebP de menos de 4 MB.')); return; }
        const reader = new FileReader(); reader.onload = () => { setPhoto(String(reader.result)); setPhotoName(file.name); }; reader.readAsDataURL(file);
      }} />{photo && <><p>{photoName}</p><button className="secondary-action" onClick={analyzePhoto} disabled={Boolean(busy)}>{w('Describe photo', 'อธิบายรูป', 'Describir foto')}</button></>}</div>}
      <details className="routine-details"><summary>{w('Make it a routine', 'เปลี่ยนเป็นกิจวัตร', 'Crear una rutina')}</summary><div className="rules-box"><div><strong>{w('Make it a gentle routine', 'เปลี่ยนเป็นกิจวัตรเล็ก ๆ', 'Conviértelo en una rutina')}</strong><small>{w('Save a rule, then test its example trigger.', 'บันทึกกฎ แล้วลองเหตุการณ์ตัวอย่าง', 'Guarda una regla y prueba su activación de ejemplo.')}</small></div>{rules.map((rule) => <div className="automation-rule" key={rule.id}><button role="switch" aria-checked={activeRules.includes(rule.id)} className={activeRules.includes(rule.id) ? 'active' : ''} onClick={() => onToggleRule(rule.id)}><span>{rule.icon}</span>{rule.label}<i>{activeRules.includes(rule.id) ? w('ON', 'เปิด', 'SÍ') : w('OFF', 'ปิด', 'NO')}</i></button>{activeRules.includes(rule.id) && <button className="rule-run" onClick={() => runRule(rule.id)}>{w('Run example', 'ลองตัวอย่าง', 'Probar ejemplo')} →</button>}</div>)}</div></details>
    </section>
    <section role="tabpanel" id="payment-panel-receive" aria-labelledby="payment-tab-receive" hidden={tab !== 'receive'} className="module-section split-section"><SectionHeading step="2" title={w('Give your income a direction', 'กำหนดทิศทางให้รายรับ', 'Dale un rumbo a tus ingresos')} description={w('One client payment. Four parts of a fuller life.', 'หนึ่งรายรับจากลูกค้า สี่ด้านของชีวิตที่สมบูรณ์', 'Un pago de cliente. Cuatro partes de una vida más plena.')} /><div className="split-visual"><div className="split-total"><small>{w('CLIENT PAYMENT', 'รายรับจากลูกค้า', 'PAGO DE CLIENTE')}</small><strong>3,500 THB</strong><span>≈ $105 USD</span></div><div className="split-lines">{[
      { pillar: 'profession', pct: 50, amount: '52.50', label: w('Daily life', 'ชีวิตประจำวัน', 'Vida diaria') },
      { pillar: 'passion', pct: 20, amount: '21.00', label: w('Dreams', 'ความฝัน', 'Sueños') },
      { pillar: 'vocation', pct: 15, amount: '15.75', label: w('Skills', 'ทักษะ', 'Habilidades') },
      { pillar: 'mission', pct: 15, amount: '15.75', label: w('Community', 'ชุมชน', 'Comunidad') },
    ].map((part) => <div className={part.pillar} key={part.pillar}><span>{part.pct}%</span><p>{part.label}<strong>${part.amount}</strong></p></div>)}</div></div><button className="primary-action profession-action" onClick={() => onSignature(signatureRequest('SPLIT_INCOME', 25, language), makeTrace('profession', 'prepareIncomeSplit', { incomingThb: 3500, split: [50, 20, 15, 15] }, 'Prepared all four demo vault allocations.'))}><span>↗</span><span><strong>{w('Simulate incoming 3,500 THB payment', 'จำลองรับเงิน 3,500 บาท', 'Simular un pago de 3,500 THB')}</strong><small>{w('Review your 50 / 20 / 15 / 15 plan', 'ตรวจสอบแผน 50 / 20 / 15 / 15', 'Revisa tu plan 50 / 20 / 15 / 15')}</small></span><b>→</b></button></section>
    <section role="tabpanel" id="payment-panel-merchant" aria-labelledby="payment-tab-merchant" hidden={tab !== 'merchant'} className="module-section merchant-section"><SectionHeading step="3" title={w('Welcome your next customer', 'ต้อนรับลูกค้าคนถัดไป', 'Recibe a tu próximo cliente')} description={w('Create a multilingual payment card for your counter.', 'สร้างการ์ดรับชำระหลายภาษาสำหรับหน้าร้าน', 'Crea una tarjeta de pago multilingüe para tu negocio.')} /><div className="merchant-maker"><div><label htmlFor="merchant">{w('Business or creator name', 'ชื่อร้านหรือครีเอเตอร์', 'Nombre del negocio o creador')}</label><input id="merchant" value={merchant} maxLength={80} onChange={(event) => { setMerchant(event.target.value); setQrUrl(''); }} /><button className="primary-small" disabled={!merchant.trim()} onClick={makeQr}>{w('Generate payment card', 'สร้างการ์ดรับชำระ', 'Generar tarjeta de pago')}</button></div>{qrUrl && <div className="merchant-standee"><span>U-PAY · DEMO</span><h3>{merchant}</h3><p>Pay here · ชำระเงิน · Paga aquí</p><QRCodeSVG value={qrUrl} size={150} marginSize={4} bgColor="#ffffff" fgColor="#0a1b19" level="M" /><strong>{w('Scan to try a payment', 'สแกนเพื่อลองชำระ', 'Escanea para probar un pago')}</strong><small>{w('Sample money · 0% demo transfer fee', 'เงินตัวอย่าง · ค่าโอนเดโม 0%', 'Dinero de ejemplo · 0% de comisión demo')}</small><button onClick={() => { if (typeof window !== 'undefined') window.print(); }}>{w('Print card', 'พิมพ์การ์ด', 'Imprimir tarjeta')}</button><a href={qrUrl}>{w('Try link', 'ลองลิงก์', 'Probar enlace')}</a></div>}</div></section>
  </div>;
}
