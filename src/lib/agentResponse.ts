export function extractResponseText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const response = data as { output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
  if (!Array.isArray(response.output)) return '';
  return response.output.filter((item) => item.type === 'message' && Array.isArray(item.content))
    .flatMap((item) => item.content ?? []).filter((item) => item.type === 'output_text' && typeof item.text === 'string').map((item) => item.text).join('\n').trim();
}
