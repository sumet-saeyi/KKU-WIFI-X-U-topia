'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Icon } from '@/components/ui/Icon';
import { IkigaiMark } from '@/components/IkigaiMark';
import { PoweredBy } from '@/components/product/PoweredBy';
import { companionContext, companionPrompts, planAction, restrictCompanionPlan, type CompanionInput, type CompanionMessage, type CompanionPlan, type CompanionResult } from '@/lib/companion';
import { readCompanionResponse } from '@/lib/companionStream';
import { aiAvailabilityLabel } from '@/lib/aiStatus';
import { preparedCompanion, makeTrace } from '@/lib/presetData';
import { money, words } from '@/lib/i18n';
import { screenLabel, type ScreenId } from '@/lib/product';
import type { LanguageCode, ToolCallTrace, WalletState } from '@/lib/types';

interface ChatItem extends CompanionMessage { id: number; language: LanguageCode; result?: CompanionResult; photo?: boolean; }
interface Props {
  open: boolean; seed: { id: number; text: string }; language: LanguageCode; screen: ScreenId; wallet: WalletState; stageSafeMode: boolean; configured: boolean | null;
  onClose: () => void; onNavigate: (screen: ScreenId) => void; onPlan: (plan: CompanionPlan) => boolean; onTrace: (trace: ToolCallTrace) => void;
  onRead: (text: string, language?: LanguageCode) => void; onStopReading: () => void; speaking: boolean; voiceLabel: string; onSettings: () => void;
}

