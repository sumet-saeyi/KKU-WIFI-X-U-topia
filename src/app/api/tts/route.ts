import { NextResponse } from 'next/server';
import type { LanguageCode } from '@/lib/types';
import { isSameOriginRequest } from '@/lib/requestOrigin';

export const runtime = 'nodejs';

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
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/stream?output_format=mp3_44100_128`, {
      method: 'POST', redirect: 'error', cache: 'no-store', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: input.text.trim(), model_id: process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_v3', language_code: language, voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.9 } }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) return NextResponse.json({ code: response.status === 429 ? 'busy' : 'speech_unavailable' }, { status: 502 });
    if (!response.body || !response.headers.get('content-type')?.startsWith('audio/')) return NextResponse.json({ code: 'invalid_audio' }, { status: 502 });
    return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Speech-Provider': 'elevenlabs' } });
  } catch { return NextResponse.json({ code: request.signal.aborted ? 'cancelled' : 'speech_unavailable' }, { status: 504 }); }
}
