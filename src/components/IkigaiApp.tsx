'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { HomeDashboard } from '@/components/product/HomeDashboard';
import { DesktopNavigation, MobileNavigation } from '@/components/product/Navigation';
import { GuidedTour, Preferences } from '@/components/product/SupportDialogs';
import { IkigaiSelector } from '@/components/product/IkigaiSelector';
import { Icon } from '@/components/ui/Icon';
import { screenLabel, type ScreenId } from '@/lib/product';
import { MentorDrawer } from '@/components/MentorDrawer';
import { Navbar } from '@/components/Navbar';
import { PhoneSimulator, WalletCompanion, WalletPage } from '@/components/PhoneSimulator';
import { MissionAmplifyModule } from '@/components/pillars/MissionAmplifyModule';
import { PassionLegacyModule } from '@/components/pillars/PassionLegacyModule';
import { ProfessionAgentPayModule } from '@/components/pillars/ProfessionAgentPayModule';
import { VocationAcademyModule } from '@/components/pillars/VocationAcademyModule';
import { guideText, makeTrace, initialWallet, stageSafeAnswer, signatureRequest } from '@/lib/presetData';
import { pillarOrder, words } from '@/lib/i18n';
import { speakCalmly, stopSpeaking } from '@/lib/tts';
import { completeAcademy, confirmWalletRequest, isStoredWallet, refreshSpendingDay, validateRequest } from '@/lib/wallet';
import type { ExperienceMode, LanguageCode, PendingSignatureRequest, PillarId, ToolCallTrace, WalletState, WalletTransaction } from '@/lib/types';

