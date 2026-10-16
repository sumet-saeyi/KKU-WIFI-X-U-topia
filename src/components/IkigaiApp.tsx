'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { HomeDashboard } from '@/components/product/HomeDashboard';
import { DesktopNavigation, MobileNavigation } from '@/components/product/Navigation';
import { GuidedTour, Preferences } from '@/components/product/SupportDialogs';
import { IkigaiSelector } from '@/components/product/IkigaiSelector';
import { AiCompanion } from '@/components/product/AiCompanion';
import { PoweredBy } from '@/components/product/PoweredBy';
import { companionContext, planAction, type CompanionPlan } from '@/lib/companion';
import { aiAvailabilityLabel } from '@/lib/aiStatus';
import { Icon } from '@/components/ui/Icon';
import { screenLabel, type ScreenId } from '@/lib/product';
import { MentorDrawer } from '@/components/MentorDrawer';
import { Navbar } from '@/components/Navbar';
import { PhoneSimulator, WalletCompanion, WalletPage } from '@/components/PhoneSimulator';
import { MissionAmplifyModule } from '@/components/pillars/MissionAmplifyModule';
import { PassionLegacyModule } from '@/components/pillars/PassionLegacyModule';
import { ProfessionAgentPayModule } from '@/components/pillars/ProfessionAgentPayModule';
import { VocationAcademyModule } from '@/components/pillars/VocationAcademyModule';
import type { AgentResult } from '@/components/pillars/moduleTypes';
import { guideText, makeTrace, initialWallet, stageSafeAnswer, signatureRequest } from '@/lib/presetData';
import { pillarOrder, words } from '@/lib/i18n';
import { speakCalmly, stopSpeaking } from '@/lib/tts';
import { completeAcademy, confirmWalletRequest, isStoredWallet, refreshSpendingDay, validateRequest } from '@/lib/wallet';
import type { ExperienceMode, LanguageCode, PendingSignatureRequest, PillarId, ToolCallTrace, WalletState, WalletTransaction } from '@/lib/types';

