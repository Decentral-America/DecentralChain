/**
 * not-found.http.spec.ts
 *
 * "Not found" must be a 404 through the real resolvers and with the production
 * logger subscribed (the logger used to throw on the error path and turn the
 * response into a 500).
 */

import { EventEmitter } from 'node:events';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import createAndSubscribeLogger from '../logger';
import { type ServiceMesh } from '../services';
import createAssetsService from '../services/assets';
import createAssetsRepo, { createCache as createAssetsCache } from '../services/assets/repo';
import createPairsService from '../services/pairs';
import createPairsRepo, { createCache as createPairsCache } from '../services/pairs/repo';
import { buildApp, mockPgDriver, mockServices } from '../test/app-factory';

const realLoggerBus = (): EventEmitter => {
  const bus = new EventEmitter();
  createAndSubscribeLogger({ eventBus: bus, options: { logLevel: 'silent' } });
  return bus;
};

const commonDeps = {
  drivers: { pg: mockPgDriver },
  emitEvent: () => () => undefined,
};

const realAssets = () =>
  createAssetsService(createAssetsRepo({ ...commonDeps, cache: createAssetsCache(10, 60_000) }));

const realPairs = () =>
  createPairsService(
    createPairsRepo({ ...commonDeps, cache: createPairsCache(10, 5_000) }),
    () => Effect.succeed(undefined),
    mockServices.assets,
  );

describe('not found, real resolvers, production logger', () => {
  it('GET /v0/assets/:id → 404 for a well-formed id that does not exist', async () => {
    const services: ServiceMesh = { ...mockServices, assets: realAssets() };
    const app = buildApp(services, mockPgDriver, realLoggerBus());
    const res = await app.request('/v0/assets/4LHHvYGNKJUg5hj65aGD5vgScvCBmLpdRFtjokvCjSL8');
    expect(res.status).toBe(404);
  });

  it('GET /v0/pairs/:amountAsset/:priceAsset → 404 for a pair that does not exist', async () => {
    const services: ServiceMesh = { ...mockServices, pairs: realPairs() };
    const app = buildApp(services, mockPgDriver, realLoggerBus());
    const res = await app.request(
      '/v0/pairs/4LHHvYGNKJUg5hj65aGD5vgScvCBmLpdRFtjokvCjSL8/DCC?matcher=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr',
    );
    expect(res.status).toBe(404);
  });
});
