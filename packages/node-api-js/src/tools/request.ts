import parse from './parse';
import resolve from './resolve';

/** Default request timeout in milliseconds (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Makes an HTTP request to the DecentralChain node API.
 * Uses the native fetch API (available in Node.js 22+).
 *
 * Security:
 *  - Enforces a request timeout to prevent hanging connections / resource exhaustion.
 *  - Delegates URL resolution to `resolve()` which validates protocol and prevents SSRF.
 *
 * @param params - Request parameters including URL, base URL, and fetch options
 * @returns Parsed response data
 */
export default function <T>(params: IRequestParams<T>): Promise<T> {
  const options = addTimeout(updateHeaders(params.options));

  return fetch(resolve(params.url, params.base), options).then(parseResponse) as Promise<T>;
}

function parseResponse<T>(r: Response): Promise<T> {
  return r.text().then((message) => {
    if (r.ok) return parse(message) as T;
    const parsed = tryParse(message);
    const err = new Error(
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `HTTP ${String(r.status)}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`,
    );
    (err as NodeApiError).data = parsed;
    (err as NodeApiError).status = r.status;
    return Promise.reject(err);
  });
}

function tryParse(message: string): unknown {
  try {
    return JSON.parse(message) as unknown;
  } catch (_e) {
    return message;
  }
}

function updateHeaders(options: RequestInit = Object.create(null) as RequestInit): RequestInit {
  return { ...options };
}

/**
 * Attach an `AbortSignal` with a timeout to the request options,
 * unless the caller already provided their own signal.
 */
function addTimeout(options: RequestInit): RequestInit {
  if (options.signal) return options; // respect caller-provided signal

  return {
    ...options,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  };
}

/** Error returned by the DecentralChain node API. */
interface NodeApiError extends Error {
  /** Parsed response body (JSON object or raw string). */
  data: unknown;
  /** HTTP status code. */
  status: number;
}

/** Parameters for an API request. */
interface IRequestParams<_T> {
  url: string;
  base: string;
  options?: RequestInit | undefined;
}