export default function IkigaiApp({ initialMode }: { initialMode?: ExperienceMode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activePillar, setActivePillar] = useState<PillarId>('profession');
  const [browserOnline, setBrowserOnline] = useState(true);
  const stageSafeMode = !browserOnline;
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(initialMode ?? 'web');
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const walletRef = useRef(wallet);
  const [ready, setReady] = useState(false);
  const [traces, setTraces] = useState<ToolCallTrace[]>([]);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<'browser' | 'elevenlabs'>('browser');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceIssue, setVoiceIssue] = useState<'' | 'language' | 'unavailable' | 'fallback'>('');
  const [speechConfigured, setSpeechConfigured] = useState(false);
  const [toast, setToast] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSeed, setAiSeed] = useState({ id: 0, text: '' });
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [receipt, setReceipt] = useState<WalletTransaction | null>(null);
  const [completed, setCompleted] = useState<WalletTransaction | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [linkedMerchant, setLinkedMerchant] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const voiceIssueMessage = (issue: 'language' | 'unavailable' | 'fallback') => issue === 'language'
    ? w('This device has no voice for this language. Your guide text is still on screen.', 'อุปกรณ์นี้ยังไม่มีเสียงภาษานี้ คุณยังอ่านคำแนะนำบนจอได้', 'Este dispositivo no tiene voz para este idioma. Puedes leer la guía en pantalla.')
    : issue === 'fallback'
      ? w('Device voice · ElevenLabs is unavailable', 'เสียงจากอุปกรณ์ · ElevenLabs ยังไม่พร้อม', 'Voz del dispositivo · ElevenLabs no está disponible')
      : w('Voice is unavailable here. Your guide text is shown on screen.', 'อุปกรณ์นี้ยังไม่พร้อมอ่านเสียง คุณอ่านคำแนะนำบนจอได้', 'La voz no está disponible aquí. Puedes leer la guía en pantalla.');

  const updateWallet = (next: WalletState) => { walletRef.current = next; setWallet(next); };
  const askAi = (text = '') => { setAiSeed((current) => ({ id: current.id + 1, text })); setAiOpen(true); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let controller: AbortController | null = null;
    const check = () => {
      controller?.abort();
      setBrowserOnline(window.navigator.onLine);
      if (!window.navigator.onLine) return;
      const current = new AbortController(); controller = current;
      fetch('/api/agent', { cache: 'no-store', signal: AbortSignal.any([current.signal, AbortSignal.timeout(5000)]) })
        .then((response) => { if (!response.ok) throw new Error('unavailable'); return response.json(); })
        .then((data) => { if (!current.signal.aborted) { setAiConfigured(typeof data.configured === 'boolean' ? data.configured : null); setSpeechConfigured(data.speech?.configured === true); } })
        .catch(() => { if (!current.signal.aborted) setAiConfigured(null); /* The next question still tries live AI. */ });
    };
    const disconnect = () => { controller?.abort(); setBrowserOnline(false); stopSpeaking(); setSpeaking(false); };
    check();
    window.addEventListener('online', check); window.addEventListener('offline', disconnect); window.addEventListener('focus', check);
    return () => { controller?.abort(); window.removeEventListener('online', check); window.removeEventListener('offline', disconnect); window.removeEventListener('focus', check); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setExperienceMode(initialMode ?? (window.matchMedia('(max-width: 899px)').matches ? 'mobile' : 'web'));
    setLinkedMerchant(new URLSearchParams(window.location.search).get('merchant')?.slice(0, 80) ?? '');
    try {
      const stored = JSON.parse((window.localStorage.getItem('u-ikigai-product-v3') ?? window.localStorage.getItem('u-ikigai-demo-v2')) ?? 'null');
      if (isStoredWallet(stored?.wallet)) {
        const restored = refreshSpendingDay({ ...stored.wallet, pendingSignature: null });
        walletRef.current = restored;
        setWallet(restored);
      }
      if (['en', 'th', 'es'].includes(stored?.language)) setLanguage(stored.language);
      if (typeof stored?.voiceEnabled === 'boolean') setVoiceEnabled(stored.voiceEnabled);
      setExperienceMode(initialMode ?? (window.matchMedia('(max-width: 899px)').matches ? 'mobile' : ['web', 'mobile'].includes(stored?.experienceMode) ? stored.experienceMode : 'web'));
    } catch { /* A restricted browser still supports the entire in-memory demo. */ }
    setReady(true);
    return () => { stopSpeaking(); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [initialMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production' || !('serviceWorker' in window.navigator)) return;
    window.navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      await window.navigator.serviceWorker.ready;
      const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[href]')]
        .map((element) => 'src' in element ? element.src : element.href).filter((url) => new URL(url).origin === window.location.origin && url.includes('/_next/static/'));
      (registration.active ?? registration.waiting)?.postMessage({ type: 'CACHE_ASSETS', assets });
    }).catch(() => { /* The current page still works offline when browser caching is restricted. */ });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.lang = language;
    if (ready) {
      try { window.localStorage.setItem('u-ikigai-product-v3', JSON.stringify({ wallet: { ...wallet, pendingSignature: null }, language, experienceMode, voiceEnabled })); } catch { /* Session remains usable without storage. */ }
    }
  }, [wallet, language, experienceMode, voiceEnabled, ready]);

  const notify = (message: string) => {
    setToast(message);
    if (typeof window !== 'undefined') {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 4200);
    }
  };
  const addTrace = (trace: ToolCallTrace) => setTraces((current) => [trace, ...current].slice(0, 50));
  const startReading = (text: string, spokenLanguage: LanguageCode = language) => {
    setSpeaking(true); setVoiceIssue('');
    let unavailableReported = false;
    const unavailable = (reason: 'unsupported' | 'language' | 'playback') => {
      unavailableReported = true;
      const issue = reason === 'language' ? 'language' : 'unavailable';
      setVoiceIssue(issue); notify(voiceIssueMessage(issue));
    };
    if (!speakCalmly(text, spokenLanguage, () => { setSpeaking(false); setVoiceLoading(false); }, {
      connected: !stageSafeMode && speechConfigured,
      onProvider: (provider, state) => { setVoiceProvider(provider); setVoiceLoading(state === 'loading'); },
      onFallback: () => { setVoiceIssue('fallback'); notify(w('ElevenLabs is unavailable. Using your device voice instead.', 'ElevenLabs ยังไม่พร้อม จึงใช้เสียงจากอุปกรณ์แทน', 'ElevenLabs no está disponible. Se usará la voz de tu dispositivo.')); },
      onUnavailable: unavailable,
    }) && !unavailableReported) unavailable('unsupported');
  };
  const speak = (text: string) => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    startReading(text);
  };
  const navigate = (next: ScreenId) => {
    setScreen(next);
    stopSpeaking(); setSpeaking(false);
    if (next !== 'home' && next !== 'wallet') {
      setActivePillar(next);
      if (voiceEnabled) startReading(guideText[language][next]);
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const selectExperienceMode = (mode: ExperienceMode) => {
    setExperienceMode(mode);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showWalletError = (error: string) => {
    notify(error === 'cap' ? w('This would exceed your daily limit. Your money stays where it is.', 'รายการนี้เกินวงเงินประจำวัน เงินของคุณยังอยู่ที่เดิม', 'Esto supera tu límite diario. Tu dinero permanece donde está.')
      : error === 'pending' ? w('Finish reviewing the current action first.', 'กรุณาตรวจสอบรายการปัจจุบันให้เสร็จก่อน', 'Termina de revisar la acción actual primero.')
      : w('There is not enough available balance for this action.', 'ยอดเงินคงเหลือไม่เพียงพอสำหรับรายการนี้', 'No hay suficiente saldo disponible para esta acción.'));
  };
  const prepareSignature = (request: PendingSignatureRequest, trace: ToolCallTrace) => {
    const current = refreshSpendingDay(walletRef.current);
    if (current.pendingSignature) { showWalletError('pending'); return false; }
    const error = validateRequest(current, request);
    if (error) { showWalletError(error); return false; }
    updateWallet({ ...current, pendingSignature: request });
    addTrace(trace);
    notify(w('Review the details, then approve when you are ready.', 'ตรวจสอบรายละเอียด แล้วยืนยันเมื่อพร้อม', 'Revisa los detalles y aprueba cuando estés listo.'));
    return true;
  };
  const reviewAiPlan = (plan: CompanionPlan): boolean => {
    const action = planAction(plan);
    if (!action || (action === 'FUND_GOLD_GOAL' && (plan.amountUsd === null || plan.amountUsd < 1 || plan.amountUsd > 1000))) return false;
    const request = signatureRequest(action, plan.amountUsd ?? 25, language);
    request.isAutomated = true;
    const context = companionContext(refreshSpendingDay(walletRef.current), screen);
    if (action === 'FUND_GOLD_GOAL' && request.usdValue > context.remainingDailyUsd) { showWalletError('cap'); return false; }
    return prepareSignature(request, makeTrace(request.pillar, 'reviewCompanionProposal', { action, amountUsd: request.usdValue }, 'Created a fixed, validated sample review from a companion proposal. Explicit confirmation is still required.', 'PASSED_NON_CUSTODIAL_CAP'));
  };
  const readAi = (text: string, answerLanguage: LanguageCode = language) => startReading(text, answerLanguage);
  const stopAiVoice = () => { stopSpeaking(); setSpeaking(false); setVoiceIssue(''); };
  const voiceLabel = voiceIssue ? voiceIssueMessage(voiceIssue) : speaking ? voiceProvider === 'elevenlabs' ? voiceLoading ? w('Preparing ElevenLabs voice…', 'กำลังเตรียมเสียง ElevenLabs…', 'Preparando voz ElevenLabs…') : w('ElevenLabs voice', 'เสียง ElevenLabs', 'Voz ElevenLabs') : w('Device voice', 'เสียงจากอุปกรณ์', 'Voz del dispositivo') : stageSafeMode ? w('Device voice · offline', 'เสียงจากอุปกรณ์ · ออฟไลน์', 'Voz del dispositivo · sin conexión') : speechConfigured ? w('ElevenLabs voice · device fallback', 'เสียง ElevenLabs · สำรองด้วยเสียงอุปกรณ์', 'Voz ElevenLabs · respaldo del dispositivo') : w('Device voice · ElevenLabs not connected', 'เสียงอุปกรณ์ · ยังไม่เชื่อมต่อ ElevenLabs', 'Voz del dispositivo · ElevenLabs no conectado');
  const runAgent = async (kind: string, prompt: string, image?: string): Promise<AgentResult> => {
    const saved = (): AgentResult => ({ text: stageSafeAnswer(kind, language), source: 'stage-safe' });
    if (stageSafeMode || (typeof window !== 'undefined' && !window.navigator.onLine)) {
      if (image) throw new Error(w('Photo understanding needs a connection. Your photo has not been analyzed.', 'การอ่านรูปต้องใช้การเชื่อมต่อ ยังไม่ได้วิเคราะห์รูปของคุณ', 'Para entender una foto hace falta conexión. Tu foto no se ha analizado.'));
      return saved();
    }
    try {
      const response = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, prompt, image, language, stageSafeMode: false }),
        signal: AbortSignal.timeout(65000),
      });
      const data = await response.json();
      if (!response.ok || data.source !== 'live' || typeof data.text !== 'string' || !data.text.trim()) throw new Error(typeof data.code === 'string' ? data.code : 'connection_error');
      return { text: data.text, source: 'live' };
    } catch (error) {
      if (image || (error instanceof Error && error.message === 'invalid_origin')) throw new Error(w('U-Bot could not analyze this photo or request. Please try again; nothing was approved.', 'U-Bot วิเคราะห์รูปหรือคำขอนี้ไม่สำเร็จ กรุณาลองอีกครั้ง ยังไม่มีการยืนยันรายการ', 'U-Bot no pudo analizar esta foto o solicitud. Intenta de nuevo; no se aprobó nada.'));
      notify(w('U-Bot is unavailable. Showing a saved guide, not live AI. The next request will try online again.', 'U-Bot ยังไม่พร้อม จึงแสดงคำตอบสำรอง ไม่ใช่ AI สด คำขอถัดไปจะลองออนไลน์อีกครั้ง', 'U-Bot no está disponible. Se muestra una guía guardada, no IA en vivo. La siguiente solicitud volverá a intentar en línea.'));
      return saved();
    }
  };

  const confirmSignature = () => {
    const current = walletRef.current;
    const pending = current.pendingSignature;
    if (!pending) return;
    const result = confirmWalletRequest(current);
    updateWallet(result.wallet);
    if (result.error) { showWalletError(result.error); return; }
    addTrace(makeTrace(pending.pillar, 'confirmDemoApproval', { intentHash: pending.intentHash, action: pending.onConfirmAction, receipt: `demo-${pending.id}` }, 'Demo ledger updated after explicit approval. No broadcast or token transfer occurred.'));
    setCompleted(result.wallet.transactions[0] ?? null);
    notify(w('Done. Your balance and activity are updated.', 'เรียบร้อย ยอดเงินและกิจกรรมอัปเดตแล้ว', 'Listo. Tu saldo y actividad están actualizados.'));
  };
  const cancelSignature = () => { updateWallet({ ...walletRef.current, pendingSignature: null }); notify(w('Cancelled. Nothing moved.', 'ยกเลิกแล้ว ไม่มีเงินเคลื่อนไหว', 'Cancelado. No se movió nada.')); };
  const completeCourse = (courseId: string) => updateWallet(completeAcademy(walletRef.current, courseId));
  const toggleRule = (id: string) => {
    const current = walletRef.current;
    const enabled = !(current.activeRules ?? []).includes(id);
    updateWallet({ ...current, activeRules: enabled ? [...(current.activeRules ?? []), id] : current.activeRules?.filter((rule) => rule !== id) });
    addTrace(makeTrace('profession', 'updateDemoRule', { id, enabled }, 'Saved an automation rule in the local demo; use its Run example action to test the trigger.'));
  };
  const resetDemo = () => { updateWallet(refreshSpendingDay(structuredClone(initialWallet))); setTraces([]); setScreen('home'); setCompleted(null); setReceipt(null); setPreferencesOpen(false); setResetKey((value) => value + 1); notify(w('Demo reset. You are ready to start again.', 'เริ่มเดโมใหม่แล้ว พร้อมลองอีกครั้ง', 'Demo reiniciada. Puedes empezar otra vez.')); };
  const commonProps = { language, stageSafeMode, onSpeak: speak, onSignature: prepareSignature, onTrace: addTrace, runAgent, notify };

  return <MotionConfig reducedMotion="user">
    <main className={`product-app experience-${experienceMode === 'web' ? 'desktop' : 'mobile'}`}>
      <a className="skip-link" href="#main-content">{w('Skip to workspace', 'ไปยังพื้นที่ใช้งาน', 'Ir al espacio de trabajo')}</a>
      {experienceMode === 'web' && <DesktopNavigation screen={screen} language={language} onNavigate={navigate} onHelp={() => setGuideOpen(true)} onSettings={() => setPreferencesOpen(true)} />}
      <div className="product-shell">
        <Navbar language={language} experienceMode={experienceMode} screen={screen} onLanguageChange={(next) => { stopSpeaking(); setSpeaking(false); setLanguage(next); }} onExperienceModeChange={selectExperienceMode} onHelp={() => setGuideOpen(true)} onSettings={() => setPreferencesOpen(true)} onHome={() => navigate('home')} onAskAi={() => askAi()} />
        <div className="product-layout">
          <div id="main-content" tabIndex={-1} className="product-content">
            {linkedMerchant && <section className="merchant-welcome"><span className="eyebrow">U-PAY</span><h2>{linkedMerchant}</h2><p>{w('Try a 450 THB practice payment. Review everything before you confirm.', 'ลองจ่ายตัวอย่าง 450 บาท ตรวจสอบทุกอย่างก่อนยืนยัน', 'Prueba un pago de 450 THB. Revisa todo antes de confirmar.')}</p><button className="button button-primary" onClick={() => {
              const request = signatureRequest('PAY_THB_BILL', 25, language); request.title = linkedMerchant;
              prepareSignature(request, makeTrace('profession', 'prepareMerchantQrPayment', { merchant: linkedMerchant, amountThb: 450 }, 'Prepared a demo payment from a generated merchant QR link.'));
            }}>{w('Try payment', 'ลองชำระเงิน', 'Probar pago')} →</button></section>}
            <div hidden={screen !== 'home'}><HomeDashboard mode={experienceMode} language={language} wallet={wallet} onNavigate={navigate} onTour={() => setGuideOpen(true)} onAskAi={askAi} stageSafeMode={stageSafeMode} configured={aiConfigured} /></div>
            <div hidden={screen === 'home' || screen === 'wallet'} className="task-workspace">
              <IkigaiSelector language={language} activePillar={activePillar} onSelect={navigate} />
              <div className="ai-task-entry"><span><Icon name="spark" size={19} /><span><strong>{w('You can talk this through.', 'ค่อย ๆ คุยเรื่องนี้ด้วยกันได้', 'Podemos pensar esto juntos.')}</strong><small>{aiAvailabilityLabel(language, stageSafeMode, aiConfigured)}</small></span></span><button onClick={() => askAi()}>{w('Ask U-Pilot', 'ถาม U-Pilot', 'Preguntar a U-Pilot')}<Icon name="arrow" size={16} /></button></div>
              <div key={resetKey}>
                {pillarOrder.map((pillar) => <section key={pillar} id={`panel-${pillar}`} hidden={screen !== pillar} aria-label={screenLabel(pillar, language)} className="module-card">
                  {pillar === 'passion' && <PassionLegacyModule {...commonProps} />}
                  {pillar === 'vocation' && <VocationAcademyModule {...commonProps} academyXp={wallet.academyXp} completedCourses={wallet.completedCourses ?? []} onCompleteCourse={completeCourse} />}
                  {pillar === 'mission' && <MissionAmplifyModule {...commonProps} />}
                  {pillar === 'profession' && <ProfessionAgentPayModule {...commonProps} activeRules={wallet.activeRules ?? []} onToggleRule={toggleRule} />}
                </section>)}
              </div>
              <button className="task-voice text-button" aria-pressed={speaking} onClick={() => speak(guideText[language][activePillar])}><Icon name="speaker" size={18} />{speaking ? w('Stop guide', 'หยุดเสียงไกด์', 'Detener guía') : w('Listen to your calm guide', 'ฟังไกด์ที่ใจเย็น', 'Escucha a tu guía')}</button>
              <p className="voice-provider-note" role="status">{voiceLabel}</p>
            </div>
            <div hidden={screen !== 'wallet'}><WalletPage wallet={wallet} language={language} onNavigate={navigate} onReceipt={setReceipt} /></div>
            <footer className="product-footer"><span>U-IKIGAI</span><p>{w('A little more balance. A lot more meaning.', 'สมดุลเพิ่มอีกนิด ความหมายเพิ่มอีกมาก', 'Un poco más de equilibrio. Mucho más propósito.')}</p><small>FLOW Summit Bangkok · 2026</small><PoweredBy language={language} /></footer>
          </div>
          {experienceMode === 'web' && <WalletCompanion wallet={wallet} language={language} onNavigate={navigate} onReceipt={setReceipt} activePillar={activePillar} onSpeak={speak} />}
        </div>
        {experienceMode === 'mobile' && <MobileNavigation screen={screen} language={language} onNavigate={navigate} />}
      </div>
      <PhoneSimulator wallet={wallet} language={language} experienceMode={experienceMode} onConfirm={confirmSignature} onCancel={cancelSignature} onNavigate={navigate} onReceipt={setReceipt} notify={notify} receipt={receipt} onCloseReceipt={() => setReceipt(null)} completed={completed} onCloseCompleted={() => setCompleted(null)} />
      <GuidedTour open={guideOpen} language={language} onClose={() => setGuideOpen(false)} onStart={() => { setGuideOpen(false); navigate('profession'); }} />
      <Preferences open={preferencesOpen} language={language} voiceEnabled={voiceEnabled} onLanguage={(next) => { stopSpeaking(); setSpeaking(false); setLanguage(next); }} onVoice={(next) => { stopSpeaking(); setSpeaking(false); setVoiceEnabled(next); }} onClose={() => setPreferencesOpen(false)} onMentor={() => { setPreferencesOpen(false); setMentorOpen(true); }} onReset={resetDemo} />
      <MentorDrawer open={mentorOpen} traces={traces} onClose={() => setMentorOpen(false)} />
      <AiCompanion key={resetKey} open={aiOpen} seed={aiSeed} language={language} screen={screen} wallet={wallet} stageSafeMode={stageSafeMode} configured={aiConfigured} onClose={() => setAiOpen(false)} onNavigate={navigate} onPlan={reviewAiPlan} onTrace={addTrace} onRead={readAi} onStopReading={stopAiVoice} speaking={speaking} voiceLabel={voiceLabel} onSettings={() => { setAiOpen(false); setPreferencesOpen(true); }} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  </MotionConfig>;
}

