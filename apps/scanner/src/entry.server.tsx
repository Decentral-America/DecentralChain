import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { type EntryContext, type RouterContextProvider, ServerRouter } from 'react-router';
import { logError } from '@/lib/error-logger';
import { classifyServerError, describeRequest } from '@/lib/server-error';
import { isMainnet } from '@/lib/site';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get('user-agent');
    const readyEvent = isbot(userAgent ?? '') ? 'onAllReady' : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyEvent]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
          responseHeaders.set('X-Content-Type-Options', 'nosniff');
          responseHeaders.set('X-Frame-Options', 'DENY');
          responseHeaders.set('X-XSS-Protection', '0');
          responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          responseHeaders.set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          );
          responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          responseHeaders.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          );
          if (!isMainnet()) responseHeaders.set('X-Robots-Tag', 'noindex, nofollow');
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) logError(error, { context: 'ssr_shell_render' });
        },
        onShellError(error: unknown) {
          reject(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

/**
 * React Router calls this for every server-side error. Unmatched URLs and wrong
 * methods (scanner probes) are one info line; everything else keeps the stack.
 */
export function handleError(error: unknown, { request }: { request: Request }): void {
  const level = classifyServerError(error, request.signal.aborted);
  if (level === 'ignore') return;
  if (level === 'info') {
    // biome-ignore lint/suspicious/noConsole: 404/405 probes are logged at info by design.
    console.info(`[route] ${describeRequest(error, request)}`);
    return;
  }
  logError(error, { context: 'ssr_handle_error', path: new URL(request.url).pathname });
}
