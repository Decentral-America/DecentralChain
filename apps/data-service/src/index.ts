import { serve } from '@hono/node-server';
import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';

import { createPgDriver } from './db';
import createEventBus from './eventBus/';
import router from './http';
import { type AppEnv } from './http/_common/types';
import { loadConfig } from './loadConfig';
import createAndSubscribeLogger from './logger';
import accessLogMiddleware from './middleware/accessLog';
import injectEventBus from './middleware/injectEventBus';
import createServices from './services';

export const WavesId: string = 'WAVES';

const options = loadConfig();
const eventBus = createEventBus();

createAndSubscribeLogger({ eventBus, options });

// @todo add the test sql query for the db availability checking
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
      app.use(cors());
      app.use(accessLogMiddleware);

      // Mount all routes after middleware is registered.
      app.route('/', router(services));

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
          console.info(`Server running on port ${info.port}`);
        }
      },
    );
    // Hono node-server manages keepAlive internally (defaults to 5s idle timeout)
  })
  .catch((e: unknown) => {
    console.error(e);
  });
