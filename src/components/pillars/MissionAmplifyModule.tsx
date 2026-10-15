'use client';

import { Tabs } from '@/components/ui/Tabs';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { compliantCopy, makeTrace, viralScripts } from '@/lib/presetData';
import { detectedRisks, riskySegments } from '@/lib/community';
import { copyToClipboard } from '@/lib/clipboard';
import { words } from '@/lib/i18n';
import { ModuleHeader, SectionHeading } from './ModuleParts';
import type { BaseModuleProps } from './moduleTypes';

export function MissionAmplifyModule({ language, stageSafeMode, onSpeak, onTrace, runAgent, notify }: BaseModuleProps) {
  const [tab, setTab] = useState('post');
  const [drafts, setDrafts] = useState<Partial<Record<typeof language, string>>>({});
  const [scan, setScan] = useState<{ draft: string; language: string; text: string } | null>(null);
  const [topic, setTopic] = useState('humans');
  const [generated, setGenerated] = useState<{ text: string; language: string; topic: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [ambassador, setAmbassador] = useState('ikigai-flow');
  const qrRef = useRef<HTMLDivElement>(null);
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const defaultDraft = w('Buy a $2,500 U.Center Diamond package for guaranteed 15% monthly passive dividends and guaranteed crypto profits!', 'ซื้อแพ็กเกจ U.Center Diamond $2,500 รับประกันปันผลทุกเดือน 15% และกำไรแน่นอน!', '¡Compra un paquete U.Center Diamond de $2,500 con 15% mensual garantizado, dividendos pasivos y ganancias seguras!');
  const draft = drafts[language] ?? defaultDraft;
  const detected = detectedRisks(draft);
  const safeText = scan?.language === language && scan.draft === draft ? scan.text : '';
  const script = generated ? stageSafeMode ? viralScripts[language][topic] : generated.language === language && generated.topic === topic ? generated.text : '' : '';
  const topics = [
    { id: 'humans', title: w('Finance that feels human', 'การเงินที่เข้าใจคน', 'Finanzas que se sienten humanas') },
    { id: 'fees', title: w('Keep more of every payment', 'เก็บเงินจากทุกการจ่ายได้มากขึ้น', 'Conserva más de cada pago') },
    { id: 'ikigai', title: w('Find your Ikigai in Bangkok', 'ค้นหาอิคิไกในกรุงเทพฯ', 'Encuentra tu Ikigai en Bangkok') },
  ];
  const harmonize = async () => {
    setBusy('scan');
    try {
      const started = performance.now();
      const text = stageSafeMode ? (detected.length ? compliantCopy[language] : draft) : await runAgent('mission-scan', `Rewrite this community caption in the selected language without financial-return promises. Preserve its useful meaning: ${draft}`);
      setScan({ draft, language, text });
      const trace = makeTrace('mission', 'reviewCommunityCopy', { detectedTerms: detected, language, mode: stageSafeMode ? 'deterministic' : 'live' }, 'Reviewed promotional phrases and produced copy for human review.', 'REWRITTEN_COMPLIANT_DAO_TERMS');
      trace.latencyMs = Math.round(performance.now() - started); onTrace(trace);
    } catch (error) { notify((error as Error).message); } finally { setBusy(''); }
  };
  const generate = async () => {
    setBusy('script');
    try {
      const text = stageSafeMode ? viralScripts[language][topic] : await runAgent(`script-${topic}`, `Write a 45-second FLOW Summit Bangkok video script about ${topics.find((item) => item.id === topic)?.title}. Include timestamps from 0:00 to 0:45. Focus on learning and keeping control of money. Avoid guaranteed returns.`);
      setGenerated({ text, language, topic });
      onTrace(makeTrace('mission', 'createCommunityStory', { topic, language }, 'Created a localized video script and referral QR card.'));
    } catch (error) { notify((error as Error).message); } finally { setBusy(''); }
  };
  const copy = async (text: string) => notify(await copyToClipboard(text) ? w('Copied to clipboard.', 'คัดลอกแล้ว', 'Copiado al portapapeles.') : w('Copy is unavailable. Select the text to copy it.', 'คัดลอกไม่ได้ กรุณาเลือกข้อความเพื่อคัดลอก', 'No se pudo copiar. Selecciona el texto para copiarlo.'));
  const saveCard = () => {
    if (typeof window === 'undefined') return;
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'u-ikigai-referral-qr.svg'; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="module mission-module">
    <ModuleHeader pillar="mission" language={language} title={w('Share something that matters', 'แบ่งปันสิ่งที่มีความหมาย', 'Comparte algo que importa')} description={w('A useful story can open a door for someone else. Let’s make yours clear and honest.', 'เรื่องราวดี ๆ อาจเปิดโอกาสให้ใครบางคน มาทำให้เรื่องของคุณชัดเจนและจริงใจ', 'Una historia útil puede abrir una puerta a otra persona. Hagamos la tuya clara y honesta.')} />
    <Tabs id="sharing" label={w('Sharing tasks', 'งานแบ่งปัน', 'Tareas para compartir')} value={tab} onChange={setTab} items={[{ id: 'post', label: w('Write a post', 'เขียนโพสต์', 'Escribir una publicación') }, { id: 'video', label: w('Make a video', 'สร้างวิดีโอ', 'Crear un video') }]} />
    <section role="tabpanel" id="sharing-panel-post" aria-labelledby="sharing-tab-post" hidden={tab !== 'post'} className="module-section"><SectionHeading step="1" title={w('Give your message a thoughtful check', 'ตรวจข้อความอย่างใส่ใจ', 'Revisa tu mensaje con cuidado')} description={w('Spot risky promises and put the focus back on people.', 'ค้นหาคำสัญญาที่เสี่ยง แล้วกลับมาให้ความสำคัญกับคน', 'Detecta promesas riesgosas y vuelve a centrarte en las personas.')} /><label className="field-label" htmlFor="mission-draft">{w('Your draft', 'ร่างข้อความของคุณ', 'Tu borrador')}</label><textarea id="mission-draft" className="mission-textarea" value={draft} maxLength={3000} onChange={(event) => setDrafts({ ...drafts, [language]: event.target.value })} />
      {detected.length > 0 && <div className="risk-preview"><small>{w('PHRASES TO RECONSIDER', 'ถ้อยคำที่ควรทบทวน', 'FRASES A RECONSIDERAR')}</small><p>{riskySegments(draft).map((segment, index) => segment.risky ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>)}</p></div>}
      <button className="primary-small mission-scan" disabled={Boolean(busy) || !draft.trim()} onClick={harmonize}>{busy === 'scan' ? '…' : '✓'} {w('Scan & harmonize my caption', 'ตรวจและปรับข้อความของฉัน', 'Revisar y mejorar mi texto')}</button>
      {safeText && <div className="safe-copy" aria-live="polite"><div><span>✓</span><strong>{w('Your human-first rewrite', 'ข้อความฉบับที่ใส่ใจคน', 'Tu texto centrado en las personas')}</strong><small>{w('Ready for your review', 'พร้อมให้คุณตรวจสอบ', 'Listo para tu revisión')}</small></div><p>{safeText}</p><button onClick={() => copy(safeText)}>{w('Copy caption', 'คัดลอกข้อความ', 'Copiar texto')}</button></div>}
    </section>
    <section role="tabpanel" id="sharing-panel-video" aria-labelledby="sharing-tab-video" hidden={tab !== 'video'} className="module-section"><SectionHeading step="2" title={w('Make a 45-second story', 'สร้างเรื่องราว 45 วินาที', 'Crea una historia de 45 segundos')} /><div className="topic-list">{topics.map((item) => <button key={item.id} aria-pressed={topic === item.id} className={topic === item.id ? 'active' : ''} onClick={() => setTopic(item.id)}><span>{topic === item.id ? '●' : '○'}</span>{item.title}</button>)}</div><button className="primary-small" disabled={Boolean(busy)} onClick={generate}>✦ {busy === 'script' ? w('Writing…', 'กำลังเขียน…', 'Escribiendo…') : w('Generate my story', 'สร้างเรื่องราวของฉัน', 'Generar mi historia')}</button>
      {script && <div className="script-result"><div className="script-copy"><small>{w('READY TO RECORD · 0:45', 'พร้อมบันทึก · 0:45', 'LISTO PARA GRABAR · 0:45')}</small><p>{script}</p><div className="inline-actions"><button className="secondary-action" onClick={() => onSpeak(script)}>◉ {w('Preview voiceover', 'ฟังเสียงบรรยาย', 'Escuchar narración')}</button><button className="secondary-action" onClick={() => copy(script)}>{w('Copy script', 'คัดลอกสคริปต์', 'Copiar guion')}</button></div></div><div className="referral-card" ref={qrRef}><span>U.CENTER · FLOW</span><QRCodeSVG value={`https://u.center/?ref=${encodeURIComponent(ambassador.trim() || 'ikigai-flow')}`} size={140} marginSize={4} bgColor="#f5fff9" fgColor="#09251b" level="M" /><strong>{w('Grow with purpose', 'เติบโตอย่างมีความหมาย', 'Crece con propósito')}</strong><small>{w('Learn · connect · contribute', 'เรียนรู้ · เชื่อมต่อ · มีส่วนร่วม', 'Aprende · conecta · contribuye')}</small><button className="qr-download" onClick={saveCard}>{w('Save QR', 'บันทึก QR', 'Guardar QR')}</button></div></div>}
      <div className="gift-recipient"><label htmlFor="referral-code">{w('Your referral code', 'รหัสแนะนำของคุณ', 'Tu código de referencia')}</label><input id="referral-code" value={ambassador} maxLength={60} onChange={(event) => setAmbassador(event.target.value)} /></div>
    </section>
  </div>;
}