export default function IkigaiApp({ initialMode }: { initialMode?: ExperienceMode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activePillar, setActivePillar] = useState<PillarId>('profession');
  const [stageSafeMode, setStageSafeMode] = useState(true);
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(initialMode ?? 'web');
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const walletRef = useRef(wallet);
  const [ready, setReady] = useState(false);
  const [traces, setTraces] = useState<ToolCallTrace[]>([]);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [toast, setToast] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [receipt, setReceipt] = useState<WalletTransaction | null>(null);
  const [completed, setCompleted] = useState<WalletTransaction | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [linkedMerchant, setLinkedMerchant] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const w = (en: string, th: string, es: string) => words(language, en, th, es);

  const updateWallet = (next: WalletState) => { walletRef.current = next; setWallet(next); };

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
  const speak = (text: string) => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    if (!speakCalmly(text, language, () => setSpeaking(false))) notify(w('Voice is unavailable here. Your guide text is shown on screen.', 'อุปกรณ์นี้ยังไม่พร้อมอ่านเสียง คุณอ่านคำแนะนำบนจอได้', 'La voz no está disponible aquí. Puedes leer la guía en pantalla.'));
  };
  const navigate = (next: ScreenId) => {
    setScreen(next);
    stopSpeaking(); setSpeaking(false);
    if (next !== 'home' && next !== 'wallet') {
      setActivePillar(next);
      if (voiceEnabled) { setSpeaking(true); speakCalmly(guideText[language][next], language, () => setSpeaking(false)); }
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
    if (current.pendingSignature) { showWalletError('pending'); return; }
    const error = validateRequest(current, request);
    if (error) { showWalletError(error); return; }
    updateWallet({ ...current, pendingSignature: request });
    addTrace(trace);
    notify(w('Review the details, then approve when you are ready.', 'ตรวจสอบรายละเอียด แล้วยืนยันเมื่อพร้อม', 'Revisa los detalles y aprueba cuando estés listo.'));
  };
  const runAgent = async (kind: string, prompt: string, image?: string) => {
    if (stageSafeMode) return stageSafeAnswer(kind, language);
    const response = await fetch('/api/agent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, prompt, image, language, stageSafeMode: false }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json();
    if (!response.ok || typeof data.text !== 'string' || !data.text.trim()) throw new Error(w('The connected guide is unavailable. Turn on Offline practice in Preferences to keep exploring.', 'ไกด์ออนไลน์ยังไม่พร้อม เปิดทดลองแบบออฟไลน์ในการตั้งค่าเพื่อใช้งานต่อ', 'La guía conectada no está disponible. Activa Práctica sin conexión en Preferencias para continuar.'));
    return data.text as string;
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
        <Navbar language={language} experienceMode={experienceMode} screen={screen} onLanguageChange={(next) => { stopSpeaking(); setSpeaking(false); setLanguage(next); }} onExperienceModeChange={selectExperienceMode} onHelp={() => setGuideOpen(true)} onSettings={() => setPreferencesOpen(true)} onHome={() => navigate('home')} />
        <div className="product-layout">
          <div id="main-content" tabIndex={-1} className="product-content">
            {linkedMerchant && <section className="merchant-welcome"><span className="eyebrow">U-PAY</span><h2>{linkedMerchant}</h2><p>{w('Try a 450 THB practice payment. Review everything before you confirm.', 'ลองจ่ายตัวอย่าง 450 บาท ตรวจสอบทุกอย่างก่อนยืนยัน', 'Prueba un pago de 450 THB. Revisa todo antes de confirmar.')}</p><button className="button button-primary" onClick={() => {
              const request = signatureRequest('PAY_THB_BILL', 25, language); request.title = linkedMerchant;
              prepareSignature(request, makeTrace('profession', 'prepareMerchantQrPayment', { merchant: linkedMerchant, amountThb: 450 }, 'Prepared a demo payment from a generated merchant QR link.'));
            }}>{w('Try payment', 'ลองชำระเงิน', 'Probar pago')} →</button></section>}
            <div hidden={screen !== 'home'}><HomeDashboard mode={experienceMode} language={language} wallet={wallet} onNavigate={navigate} onTour={() => setGuideOpen(true)} /></div>
            <div hidden={screen === 'home' || screen === 'wallet'} className="task-workspace">
              <IkigaiSelector language={language} activePillar={activePillar} onSelect={navigate} />
              <div key={resetKey}>
                {pillarOrder.map((pillar) => <section key={pillar} id={`panel-${pillar}`} hidden={screen !== pillar} aria-label={screenLabel(pillar, language)} className="module-card">
                  {pillar === 'passion' && <PassionLegacyModule {...commonProps} />}
                  {pillar === 'vocation' && <VocationAcademyModule {...commonProps} academyXp={wallet.academyXp} completedCourses={wallet.completedCourses ?? []} onCompleteCourse={completeCourse} />}
                  {pillar === 'mission' && <MissionAmplifyModule {...commonProps} />}
                  {pillar === 'profession' && <ProfessionAgentPayModule {...commonProps} activeRules={wallet.activeRules ?? []} onToggleRule={toggleRule} />}
                </section>)}
              </div>
              <button className="task-voice text-button" aria-pressed={speaking} onClick={() => speak(guideText[language][activePillar])}><Icon name="speaker" size={18} />{speaking ? w('Stop guide', 'หยุดเสียงไกด์', 'Detener guía') : w('Listen to your calm guide', 'ฟังไกด์ที่ใจเย็น', 'Escucha a tu guía')}</button>
            </div>
            <div hidden={screen !== 'wallet'}><WalletPage wallet={wallet} language={language} onNavigate={navigate} onReceipt={setReceipt} /></div>
            <footer className="product-footer"><span>U-IKIGAI</span><p>{w('A little more balance. A lot more meaning.', 'สมดุลเพิ่มอีกนิด ความหมายเพิ่มอีกมาก', 'Un poco más de equilibrio. Mucho más propósito.')}</p><small>FLOW Summit Bangkok · 2026</small></footer>
          </div>
          {experienceMode === 'web' && <WalletCompanion wallet={wallet} language={language} onNavigate={navigate} onReceipt={setReceipt} activePillar={activePillar} onSpeak={speak} />}
        </div>
        {experienceMode === 'mobile' && <MobileNavigation screen={screen} language={language} onNavigate={navigate} />}
      </div>
      <PhoneSimulator wallet={wallet} language={language} experienceMode={experienceMode} onConfirm={confirmSignature} onCancel={cancelSignature} onNavigate={navigate} onReceipt={setReceipt} notify={notify} receipt={receipt} onCloseReceipt={() => setReceipt(null)} completed={completed} onCloseCompleted={() => setCompleted(null)} />
      <GuidedTour open={guideOpen} language={language} onClose={() => setGuideOpen(false)} onStart={() => { setGuideOpen(false); navigate('profession'); }} />
      <Preferences open={preferencesOpen} language={language} stageSafeMode={stageSafeMode} voiceEnabled={voiceEnabled} onLanguage={(next) => { stopSpeaking(); setSpeaking(false); setLanguage(next); }} onStageSafe={setStageSafeMode} onVoice={(next) => { stopSpeaking(); setSpeaking(false); setVoiceEnabled(next); }} onClose={() => setPreferencesOpen(false)} onMentor={() => { setPreferencesOpen(false); setMentorOpen(true); }} onReset={resetDemo} />
      <MentorDrawer open={mentorOpen} traces={traces} onClose={() => setMentorOpen(false)} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  </MotionConfig>;
}

