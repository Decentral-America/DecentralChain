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
import { createRateLimiter } from './middleware/rateLimiter';
import createServices from './services';

export const WavesId: string = 'DCC';

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
      // rate limiting is not configured. 120 req/min (2 req/s average) is
      // generous for normal browser wallet/dapp polling; pathological scrapers
      // will be capped. Responses include standard RateLimit headers.
      // NOTE: in-process storage — not shared across replicas. For multi-replica
      // deployments, replace createRateLimiter with a Redis-backed store.
      app.use(createRateLimiter({ max: 120, windowMs: 60_000 }));

      // Abort handlers that take longer than 30 s — prevents slow DB queries
      // from holding connections open indefinitely.
      app.use(timeout(30_000));

      // Limit POST body size to 100 KB — sufficient for alias/asset mget
      // batches and guards against request-body DoS.
      app.use(bodyLimit({ maxSize: 100 * 1024 }));

      app.use(accessLogMiddleware);

      // Mount all routes after middleware is registered.
      app.route('/', router(services, pgDriver));

      return app;
    }),
  ),
)
  .then((app) => {
    serve(
      {
        fetch: app.fetch,
        port: options.port,
      },
      (info) => {
        if (process.env['NODE_ENV'] === 'development') {
          logger.info(`Server running on port ${info.port}`);
        }
      },
    );
    // Hono node-server manages keepAlive internally (defaults to 5s idle timeout)
  })
  .catch((e: unknown) => {
    logger.error(
      { error: e instanceof Error ? { message: e.message, stack: e.stack } : String(e) },
      'Server startup failed',
    );
  });
