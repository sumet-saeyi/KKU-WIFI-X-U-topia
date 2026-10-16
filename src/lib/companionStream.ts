import { parseCompanionReply, type CompanionResult } from './companion';

export type CompanionStreamEvent =
  | { type: 'start'; provider: 'ubot' }
  | { type: 'text'; text: string }
  | { type: 'done'; result: CompanionResult & { provider: 'ubot' } }
  | { type: 'error'; code: string };

/** Decode only a JSON string. An unfinished escape is held until the next chunk. */
function jsonString(input: string, start: number): { text: string; end: number; complete: boolean } | null {
  let text = '';
  for (let index = start + 1; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') return { text, end: index + 1, complete: true };
    if (char.charCodeAt(0) < 32) return null;
    if (char !== '\\') { text += char; continue; }
    const escape = input[++index];
    if (!escape) break;
    if (escape === 'u') {
      const hex = input.slice(index + 1, index + 5);
      if (!/^[0-9a-f]{0,4}$/i.test(hex)) return null;
      if (hex.length < 4) break;
      text += String.fromCharCode(Number.parseInt(hex, 16)); index += 4;
    } else {
      const escapes: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
      if (!(escape in escapes)) return null;
      text += escapes[escape];
    }
  }
  return { text: text.replace(/[\uD800-\uDBFF]$/, ''), end: input.length, complete: false };
}

/** A provisional explanation only: never stream raw JSON, follow-ups or a plan. */
export function companionTextPreview(raw: string): string {
  const text = raw.trimStart().replace(/^```(?:json)?\s*/i, '');
  if (!text || text.startsWith('`') || text.startsWith('[')) return '';
  if (!text.startsWith('{')) return text.slice(0, 6000).trimEnd();
  let depth = 1; let keyExpected = true;
  for (let index = 1; index < text.length; index += 1) {
    const char = text[index];
    if (/\s/.test(char)) continue;
    if (depth === 1 && keyExpected) {
      if (char !== '"') return '';
      const key = jsonString(text, index);
      if (!key?.complete) return '';
      index = key.end;
      while (/\s/.test(text[index] ?? '') && index < text.length) index += 1;
      if (text[index] !== ':') return '';
      index += 1;
      while (/\s/.test(text[index] ?? '') && index < text.length) index += 1;
      if (key.text === 'text') return text[index] === '"' ? (jsonString(text, index)?.text ?? '').slice(0, 6000) : '';
      keyExpected = false; index -= 1; continue;
    }
    if (char === '"') {
      const string = jsonString(text, index);
      if (!string?.complete) return '';
      index = string.end - 1;
    } else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') { depth -= 1; if (depth < 1) return ''; }
    else if (char === ',' && depth === 1) keyExpected = true;
  }
  return '';
}

const errorCodes = new Set(['not_configured', 'auth_failed', 'busy', 'upstream_error', 'connection_error', 'empty_response', 'incomplete', 'unsafe_output', 'cancelled', 'invalid_origin']);
const safeCode = (code: unknown) => typeof code === 'string' && errorCodes.has(code) ? code : 'connection_error';

/** Complete JSON remains supported. Stream text is provisional until a validated done event. */
export async function readCompanionResponse(response: Response, onPreview: (text: string) => void, signal?: AbortSignal): Promise<CompanionResult> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(safeCode(body?.code));
  }
  if (!response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const data = await response.json();
    const reply = parseCompanionReply(data);
    if (!reply || data.source !== 'live') throw new Error('unsafe_output');
    return { ...reply, source: 'live', latencyMs: 0 };
  }
  if (!response.body) throw new Error('incomplete');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ''; let preview = ''; let bytes = 0; let started = false;
  let result: CompanionResult | null = null;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const accept = (line: string) => {
    if (!line.trim()) return;
    let event: CompanionStreamEvent;
    try { event = JSON.parse(line); } catch { throw new Error('unsafe_output'); }
    if (!event || typeof event !== 'object' || result) throw new Error('unsafe_output');
    if (event.type === 'error') throw new Error(safeCode(event.code));
    if (event.type === 'start') {
      if (started || event.provider !== 'ubot') throw new Error('unsafe_output');
      started = true; return;
    }
    if (!started) throw new Error('unsafe_output');
    if (event.type === 'text') {
      if (typeof event.text !== 'string' || !event.text || preview.length + event.text.length > 6000) throw new Error('unsafe_output');
      preview += event.text; onPreview(preview); return;
    }
    if (event.type !== 'done') throw new Error('unsafe_output');
    const reply = parseCompanionReply(event.result);
    if (!reply || event.result.source !== 'live' || event.result.provider !== 'ubot' || !Number.isFinite(event.result.latencyMs) || event.result.latencyMs < 0 || (preview && reply.text !== preview.trim())) throw new Error('unsafe_output');
    result = { ...reply, source: 'live', latencyMs: event.result.latencyMs };
  };
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 256_000) throw new Error('unsafe_output');
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf('\n')) >= 0) { accept(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 1); }
      if (buffer.length > 40_000) throw new Error('unsafe_output');
    }
    buffer += decoder.decode();
    if (buffer.trim()) accept(buffer);
    if (!result) throw new Error('incomplete');
    return result;
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
