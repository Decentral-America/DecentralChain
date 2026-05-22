import { Effect, Either, Option, pipe } from 'effect';
import { type AssetIdsPair, type CacheSync, type PairInfo } from '../../../types';
import { forEach, isEmpty } from '../../../utils/fp/maybeOps';
import { tap } from '../../../utils/tap';
import { type CommonRepoDependencies } from '../..';
// resolver creation and presets
import { get as createGetResolver, mget as createMgetResolver } from '../../_common/createResolver';
import { getData as getByIdPg } from '../../_common/presets/pg/getById/pg';
import { searchPreset } from '../../_common/presets/pg/search';
import { validateResult } from '../../_common/presets/validation';
import { type Cursor, deserialize, serialize } from './cursor';
import { matchRequestResult } from './matchRequestResult';
import { mgetPairsPg } from './mgetPairsPg';
import { result as resultSchema } from './schema';
import * as sql from './sql';
import { type PairDbResponse, transformResult } from './transformResult';
import {
  type PairsGetRequest,
  type PairsMgetRequest,
  type PairsRepo,
  type PairsSearchRequest,
} from './types';

// service logic
export { create as createCache } from './cache';

export default ({
  drivers,
  emitEvent,
  cache,
}: CommonRepoDependencies & {
  cache: CacheSync<PairsGetRequest, PairDbResponse>;
}): PairsRepo => {
  const SERVICE_NAME = {
    GET: 'pairs.get',
    MGET: 'pairs.mget',
    SEARCH: 'pairs.search',
  };

  const get = createGetResolver<
    PairsGetRequest,
    PairsGetRequest,
    PairDbResponse,
    PairInfo & AssetIdsPair
  >({
    emitEvent,

    // cache first
    getData: (req) => {
      const cached = cache.get(req);
      if (Option.isSome(cached)) {
        return Effect.succeed(Option.some(cached.value));
      }
      return pipe(
        getByIdPg<PairDbResponse, PairsGetRequest>({
          name: SERVICE_NAME.GET,
          pg: drivers.pg,
          sql: sql.get,
        })(req),
        Effect.map(tap((maybeResp) => forEach((x) => cache.set(req, x), maybeResp))),
      );
    },
    transformInput: (r) => Either.right(r),
    transformResult: (res) => Option.map(res, transformResult),
    validateResult: validateResult(resultSchema, SERVICE_NAME.GET),
  });

  const mget = createMgetResolver<
    PairsMgetRequest,
    PairsMgetRequest,
    PairDbResponse,
    PairInfo & AssetIdsPair
  >({
    emitEvent,
    getData: (request) => {
      const results = request.pairs.map((p) =>
        cache.get({
          matcher: request.matcher,
          pair: p,
        }),
      );

      const notCachedIndexes = results.reduce<number[]>((acc, x, i) => {
        if (isEmpty(x)) acc.push(i);
        return acc;
      }, []);

      const notCachedPairs = notCachedIndexes.map((i) => request.pairs[i]) as AssetIdsPair[];

      return pipe(
        mgetPairsPg({
          matchRequestResult,
          name: SERVICE_NAME.MGET,
          pg: drivers.pg,
          sql: sql.mget,
        })({
          matcher: request.matcher,
          pairs: notCachedPairs,
        }),
        Effect.map((pairsFromDb) => {
          pairsFromDb.forEach((pair, index) => {
            forEach((p) => {
              results[notCachedIndexes[index] as number] = pair;
              cache.set(
                {
                  matcher: request.matcher,
                  pair: notCachedPairs[index] as AssetIdsPair,
                },
                p,
              );
            }, pair);
          });
          return results;
        }),
      );
    },
    transformInput: (r) => Either.right(r),
    transformResult: (res) => res.map((m) => Option.map(m, transformResult)),
    validateResult: validateResult(resultSchema, SERVICE_NAME.MGET),
  });

  const search = searchPreset<Cursor, PairsSearchRequest, PairDbResponse, PairInfo & AssetIdsPair>({
    cursorSerialization: {
      deserialize,
      serialize,
    },
    name: SERVICE_NAME.SEARCH,
    resultSchema: resultSchema,
    sql: sql.search,
    transformResult,
  })({
    emitEvent,
    pg: drivers.pg,
  });

  return {
    get,
    mget,
    search,
  };
};
