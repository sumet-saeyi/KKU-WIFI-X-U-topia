import { NextResponse } from 'next/server';
import { companionInstructions, companionSchema, parseCompanionInput, parseUBotCompanionReply, restrictCompanionPlan } from '@/lib/companion';
import { preparedCompanion } from '@/lib/presetData';
import { avalancheKnowledge, getUBotClient, isUBotConfigured, UBotError } from '@/lib/ubot';
import { isSameOriginRequest } from '@/lib/requestOrigin';
import { companionTextPreview, type CompanionStreamEvent } from '@/lib/companionStream';

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
    const client = getUBotClient();
    const question = {
      instructions: `${companionInstructions(input)}\n${avalancheKnowledge}\nReturn a single JSON object with no code fences matching this schema: ${JSON.stringify(companionSchema)}. Write the text property first, then followUps and plan.`,
      messages: input.messages.map((message) => ({ role: message.role, content: message.text })),
      ...(input.image ? { image: input.image } : {}), ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    };
    const complete = async (signal: AbortSignal, onText?: (text: string) => void) => {
      const text = await client.ask(question, signal, onText);
      const reply = parseUBotCompanionReply(text, input.context.screen);
      if (!reply) throw new Error('unsafe_output');
      // A photo is informational only, even if the model ignores its instructions.
      if (input.image) reply.plan = { kind: 'none' as const, screen: input.context.screen, amountUsd: null, title: '', why: '' };
      return { ...restrictCompanionPlan(reply, input), source: 'live' as const, provider: 'ubot' as const, latencyMs: Math.round(performance.now() - started) };
    };
    if (request.headers.get('accept')?.includes('application/x-ndjson')) {
      const cancelled = new AbortController();
      const signal = AbortSignal.any([request.signal, cancelled.signal]);
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const send = (event: CompanionStreamEvent) => { if (!signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); };
          send({ type: 'start', provider: 'ubot' });
          void (async () => {
            let previous = '';
            try {
              const result = await complete(signal, (raw) => {
                const preview = companionTextPreview(raw);
                if (preview.length > previous.length && preview.startsWith(previous)) {
                  send({ type: 'text', text: preview.slice(previous.length) }); previous = preview;
                }
              });
              send({ type: 'done', result });
            } catch (error) {
              send({ type: 'error', code: error instanceof UBotError ? error.code : error instanceof Error && error.message === 'unsafe_output' ? 'unsafe_output' : 'connection_error' });
            } finally { if (!cancelled.signal.aborted) controller.close(); }
          })();
        },
        cancel() { cancelled.abort(); },
      });
      return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no', 'X-Content-Type-Options': 'nosniff' } });
    }
    return NextResponse.json(await complete(request.signal), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = request.signal.aborted ? 'cancelled' : error instanceof UBotError ? error.code : error instanceof Error && error.message === 'unsafe_output' ? 'unsafe_output' : 'connection_error';
    return NextResponse.json({ code }, { status: code === 'connection_error' || code === 'cancelled' ? 504 : code === 'not_configured' ? 503 : 502 });
  }
}
