import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { type AppLoadContext, type EntryContext, ServerRouter } from 'react-router';
import { isUsingDefaultSecret } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Startup checks — run once when the server process starts.
if (isUsingDefaultSecret()) {
  logger.warn(
    'NODE_DASHBOARD_JWT_SECRET is not set or uses the default — set a strong random secret before deploying',
  );
}
if (
  !process.env.NODE_DASHBOARD_GITHUB_OAUTH_CLIENT_ID ||
  !process.env.NODE_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET
) {
  logger.warn(
    'NODE_DASHBOARD_GITHUB_OAUTH_CLIENT_ID or NODE_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET not set — GitHub OAuth will not work',
  );
}

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
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
          if (shellRendered) logger.error({ err: error }, 'SSR render error');
        },
        onShellError(error: unknown) {
          reject(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
