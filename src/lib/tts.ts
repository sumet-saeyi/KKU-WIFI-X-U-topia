import { localeByLanguage } from './i18n';
import type { LanguageCode } from './types';

let speechSession = 0;

export function speakCalmly(text: string, language: LanguageCode, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return false;
  }

  const session = ++speechSession;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = localeByLanguage[language];
  utterance.rate = 0.88;
  utterance.pitch = 1.02;
  utterance.volume = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.find((voice) => voice.lang === utterance.lang);
  const family = voices.find((voice) => voice.lang.startsWith(language));
  utterance.voice = exact ?? family ?? null;
  utterance.onend = () => { if (session === speechSession) onEnd?.(); };
  utterance.onerror = () => { if (session === speechSession) onEnd?.(); };
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  speechSession += 1;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
