import { NextResponse } from 'next/server';
import { ElevenLabsClient, ElevenLabsError } from '@elevenlabs/elevenlabs-js';
import type { LanguageCode } from '@/lib/types';
import { isSameOriginRequest } from '@/lib/requestOrigin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ELEVENLABS_API_KEY), provider: 'elevenlabs', offlineProvider: 'device' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ code: 'invalid_origin' }, { status: 403 });
  let input: { text?: unknown; language?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 30_000) return NextResponse.json({ code: 'too_large' }, { status: 413 });
    input = JSON.parse(raw);
  } catch { return NextResponse.json({ code: 'invalid_input' }, { status: 400 }); }
  if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 4000 || !['en', 'th', 'es'].includes(String(input.language))) return NextResponse.json({ code: 'invalid_input' }, { status: 400 });
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return NextResponse.json({ code: 'not_configured' }, { status: 503 });
  const language = input.language as LanguageCode;
  const voice = process.env[`ELEVENLABS_VOICE_ID_${language.toUpperCase()}`]?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim() || 'JBFqnCBsd6RMkjVDRZzb';
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(voice)) return NextResponse.json({ code: 'voice_not_configured' }, { status: 503 });
  const configuredModel = process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_v3';
  const modelId = language === 'th' && ['eleven_multilingual_v2', 'eleven_flash_v2_5', 'eleven_turbo_v2_5'].includes(configuredModel) ? 'eleven_v3' : configuredModel;
  try {
    const elevenlabs = new ElevenLabsClient({ apiKey: key, maxRetries: 0, timeoutInSeconds: 30, fetch: (url, options) => fetch(url, { ...options, redirect: 'error', cache: 'no-store' }) });
    const { data: audio, rawResponse } = await elevenlabs.textToSpeech.convert(voice, {
      text: input.text.trim(), modelId, outputFormat: 'mp3_44100_128',
      ...(modelId === 'eleven_multilingual_v2' ? {} : { languageCode: language }),
      voiceSettings: { stability: 0.5, similarityBoost: 0.75, speed: 0.9 },
    }, { abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]) }).withRawResponse();
    if (!audio || !rawResponse.headers.get('content-type')?.startsWith('audio/')) { await audio?.cancel(); return NextResponse.json({ code: 'invalid_audio' }, { status: 502 }); }
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Speech-Provider': 'elevenlabs' } });
  } catch (error) {
    if (request.signal.aborted) return NextResponse.json({ code: 'cancelled' }, { status: 504 });
    if (error instanceof ElevenLabsError) {
      const body = error.body as { detail?: { status?: unknown } } | undefined;
      const status = body?.detail?.status;
      const code = status === 'quota_exceeded' ? 'quota_exceeded'
        : status === 'voice_not_found' || error.statusCode === 404 ? 'voice_not_configured'
          : error.statusCode === 401 || error.statusCode === 403 ? 'auth_failed'
            : error.statusCode === 429 ? 'busy' : 'speech_unavailable';
      return NextResponse.json({ code }, { status: 502 });
    }
    return NextResponse.json({ code: 'speech_unavailable' }, { status: 504 });
  }
}
