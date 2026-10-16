import { localeByLanguage } from './i18n';
import type { LanguageCode } from './types';

let speechSession = 0;
let speechRequest: AbortController | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl = '';

export interface SpeechOptions {
  connected?: boolean;
  onProvider?: (provider: 'browser' | 'elevenlabs', state: 'loading' | 'playing') => void;
  onFallback?: () => void;
}

export function speechChunks(text: string, maximum = 3500): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > maximum) {
    const slice = remaining.slice(0, maximum);
    const boundary = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '), slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
    let length = boundary > maximum / 2 ? boundary + 1 : maximum;
    if (/[\uD800-\uDBFF]/.test(remaining[length - 1])) length -= 1;
    chunks.push(remaining.slice(0, length).trim()); remaining = remaining.slice(length).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function disposeAudio() {
  if (currentAudio) { currentAudio.onended = null; currentAudio.onerror = null; currentAudio.pause(); currentAudio.removeAttribute('src'); currentAudio = null; }
  if (currentAudioUrl) { URL.revokeObjectURL(currentAudioUrl); currentAudioUrl = ''; }
}

export function speakCalmly(text: string, language: LanguageCode, onEnd?: () => void, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined' || !text.trim()) {
    onEnd?.();
    return false;
  }
  stopSpeaking();
  const session = speechSession;
  const active = () => session === speechSession;
  let finished = false;
  const finish = () => { if (active() && !finished) { finished = true; disposeAudio(); speechRequest = null; onEnd?.(); } };
  const deviceVoice = (content: string, fallback = false) => {
    if (!active()) return false;
    if (fallback) options.onFallback?.();
    options.onProvider?.('browser', 'playing');
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) { finish(); return false; }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = localeByLanguage[language];
    utterance.rate = 0.88; utterance.pitch = 1.02; utterance.volume = 0.95;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === utterance.lang) ?? voices.find((voice) => voice.lang.startsWith(language)) ?? null;
    utterance.onend = finish; utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    return true;
  };
  if (!options.connected) return deviceVoice(text);
  if (!('Audio' in window)) return deviceVoice(text, true);

  const controller = new AbortController(); speechRequest = controller;
  const chunks = speechChunks(text);
  void (async () => {
    for (let index = 0; index < chunks.length; index += 1) {
      if (!active()) return;
      try {
        options.onProvider?.('elevenlabs', 'loading');
        const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: chunks[index], language }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) throw new Error('speech_unavailable');
        const audio = await response.blob();
        if (!active()) return;
        if (!audio.size || audio.size > 8_000_000) throw new Error('invalid_audio');
        currentAudioUrl = URL.createObjectURL(audio);
        const player = new Audio(currentAudioUrl); currentAudio = player;
        await new Promise<void>((resolve, reject) => {
          const stop = () => { controller.signal.removeEventListener('abort', stop); reject(new Error('cancelled')); };
          player.onended = () => { controller.signal.removeEventListener('abort', stop); resolve(); };
          player.onerror = () => { controller.signal.removeEventListener('abort', stop); reject(new Error('audio_unavailable')); };
          controller.signal.addEventListener('abort', stop, { once: true });
          player.play().then(() => { if (active()) options.onProvider?.('elevenlabs', 'playing'); }).catch((error: unknown) => { controller.signal.removeEventListener('abort', stop); reject(error); });
        });
        if (!active()) return;
        disposeAudio();
      } catch {
        if (!active() || controller.signal.aborted) return;
        disposeAudio(); speechRequest = null;
        deviceVoice(chunks.slice(index).join(' '), true);
        return;
      }
    }
    finish();
  })();
  return true;
}

export function stopSpeaking() {
  speechSession += 1;
  speechRequest?.abort(); speechRequest = null;
  if (typeof window !== 'undefined') disposeAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
