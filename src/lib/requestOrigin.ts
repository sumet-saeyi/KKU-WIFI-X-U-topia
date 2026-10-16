/** Accept a matching origin, with a narrow loopback alias allowance for Next's local URL canonicalization. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const supplied = new URL(origin);
    const expected = new URL(request.url);
    if (supplied.origin !== origin) return false;
    if (origin === expected.origin) return true;
    const loopbacks = new Set(['localhost', '127.0.0.1', '[::1]']);
    return loopbacks.has(expected.hostname) && loopbacks.has(supplied.hostname)
      && supplied.host === request.headers.get('host') && supplied.port === expected.port && supplied.protocol === expected.protocol;
  } catch { return false; }
}