export function AiCompanion({ open, seed, language, screen, wallet, stageSafeMode, configured, onClose, onNavigate, onPlan, onTrace, onRead, onStopReading, speaking, voiceLabel, onSettings }: Props) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const itemsRef = useRef<ChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [autoRead, setAutoRead] = useState(false);
  const autoReadRef = useRef(false);
  const [readingId, setReadingId] = useState(0);
  const [usedPlans, setUsedPlans] = useState<number[]>([]);
  const [photo, setPhoto] = useState<{ data: string; name: string } | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoReader = useRef<FileReader | null>(null);
  const photoGeneration = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const idRef = useRef(0);
  const seenSeed = useRef(0);
  const sessionRef = useRef('');
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const prompts = companionPrompts(screen, language);
  const update = (next: ChatItem[]) => { itemsRef.current = next; setItems(next); };
  const cancel = () => { requestRef.current?.abort(); generation.current += 1; setBusy(false); };
  const discardPhoto = () => {
    photoGeneration.current += 1; photoReader.current?.abort(); photoReader.current = null;
    setPhoto(null); setPhotoLoading(false); if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => {
    if (open) return () => { requestRef.current?.abort(); generation.current += 1; discardPhoto(); onStopReading(); };
  }, [open, language]); // A disconnect can finish with a labeled saved guide; closing or changing language cancels.
  useEffect(() => { setBusy(false); setError(''); setFallback(false); setPreview(''); }, [open, language]);
  useEffect(() => {
    if (typeof window === 'undefined' || !open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const resize = () => { document.documentElement.style.setProperty('--ai-viewport-height', `${viewport.height}px`); document.documentElement.style.setProperty('--ai-viewport-top', `${viewport.offsetTop}px`); };
    resize(); viewport.addEventListener('resize', resize); viewport.addEventListener('scroll', resize);
    return () => { viewport.removeEventListener('resize', resize); viewport.removeEventListener('scroll', resize); document.documentElement.style.removeProperty('--ai-viewport-height'); document.documentElement.style.removeProperty('--ai-viewport-top'); };
  }, [open]);
  useEffect(() => {
    if (typeof window === 'undefined' || !open || !historyRef.current) return;
    const history = historyRef.current;
    const last = [...history.querySelectorAll<HTMLElement>('.ai-message')].at(-1);
    const top = last && items.at(-1)?.role === 'assistant' ? history.scrollTop + last.getBoundingClientRect().top - history.getBoundingClientRect().top - 30 : history.scrollHeight;
    history.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }, [items, busy, open, Boolean(preview)]);

  const submit = async (text = draft, includePhoto = false) => {
    if (!text.trim() || text.length > 2000 || busy || (includePhoto && photoLoading)) return;
    const offline = stageSafeMode || (typeof window !== 'undefined' && !window.navigator.onLine);
    const attachment = includePhoto ? photo : null;
    if (attachment && offline) { setError('photo_needs_live'); return; }
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    const current = ++generation.current;
    const previous = itemsRef.current;
    const next = previous.at(-1)?.role === 'user' && previous.at(-1)?.text === text.trim() ? previous : [...previous, { id: ++idRef.current, language, role: 'user' as const, text: text.trim(), photo: Boolean(attachment) }];
    update(next); setDraft(''); setError(''); setFallback(false); setPreview(''); setBusy(true); setLastPrompt(text.trim());
    if (!sessionRef.current) sessionRef.current = `c_${typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    const history = next.length > 10 ? [...next.slice(0, 2), ...next.slice(-8)] : next;
    const input: CompanionInput = { messages: history.map(({ role, text: message }) => ({ role, text: message.slice(0, 2000) })), context: companionContext(wallet, screen), language, stageSafeMode: offline, sessionId: sessionRef.current, ...(attachment ? { image: attachment.data } : {}) };
    if (!includePhoto) discardPhoto();
    const started = performance.now();
    try {
      let result: CompanionResult;
      if (offline) result = { ...restrictCompanionPlan(preparedCompanion(input), input), source: 'stage-safe', latencyMs: Math.round(performance.now() - started) };
      else {
        let receivedPreview = false;
        try {
          const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]);
          const response = await fetch('/api/companion', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify(input), signal });
          const parsed = await readCompanionResponse(response, (text) => {
            if (current !== generation.current || controller.signal.aborted) return;
            receivedPreview = true; setPreview(text);
          }, signal);
          result = { ...restrictCompanionPlan(parsed, input), source: 'live', latencyMs: Math.round(performance.now() - started) };
        } catch (cause) {
          if (controller.signal.aborted || attachment || current !== generation.current || (cause instanceof Error && ['invalid_origin', 'unsafe_output'].includes(cause.message))) throw cause;
          if (receivedPreview) throw new Error('incomplete');
          result = { ...restrictCompanionPlan(preparedCompanion(input), input), source: 'stage-safe', latencyMs: Math.round(performance.now() - started) };
          setFallback(true);
        }
      }
      if (current !== generation.current) return;
      setPreview('');
      const id = ++idRef.current;
      update([...next, { id, language, role: 'assistant', text: result.text, result }]);
      discardPhoto();
      const pillar = screen === 'home' || screen === 'wallet' ? 'vocation' : screen;
      const trace = makeTrace(pillar, 'companionConversation', { source: result.source, language, screen, messages: input.messages.length, photo: Boolean(input.image), proposedAction: result.plan.kind }, 'Returned guidance and a validated proposal only. No payment was executed.', 'PASSED_NON_CUSTODIAL_CAP');
      trace.latencyMs = result.latencyMs; onTrace(trace);
      if (autoReadRef.current) { setReadingId(id); onRead(result.text, language); }
    } catch (cause) {
      if (current !== generation.current) return;
      setError(controller.signal.aborted ? 'cancelled' : cause instanceof Error ? cause.message : 'connection_error');
    } finally { if (current === generation.current) setBusy(false); }
  };

  useEffect(() => {
    if (open && seed.text && seed.id !== seenSeed.current) { seenSeed.current = seed.id; void submit(seed.text); }
  }, [open, seed.id]);

  const errors: Record<string, string> = {
    not_configured: w('Connected AI isn’t set up on this server yet. You can keep exploring with clearly labeled offline examples.', 'AI ออนไลน์ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์นี้ ลองต่อด้วยตัวอย่างออฟไลน์ที่มีป้ายบอกชัดเจนได้', 'La IA conectada aún no está configurada en este servidor. Puedes seguir con ejemplos sin conexión claramente identificados.'),
    auth_failed: w('U-Bot could not sign in. Check the server’s U-Bot connection or use offline examples. Your account details are never shown here.', 'U-Bot เข้าสู่ระบบไม่สำเร็จ ตรวจการเชื่อมต่อบนเซิร์ฟเวอร์หรือใช้ตัวอย่างออฟไลน์ ข้อมูลบัญชีจะไม่แสดงที่นี่', 'U-Bot no pudo iniciar sesión. Revisa la conexión del servidor o usa ejemplos sin conexión. Los datos de la cuenta nunca se muestran aquí.'),
    photo_needs_live: w('Photo understanding needs Connected AI. Reconnect before asking about a photo. Saved guides cannot see your image.', 'การอ่านรูปต้องใช้ AI ออนไลน์ เชื่อมต่ออีกครั้งก่อนถามเกี่ยวกับรูป คำตอบสำรองมองไม่เห็นรูปของคุณ', 'Para entender fotos hace falta IA conectada. Conéctate antes de preguntar sobre una foto. Las guías guardadas no pueden ver tu imagen.'),
    photo_invalid: w('Choose a JPG, PNG, or WebP photo under 4 MB.', 'เลือกรูป JPG, PNG หรือ WebP ไม่เกิน 4 MB', 'Elige una foto JPG, PNG o WebP de menos de 4 MB.'),
    cancelled: w('Stopped. No action was taken. Your question is ready to retry.', 'หยุดแล้ว ไม่มีการทำรายการ ลองส่งคำถามเดิมอีกครั้งได้', 'Detenido. No se realizó ninguna acción. Puedes reintentar tu pregunta.'),
    incomplete: w('The connection ended before the reply was complete. The draft was not used for actions or conversation history. You can retry your question.', 'การเชื่อมต่อจบก่อนตอบครบ ฉบับร่างไม่ถูกใช้ทำรายการหรือเพิ่มในประวัติสนทนา ลองส่งคำถามอีกครั้งได้', 'La conexión terminó antes de completar la respuesta. El borrador no se usó para acciones ni para el historial. Puedes reintentar.'),
  };
  const errorText = errors[error] ?? w('The connected guide couldn’t finish this reply. Nothing was approved. Please try again.', 'ไกด์ออนไลน์ตอบไม่สำเร็จ ไม่มีการยืนยันรายการ กรุณาลองอีกครั้ง', 'La guía conectada no pudo terminar. No se aprobó nada. Intenta de nuevo.');
  const source = (offline: boolean) => offline ? w('Saved guide · not live AI', 'คำตอบสำรอง · ไม่ใช่ AI สด', 'Guía guardada · no es IA en vivo') : w('U-Bot · check important details', 'U-Bot · ตรวจสอบรายละเอียดสำคัญ', 'U-Bot · revisa los detalles importantes');
  const hasLiveReply = !fallback && !error && items.at(-1)?.result?.source === 'live';

  return <Modal open={open} onClose={() => { cancel(); onClose(); }} label={w('Your AI companion', 'เพื่อน AI ของคุณ', 'Tu compañero de IA')} className="ai-companion-modal">
    <header className="ai-chat-header"><div className="ai-chat-brand"><IkigaiMark compact /><div><strong>U-Pilot</strong><PoweredBy language={language} compact /></div></div><button className="icon-button" aria-label={w('Close AI companion', 'ปิดเพื่อน AI', 'Cerrar compañero de IA')} onClick={() => { cancel(); onClose(); }}><Icon name="close" size={20} /></button></header>
    <div className={`ai-source-bar ${!stageSafeMode && hasLiveReply ? 'connected' : 'offline'}`}><span><i />{aiAvailabilityLabel(language, stageSafeMode, configured, hasLiveReply)}</span><button onClick={onSettings}>{w('Preferences', 'การตั้งค่า', 'Preferencias')}<Icon name="settings" size={14} /></button></div>
    <div className="ai-chat-context"><Icon name="shield" size={15} /><span>{screenLabel(screen, language)} · {money(companionContext(wallet, screen).remainingDailyUsd, language)} {w('remaining today', 'ใช้ได้อีกวันนี้', 'disponibles hoy')}</span></div>
    <div className="ai-chat-history" ref={historyRef} role="log" aria-label={w('Conversation', 'การสนทนา', 'Conversación')} aria-live="polite" aria-relevant="additions">
      {!items.length && <div className="ai-chat-welcome"><span className="guide-orb"><Icon name="spark" size={30} /></span><h2>{w('Tell me what matters.', 'บอกฉันว่าสิ่งไหนสำคัญ', 'Dime qué importa.')}</h2><p>{w('Ask a question, think through a goal, or take one small step. I’ll explain the options. You stay in control.', 'ถามคำถาม คิดเป้าหมาย หรือเริ่มก้าวเล็ก ๆ ฉันจะอธิบายตัวเลือก คุณยังเป็นผู้ควบคุม', 'Haz una pregunta, piensa una meta o da un pequeño paso. Te explicaré las opciones. Tú mantienes el control.')}</p><small>{stageSafeMode ? w('You’re offline. Saved guides are available, and U-Pilot reconnects automatically when you’re online.', 'คุณยังไม่ได้เชื่อมต่อ จึงใช้คำตอบสำรอง U-Pilot จะเชื่อมต่อ AI อัตโนมัติเมื่อคุณออนไลน์', 'No tienes conexión. Hay guías guardadas y U-Pilot se reconecta automáticamente cuando vuelves en línea.') : w('Send shares up to 10 messages, including your opening exchange, sample balances and any attached photo with U-Bot. U-Bot may retain account history. Don’t include sensitive details.', 'กดส่งเพื่อแชร์ไม่เกิน 10 ข้อความ รวมบทสนทนาเปิดเรื่อง ยอดเงินตัวอย่าง และรูปที่แนบให้ U-Bot ซึ่งอาจเก็บประวัติบัญชี อย่าใส่ข้อมูลส่วนตัวสำคัญ', 'Enviar comparte hasta 10 mensajes, incluido el intercambio inicial, saldos de ejemplo y la foto con U-Bot. U-Bot puede conservar el historial de la cuenta. No incluyas datos sensibles.')}</small></div>}
      {items.map((item) => <article className={`ai-message ${item.role}`} key={item.id}><div className="ai-message-author">{item.role === 'user' ? w('You', 'คุณ', 'Tú') : 'U-Pilot'}{item.result && <span>{source(item.result.source === 'stage-safe')}</span>}</div><p>{item.text}</p>{item.photo && <small className="ai-photo-sent"><Icon name="receipt" size={13} />{w('Photo included with this question', 'แนบรูปกับคำถามนี้แล้ว', 'Foto incluida con esta pregunta')}</small>}
        {item.result && <><div className="ai-message-actions"><button onClick={() => { if (speaking && readingId === item.id) { onStopReading(); setReadingId(0); } else { setReadingId(item.id); onRead(item.text, item.language); } }}><Icon name="speaker" size={16} />{speaking && readingId === item.id ? w('Stop reading', 'หยุดอ่าน', 'Detener lectura') : w('Read aloud', 'อ่านให้ฟัง', 'Leer en voz alta')}</button></div>{item.result.plan.kind !== 'none' && <div className="ai-plan"><span className="eyebrow">{w('A POSSIBLE NEXT STEP', 'ก้าวถัดไปที่เป็นไปได้', 'UN POSIBLE SIGUIENTE PASO')}</span><strong>{item.result.plan.title}</strong><p>{item.result.plan.why}</p><button className="button button-primary" disabled={usedPlans.includes(item.id) || busy} onClick={() => {
          const plan = item.result!.plan;
          if (plan.kind === 'navigate') { onClose(); onNavigate(plan.screen); }
          else if (onPlan(plan)) { setUsedPlans((current) => [...current, item.id]); onClose(); }
        }}>{usedPlans.includes(item.id) ? w('Already reviewed', 'ตรวจสอบแล้ว', 'Ya revisado') : planAction(item.result.plan) ? w('Review this example', 'ตรวจสอบตัวอย่างนี้', 'Revisar este ejemplo') : w('Open this task', 'เปิดงานนี้', 'Abrir esta tarea')}<Icon name="arrow" size={16} /></button>{planAction(item.result.plan) && <small>{w('Opens a review. Does not confirm or move money.', 'เปิดเพื่อตรวจสอบ ยังไม่ยืนยันหรือเคลื่อนเงิน', 'Abre una revisión. No confirma ni mueve dinero.')}</small>}</div>}{item.id === items.at(-1)?.id && <div className="ai-follow-ups">{item.result.followUps.map((prompt) => <button key={prompt} disabled={busy || photoLoading} onClick={() => void submit(prompt)}>{prompt}<Icon name="arrow" size={13} /></button>)}</div>}</>}
      </article>)}
      {preview && <article className="ai-message ai-message-preview" aria-live="off"><div className="ai-message-author">U-Pilot<span>{busy ? w('U-Bot · streaming draft', 'U-Bot · กำลังส่งฉบับร่าง', 'U-Bot · borrador en curso') : w('Incomplete draft · not used', 'ฉบับร่างไม่ครบ · ยังไม่ใช้', 'Borrador incompleto · no utilizado')}</span></div><p>{preview}</p><small>{w('Actions and read-aloud are available only after the reply finishes and passes validation.', 'ทำรายการและอ่านเสียงได้เมื่อคำตอบเสร็จและผ่านการตรวจสอบแล้วเท่านั้น', 'Las acciones y la lectura están disponibles solo al terminar y validar la respuesta.')}</small></article>}
      {fallback && <div className="ai-chat-error ai-chat-fallback" role="status"><p>{w('U-Bot is unavailable. This is a saved guide, not live AI. Your next question will try U-Bot again.', 'U-Bot ยังไม่พร้อม นี่คือคำตอบสำรอง ไม่ใช่ AI สด คำถามถัดไปจะลองเชื่อมต่อ U-Bot อีกครั้ง', 'U-Bot no está disponible. Esta es una guía guardada, no IA en vivo. Tu siguiente pregunta volverá a intentar con U-Bot.')}</p>{!stageSafeMode && <button className="button button-outline" disabled={busy} onClick={() => void submit(lastPrompt)}>{w('Try AI again', 'ลอง AI อีกครั้ง', 'Intentar IA de nuevo')}</button>}</div>}
      {busy && <div className="ai-thinking" role="status"><span /><span /><span /><p>{preview ? w('Reply arriving…', 'กำลังรับคำตอบ…', 'Recibiendo respuesta…') : w('Thinking through your question…', 'กำลังคิดคำตอบให้คุณ…', 'Pensando en tu pregunta…')}</p><button onClick={() => { cancel(); setError('cancelled'); }}>{w('Stop', 'หยุด', 'Detener')}</button></div>}
      {error && <div className="ai-chat-error" role="alert"><p>{errorText}</p><div>{lastPrompt && error !== 'not_configured' && <button className="button button-outline" onClick={() => void submit(lastPrompt, true)}>{w('Try again', 'ลองใหม่', 'Reintentar')}</button>}{error === 'not_configured' && <button className="text-button" onClick={onSettings}>{w('Open preferences', 'เปิดการตั้งค่า', 'Abrir preferencias')}</button>}</div></div>}
    </div>
    <div className="ai-chat-composer">{!stageSafeMode && <details className="ai-privacy-note"><summary>{w('Shared with U-Bot · what’s sent', 'แชร์ให้ U-Bot · ข้อมูลที่ส่ง', 'Compartido con U-Bot · qué se envía')}</summary><p>{w('Send shares up to 10 messages (including your opening exchange), sample balances, current task and any attached photo with U-Bot. U-Bot may retain account history.', 'กดส่งเพื่อแชร์ไม่เกิน 10 ข้อความ รวมบทสนทนาเปิดเรื่อง ยอดเงินตัวอย่าง งานปัจจุบัน และรูปที่แนบให้ U-Bot ซึ่งอาจเก็บประวัติบัญชี', 'Enviar comparte hasta 10 mensajes (incluido el intercambio inicial), saldos, tarea y foto con U-Bot, que puede conservar el historial de la cuenta.')}</p><p>{w('Read aloud shares the selected text with ElevenLabs. Device voices stay available if it cannot connect.', 'อ่านให้ฟังจะแชร์ข้อความที่เลือกให้ ElevenLabs หากเชื่อมต่อไม่ได้จะใช้เสียงอุปกรณ์แทน', 'Leer en voz alta comparte el texto con ElevenLabs. La voz del dispositivo sigue disponible si no conecta.')}</p></details>}<div className="ai-composer-options"><label><input type="checkbox" checked={autoRead} onChange={(event) => { const enabled = event.target.checked; autoReadRef.current = enabled; setAutoRead(enabled); if (!enabled) { onStopReading(); setReadingId(0); } }} />{w('Read replies aloud', 'อ่านคำตอบให้ฟัง', 'Leer respuestas en voz alta')}</label><button onClick={() => { cancel(); setPreview(''); sessionRef.current = ''; update([]); discardPhoto(); setDraft(''); setLastPrompt(''); setError(''); setFallback(false); setUsedPlans([]); onStopReading(); }} disabled={!items.length && !photo && !photoLoading}>{w('New conversation', 'เริ่มคุยใหม่', 'Nueva conversación')}</button></div>{!items.length && <div className="ai-starter-prompts">{prompts.map((prompt) => <button key={prompt} disabled={busy} onClick={() => void submit(prompt)}>{prompt}<Icon name="arrow" size={14} /></button>)}</div>}
      <p className="voice-provider-note" role="status">{voiceLabel}</p>
      {photoLoading && <p className="input-hint" role="status">{w('Preparing your photo locally…', 'กำลังเตรียมรูปบนอุปกรณ์…', 'Preparando tu foto en este dispositivo…')}</p>}
      {photo && <div className="ai-photo-preview"><img src={photo.data} alt={w('Selected photo preview', 'ตัวอย่างรูปที่เลือก', 'Vista previa de la foto')} /><span>{photo.name}</span><button className="icon-button" aria-label={w('Remove photo', 'ลบรูป', 'Quitar foto')} onClick={discardPhoto}><Icon name="close" size={16} /></button></div>}
      <form onSubmit={(event) => { event.preventDefault(); void submit(draft, true); }}><label htmlFor="ai-question">{w('What would you like to work through?', 'อยากให้ช่วยคิดเรื่องอะไร', '¿Qué te gustaría resolver?')}</label><div><textarea id="ai-question" rows={2} value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(draft, true); } }} /><button className="ai-send" type="submit" disabled={busy || photoLoading || !draft.trim()} aria-label={w('Send question', 'ส่งคำถาม', 'Enviar pregunta')}><Icon name="arrow" size={21} /></button></div></form>
      <div className="ai-compose-foot"><input type="file" className="sr-only" tabIndex={-1} ref={fileRef} accept="image/jpeg,image/png,image/webp" aria-label={w('Choose a photo for AI', 'เลือกรูปให้ AI', 'Elegir una foto para la IA')} onChange={(event) => {
        if (typeof window === 'undefined') return;
        const file = event.target.files?.[0]; if (!file) return;
        discardPhoto();
        if (file.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('photo_invalid'); return; }
        const current = ++photoGeneration.current;
        const reader = new FileReader(); photoReader.current = reader; setPhotoLoading(true);
        reader.onload = () => { if (current !== photoGeneration.current) return; setPhoto({ data: String(reader.result), name: file.name }); setPhotoLoading(false); photoReader.current = null; };
        reader.onerror = () => { if (current === photoGeneration.current) { setError('photo_invalid'); setPhotoLoading(false); photoReader.current = null; } };
        reader.readAsDataURL(file);
      }} /><button disabled={busy} onClick={() => { if (stageSafeMode) setError('photo_needs_live'); else fileRef.current?.click(); }}><Icon name="receipt" size={16} />{w('Add a photo', 'เพิ่มรูป', 'Añadir foto')}</button><span>{w('Local history stays in this tab. AI can make mistakes.', 'ประวัติบนอุปกรณ์อยู่ในแท็บนี้ AI อาจตอบผิดได้', 'El historial local queda en esta pestaña. La IA puede equivocarse.')}</span></div>
    </div>
  </Modal>;
}
