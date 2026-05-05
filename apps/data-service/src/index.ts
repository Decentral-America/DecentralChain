import { createServer } from 'node:http';
import { createRequire } from 'node:module';

import { Effect, pipe } from 'effect';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import createRequestId from 'koa-requestid';

import { createPgDriver } from './db';
import createEventBus from './eventBus/';
import router from './http';
import { loadConfig } from './loadConfig';
import createAndSubscribeLogger from './logger';
import accessLogMiddleware from './middleware/accessLog';
import injectConfig from './middleware/injectConfig';
import injectEventBus from './middleware/injectEventBus';
import createServices from './services';
import { unsafeKoaQs } from './utils/koaQs';

const _require = createRequire(import.meta.url);
const cors = _require('@koa/cors');

export const WavesId: string = 'WAVES';

const app = unsafeKoaQs(new Koa());

const options = loadConfig();

const eventBus = createEventBus();

createAndSubscribeLogger({ eventBus, options });
const requestId = createRequestId({ expose: 'X-Request-Id', header: 'X-Request-Id' });

// @todo add the test sql query for the db availability checking
const pgDriver = createPgDriver(options);

Effect.runPromise(
  pipe(
    createServices({
      emitEvent: (name) => (o) => eventBus.emit(name, o),
      options,
      pgDriver,
    }),
    Effect.map((services) =>
      app
        .use(bodyParser() as any)
        .use(requestId as any)
        .use(cors())
        .use(injectEventBus(eventBus))
        .use(accessLogMiddleware)
        .use(injectConfig('defaultMatcher', options.matcher.defaultMatcherAddress))
        .use(router(services).routes()),
    ),
  ),
)
  .then((app) => {
    const server = createServer(app.callback());
    // should be smaller than headersTimeout (by default, 40s)
    server.keepAliveTimeout = 30 * 1000;
    server.listen(options.port);

    if (process.env['NODE_ENV'] === 'development') {
    }
  })
  .catch((e: unknown) => {
    console.error(e);
  });
