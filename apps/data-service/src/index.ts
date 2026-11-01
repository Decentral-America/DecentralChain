import { serve } from '@hono/node-server';
import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';

import { createPgDriver } from './db';
import createEventBus from './eventBus/';
import router from './http';
import { type AppEnv } from './http/_common/types';
import { loadConfig } from './loadConfig';
import createAndSubscribeLogger from './logger';
import accessLogMiddleware from './middleware/accessLog';
import injectEventBus from './middleware/injectEventBus';
import { createRateLimiter, DEFAULT_MAX_REQUESTS } from './middleware/rateLimiter';
import createServices from './services';
import { installGracefulShutdown } from './shutdown';

export const DccId: string = 'DCC';

const options = loadConfig();
const eventBus = createEventBus();

const logger = createAndSubscribeLogger({ eventBus, options });

const pgDriver = createPgDriver(options);

Effect.runPromise(
  pipe(
    createServices({
      emitEvent: (name) => (o) => eventBus.emit(name, o),
      options,
      pgDriver,
    }),
    Effect.map((services) => {
      const app = new Hono<AppEnv>();

      // Middleware MUST be registered before routes in Hono — registration
      // order is execution order. All handlers need eventBus, requestId, etc.
      app.use(requestId());
      app.use(injectEventBus(eventBus));

      // Security response headers — defense-in-depth for browser and proxy
      // clients. crossOriginResourcePolicy is set to 'cross-origin' because
      // this is a public read API with cors() allowing all origins.
      app.use(
        secureHeaders({
          crossOriginResourcePolicy: 'cross-origin',
        }),
      );

      // Wide-open CORS is intentional: this is a public read-only blockchain
      // data API consumed by third-party dapps and browsers.
      app.use(cors({ origin: '*' }));

      // Per-IP rate limiting — defense-in-depth against request floods.
      // Primary protection is the Caddy reverse proxy (infra layer), but an
      // app-layer limit caps damage from a single abusive IP even if Caddy's
      // rate limiting is not configured. The limit (300 req/min per real client
      // IP) matches Caddy's ds_per_ip zone, so this limiter never rejects traffic the
      // edge would have allowed; pathological scrapers are still capped. Responses include standard RateLimit headers.
      // NOTE: in-process storage — not shared across replicas. For multi-replica
      // deployments, replace createRateLimiter with a Redis-backed store.
      app.use(createRateLimiter({ max: DEFAULT_MAX_REQUESTS, windowMs: 60_000 }));

      // Abort handlers that take longer than 30 s — prevents slow DB queries
      // from holding connections open indefinitely.
      app.use(timeout(30_000));

      // Limit POST body size to 100 KB — sufficient for alias/asset mget
      // batches and guards against request-body DoS.
      app.use(bodyLimit({ maxSize: 100 * 1024 }));

      app.use(accessLogMiddleware);

      // Mount all routes after middleware is registered.
      // Data routes are served at /v0/* (matches public API URLs and consumer
      // expectations from exchange, scanner, and docs). Health/readiness/root
      // are also mounted at / for infrastructure probes (Docker, Caddy).
      app.route('/v0', router(services, pgDriver));
      app.route('/', router(services, pgDriver));

      return app;
    }),
  ),
)
  .then((app) => {
    const server = serve(
      {
        fetch: app.fetch,
        // BIND_ADDR (optional) restricts the listener, e.g. 127.0.0.1 behind a reverse proxy.
        hostname: process.env['BIND_ADDR'] || '0.0.0.0',
        port: options.port,
      },
      (info) => {
        if (process.env['NODE_ENV'] === 'development') {
          logger.info(`Server running on port ${info.port}`);
        }
      },
    );
    // Node is PID 1 in the container: without a handler, SIGTERM is ignored and
    // `docker stop` SIGKILLs after 10 s, dropping in-flight requests.
    installGracefulShutdown({
      closeResources: () => pgDriver.close(),
      exit: (code) => {
        // pino writes synchronously to stdout by default; flush covers async transports.
        logger.flush();
        process.exit(code);
      },
      graceMs: 8_000,
      log: (message, meta) => logger.info(meta ?? {}, message),
      onSignal: (signal, handler) => {
        process.once(signal, handler);
      },
      server,
    });
  })
  .catch((e: unknown) => {
    logger.error(
      { error: e instanceof Error ? { message: e.message, stack: e.stack } : String(e) },
      'Server startup failed',
    );
  });
