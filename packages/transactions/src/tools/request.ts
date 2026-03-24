/**
 * Self-contained HTTP client for matcher API calls (submitOrder / cancelSubmittedOrder).
 *
 * Extracted from @decentralchain/node-api-js to break the phantom L2→L2 dependency:
 * `transactions` (builder package) no longer depends on `node-api-js` (service package)
 * at runtime.  The implementation is intentionally kept identical to the source in
 * node-api-js/src/tools/{request,resolve,parse}.ts — security properties are preserved:
 *  - SSRF protection via resolveUrl() (validates protocol, strips absolute-URL injection)
 *  - 30-second timeout via AbortSignal.timeout()
 *  - Large-integer safe JSON parsing via parseSafe()
 */

// ---------------------------------------------------------------------------
// URL resolution — prevents SSRF by treating `path` as always relative
// ---------------------------------------------------------------------------

function resolveUrl(path: string, base: string): string {
  // Strip any leading protocol or double-slash so `path` can never override `base`
  const safePath = path.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '').replace(/^\/\//, '');
  const normalised = safePath.startsWith('/') ? safePath : `/${safePath}`;
  const resolved = new URL(normalised, base);

  const isLocalhost =
    resolved.hostname === 'localhost' ||
    resolved.hostname === '127.0.0.1' ||
    resolved.hostname === '::1';

  if (resolved.protocol !== 'https:' && !isLocalhost) {
    throw new Error(
      `Insecure protocol "${resolved.protocol}" is not allowed. Use HTTPS for all remote connections.`,
    );
  }

  return resolved.toString();
}

// ---------------------------------------------------------------------------
// Safe JSON parse — preserves 64-bit integers as strings
// ---------------------------------------------------------------------------

const keyedReg = /("\w+"):\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})(?=\s*[,}\]])/g;
const bareReg = /(?<=[[,])\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})(?=\s*[,\]])/g;

function parseSafe(json: string): unknown {
  return JSON.parse(
    json
      .replace(keyedReg, '$1:"$2"')
      .replace(bareReg, (match, num: string) => match.replace(num, `"${num}"`)),
  ) as unknown;
}

// ---------------------------------------------------------------------------
// HTTP request
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;

interface RequestParams {
  url: string;
  base: string;
  options?: RequestInit | undefined;
}

interface MatcherApiError extends Error {
  data: unknown;
  status: number;
}

function parseResponse<T>(r: Response): Promise<T> {
  return r.text().then((message) => {
    if (r.ok) return parseSafe(message) as T;
    const parsed = (() => {
      try {
        return JSON.parse(message) as unknown;
      } catch (_e) {
        return message;
      }
    })();
    const err = new Error(
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `HTTP ${String(r.status)}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`,
    );
    (err as MatcherApiError).data = parsed;
    (err as MatcherApiError).status = r.status;
    return Promise.reject(err);
  });
}

export function matcherRequest<T>(params: RequestParams): Promise<T> {
  const opts: RequestInit = params.options ?? {};
  const withTimeout: RequestInit = opts.signal
    ? opts
    : { ...opts, signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) };

  return fetch(resolveUrl(params.url, params.base), withTimeout).then(
    parseResponse<T>,
  ) as Promise<T>;
}
