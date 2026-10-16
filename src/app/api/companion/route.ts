import { NextResponse } from 'next/server';
import { companionInstructions, companionSchema, parseCompanionInput, parseUBotCompanionReply, restrictCompanionPlan } from '@/lib/companion';
import { preparedCompanion } from '@/lib/presetData';
import { avalancheKnowledge, getUBotClient, isUBotConfigured, UBotError } from '@/lib/ubot';
import { isSameOriginRequest } from '@/lib/requestOrigin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const started = performance.now();
  if (!isSameOriginRequest(request)) return NextResponse.json({ code: 'invalid_origin' }, { status: 403 });
  let raw: string;
  try { raw = await request.text(); } catch { return NextResponse.json({ code: 'invalid_input' }, { status: 400 }); }
  if (raw.length > 6_000_000) return NextResponse.json({ code: 'too_large' }, { status: 413 });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return NextResponse.json({ code: 'invalid_input' }, { status: 400 }); }
  const input = parseCompanionInput(value);
  if (!input) return NextResponse.json({ code: 'invalid_input' }, { status: 400 });
  if (input.stageSafeMode) {
    if (input.image) return NextResponse.json({ code: 'photo_needs_live' }, { status: 400 });
    return NextResponse.json({ ...restrictCompanionPlan(preparedCompanion(input), input), source: 'stage-safe', latencyMs: Math.round(performance.now() - started) });
  }
  if (!isUBotConfigured()) return NextResponse.json({ code: 'not_configured' }, { status: 503 });
  try {
    const text = await getUBotClient().ask({
      instructions: `${companionInstructions(input)}\n${avalancheKnowledge}\nReturn a single JSON object with no code fences matching this schema: ${JSON.stringify(companionSchema)}`,
      messages: input.messages.map((message) => ({ role: message.role, content: message.text })),
      ...(input.image ? { image: input.image } : {}), ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    }, request.signal);
    const reply = parseUBotCompanionReply(text, input.context.screen);
    if (!reply) return NextResponse.json({ code: 'unsafe_output' }, { status: 502 });
    // A photo is informational only, even if the model ignores its instructions.
    if (input.image) reply.plan = { kind: 'none', screen: input.context.screen, amountUsd: null, title: '', why: '' };
    return NextResponse.json({ ...restrictCompanionPlan(reply, input), source: 'live', provider: 'ubot', latencyMs: Math.round(performance.now() - started) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = request.signal.aborted ? 'cancelled' : error instanceof UBotError ? error.code : 'connection_error';
    return NextResponse.json({ code }, { status: code === 'connection_error' || code === 'cancelled' ? 504 : code === 'not_configured' ? 503 : 502 });
  }
}
