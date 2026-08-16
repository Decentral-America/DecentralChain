import { randomBytes } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { type EntryContext, type RouterContextProvider, ServerRouter } from 'react-router';
import { isUsingDefaultSecret } from '@/lib/auth';
import { migrateSchema } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runtimeConfig } from './root';

// Startup checks and migrations — run once when the server process starts.
void migrateSchema();

if (isUsingDefaultSecret()) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      'ADMIN_DASHBOARD_JWT_SECRET is not set or uses the default dev value — refusing to start in production. Set a strong random secret via the ADMIN_DASHBOARD_JWT_SECRET environment variable.',
    );
    process.exit(1);
  }
  logger.warn(
    'ADMIN_DASHBOARD_JWT_SECRET is not set or uses the default — set a strong random secret before deploying',
  );
}
if (
  !process.env.ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID ||
  !process.env.ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET
) {
  logger.warn(
    'ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID or ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET not set — GitHub OAuth will not work',
  );
}

const ABORT_DELAY = 5_000;

/** Extracts just the origin (scheme + host) for a CSP source value; '' if unset/invalid. */
function safeOrigin(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

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
    // React Router's own hydration bootstrap (theme init, scroll restoration,
    // the __reactRouterContext stream, the entry.client module import) renders
    // as inline <script> tags — required framework output, not app code. A
    // strict `script-src 'self'` with no nonce/unsafe-inline blocks React
    // Router's own scripts along with everything else, breaking hydration on
    // every page. The nonce here and in the CSP header below must match.
    const nonce = randomBytes(16).toString('base64');

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
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

          // Several pages fetch external services directly from the browser rather
          // than through a server-side proxy: ChainHealth/GeneratorPerformance hit
          // the configured node URL, Operations hits npm's registry + Codecov's API,
          // and Operations also embeds Grafana in an iframe. connect-src/frame-src
          // must list these or the requests are silently blocked — derived from the
          // same runtimeConfig() the app itself uses, so it stays correct across
          // networks (testnet/mainnet) instead of hardcoding one environment's hosts.
          const { nodeUrl, grafanaUrl } = runtimeConfig();
          const connectSrc = [
            "'self'",
            safeOrigin(nodeUrl),
            'https://registry.npmjs.org',
            'https://codecov.io',
          ]
            .filter(Boolean)
            .join(' ');
          const frameSrc = safeOrigin(grafanaUrl);

          // 'unsafe-inline' on style-src is a pragmatic starting point (component libraries commonly
          // set inline style attributes) — tighten with nonces/hashes later if that surface matters.
          responseHeaders.set(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              `script-src 'self' 'nonce-${nonce}'`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              `connect-src ${connectSrc}`,
              frameSrc ? `frame-src ${frameSrc}` : "frame-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          );
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
