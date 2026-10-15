import { NextResponse } from 'next/server';
import { stageSafeAnswer } from '@/lib/presetData';
import { extractResponseText } from '@/lib/agentResponse';
import type { LanguageCode } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const started = performance.now();
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 6_000_000) return NextResponse.json({ error: 'Photo or request is too large.' }, { status: 413 });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch { return NextResponse.json({ error: 'Send a valid JSON object.' }, { status: 400 }); }
  if (body.language !== undefined && !['en', 'th', 'es'].includes(body.language as string)) return NextResponse.json({ error: 'Choose en, th, or es.' }, { status: 400 });
  if (body.stageSafeMode !== undefined && typeof body.stageSafeMode !== 'boolean') return NextResponse.json({ error: 'stageSafeMode must be a boolean.' }, { status: 400 });
  if (body.prompt !== undefined && (typeof body.prompt !== 'string' || body.prompt.length > 6000)) return NextResponse.json({ error: 'Prompt must be text under 6,000 characters.' }, { status: 400 });
  if (body.kind !== undefined && (typeof body.kind !== 'string' || body.kind.length > 60)) return NextResponse.json({ error: 'Invalid task type.' }, { status: 400 });
  const language = (body.language ?? 'en') as LanguageCode;
  const kind = (body.kind ?? 'coach') as string;
  if (body.stageSafeMode !== false) return NextResponse.json({ text: stageSafeAnswer(kind, language), latencyMs: Math.round(performance.now() - started), source: 'stage-safe' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Live AI needs OPENAI_API_KEY. Stage-Safe works without a key.', code: 'not_configured' }, { status: 503 });
  const image = body.image;
  if (image !== undefined && (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 5_700_000)) return NextResponse.json({ error: 'Use a JPG, PNG, or WebP photo under 4 MB.' }, { status: 400 });
  try {
    const input = image ? [{ role: 'user', content: [{ type: 'input_text', text: body.prompt || 'Describe this photo.' }, { type: 'input_image', image_url: image, detail: 'auto' }] }] : body.prompt || stageSafeAnswer(kind, language);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', store: false, max_output_tokens: 1600,
        instructions: `You are U-Ikigai, a calm practical money companion. Reply in ${language === 'th' ? 'Thai' : language === 'es' ? 'Mexican Spanish' : 'English'}. Use warm everyday language and short paragraphs. Never promise investment returns or legal compliance, and do not claim to execute payments. Task: ${kind}. For vision, describe only what is visible and state uncertainty. For community captions remove return guarantees while preserving useful meaning. Keep responses below 200 words.`, input }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return NextResponse.json({ error: 'The live guide is unavailable. Use Stage-Safe to continue.', code: 'upstream_error' }, { status: 502 });
    const text = extractResponseText(await response.json());
    if (!text) return NextResponse.json({ error: 'The live guide returned no text. Please try again.', code: 'empty_response' }, { status: 502 });
    return NextResponse.json({ text, latencyMs: Math.round(performance.now() - started), source: 'live' });
  } catch { return NextResponse.json({ error: 'The live guide could not connect. Use Stage-Safe to continue.', code: 'connection_error' }, { status: 504 }); }
}
