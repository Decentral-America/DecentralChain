/**
 * app-factory.ts
 *
 * Builds a lightweight Hono app wired with mocked services for HTTP-level
 * unit tests. No real database or network is required.
 *
 * Usage:
 *   import { buildApp, mockServices, mockPgDriver } from '../test/app-factory'
 *   const app = buildApp()
 *   const res = await app.request('/health')
 */

import { Effect, Option } from 'effect';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { type PgDriver } from '../db/driver';
import router from '../http';
import { type AppEnv } from '../http/_common/types';
import injectEventBus from '../middleware/injectEventBus';
import { type ServiceMesh } from '../services';
import { type AliasesService } from '../services/aliases';
import { type AssetsService } from '../services/assets';
import { type CandlesService } from '../services/candles';
import { type PairsService } from '../services/pairs';

// ---------------------------------------------------------------------------
// No-op event bus — swallows all events
// ---------------------------------------------------------------------------
export const noopEventBus = {
  emit: (_name: string, _data: unknown): undefined => undefined,
};

// ---------------------------------------------------------------------------
// Mock PgDriver — always succeeds with an empty result
// ---------------------------------------------------------------------------
export const mockPgDriver: PgDriver = {
  any: <T>(_q: string) => Effect.succeed([] as T[]),
  many: <T>(_q: string) => Effect.succeed([] as T[]),
  none: (_q) => Effect.succeed(null),
  one: <T>(_q: string) => Effect.succeed({} as T),
  oneOrNone: <T>(_q: string) => Effect.succeed(null as T | null),
  task: <T>(_cb: any) => Effect.succeed({} as T),
  tx: <T>(_cb: any) => Effect.succeed({} as T),
};

/** A PgDriver whose `none` (ping) fails — used for 503 readiness tests */
export const failingPgDriver: PgDriver = {
  ...mockPgDriver,
  none: (_q) =>
    Effect.fail({
      _tag: 'DbError',
      error: new Error('connection refused'),
      matchWith: (pattern: any) => pattern.Db({ error: new Error('connection refused'), meta: {} }),
    } as any),
};

// ---------------------------------------------------------------------------
// Empty search result helper
// ---------------------------------------------------------------------------
const emptySearch = <T>(): Effect.Effect<
  { items: T[]; isLastPage: boolean; lastCursor?: string },
  any
> => Effect.succeed({ isLastPage: true, items: [] as T[] });

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

export const mockAliasesService: AliasesService = {
  get: (_req) => Effect.succeed(Option.none()),
  mget: (_req) => Effect.succeed([]),
  search: (_req) => emptySearch(),
};

export const mockAssetsService: AssetsService = {
  get: (_req) => Effect.succeed(Option.none()),
  mget: (_req) => Effect.succeed([]),
  precisions: (_req) => Effect.succeed([]),
  search: (_req) => emptySearch(),
};

const mockCandlesService: CandlesService = {
  search: (_req) => emptySearch(),
  searchLast: (_req) => Effect.succeed(null),
};

const mockPairsService: PairsService = {
  get: (_req) => Effect.succeed(Option.none()),
  mget: (_req) => Effect.succeed([]),
  search: (_req) => emptySearch(),
};

const mockTxService = () => ({
  get: (_req: any) => Effect.succeed(Option.none()),
  mget: (_req: any) => Effect.succeed([]),
  search: (_req: any) => emptySearch(),
});

export const mockServices: ServiceMesh = {
  aliases: mockAliasesService,
  assets: mockAssetsService,
  candles: mockCandlesService,
  matchers: {
    candles: mockCandlesService,
    pairs: mockPairsService,
    rates: {
      mget: (_req: any) => emptySearch(),
    } as any,
  },
  pairs: mockPairsService,
  transactions: {
    alias: mockTxService() as any,
    all: mockTxService() as any,
    burn: mockTxService() as any,
    data: mockTxService() as any,
    ethereumLike: mockTxService() as any,
    exchange: mockTxService() as any,
    genesis: mockTxService() as any,
    invokeScript: mockTxService() as any,
    issue: mockTxService() as any,
    lease: mockTxService() as any,
    leaseCancel: mockTxService() as any,
    massTransfer: mockTxService() as any,
    payment: mockTxService() as any,
    reissue: mockTxService() as any,
    setAssetScript: mockTxService() as any,
    setScript: mockTxService() as any,
    sponsorship: mockTxService() as any,
    transfer: mockTxService() as any,
    updateAssetInfo: mockTxService() as any,
  },
};

// ---------------------------------------------------------------------------
// buildApp — creates a full Hono app with middleware + routes, zero DB
// ---------------------------------------------------------------------------
export function buildApp(
  services: ServiceMesh = mockServices,
  pgDriver: PgDriver = mockPgDriver,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(injectEventBus(noopEventBus));
  app.use(secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
  app.use(cors({ origin: '*' }));

  // Mount routes at both /v0 and / (matches production setup)
  app.route('/v0', router(services, pgDriver));
  app.route('/', router(services, pgDriver));

  return app;
}
