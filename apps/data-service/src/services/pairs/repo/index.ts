import { of as taskOf } from 'folktale/concurrency/task';
import { of as justOf } from 'folktale/maybe';
import { Ok as ok } from 'folktale/result';
import { type AssetIdsPair, type CacheSync, type PairInfo } from '../../../types';
import { forEach, isEmpty } from '../../../utils/fp/maybeOps';
import { tap } from '../../../utils/tap';
import { type CommonRepoDependencies } from '../..';

// resolver creation and presets
import { get as createGetResolver, mget as createMgetResolver } from '../../_common/createResolver';
import { getData as getByIdPg } from '../../_common/presets/pg/getById/pg';
import { searchPreset } from '../../_common/presets/pg/search';
import { validateResult } from '../../_common/presets/validation';

// service logic
export { create as createCache } from './cache';

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
    getData: (req) =>
      cache.get(req).matchWith({
        Just: ({ value }) => taskOf(justOf(value)),
        Nothing: () =>
          getByIdPg<PairDbResponse, PairsGetRequest>({
            name: SERVICE_NAME.GET,
            pg: drivers.pg,
            sql: sql.get,
          })(req).map(tap((maybeResp) => forEach((x) => cache.set(req, x), maybeResp))),
      }),
    transformInput: ok,
    transformResult: (res) => res.map(transformResult),
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

      const notCachedPairs = notCachedIndexes.map((i) => request.pairs[i]);

      return mgetPairsPg({
        matchRequestResult,
        name: SERVICE_NAME.MGET,
        pg: drivers.pg,
        sql: sql.mget,
      })({
        matcher: request.matcher,
        pairs: notCachedPairs,
      }).map((pairsFromDb) => {
        pairsFromDb.forEach((pair, index) =>
          forEach((p) => {
            results[notCachedIndexes[index]] = pair;
            cache.set(
              {
                matcher: request.matcher,
                pair: notCachedPairs[index],
              },
              p,
            );
          }, pair),
        );
        return results;
      });
    },
    transformInput: ok,
    transformResult: (res) => res.map((m, i) => m.map(transformResult)),
    validateResult: validateResult(resultSchema, SERVICE_NAME.MGET),
  });

  const search = searchPreset<Cursor, PairsSearchRequest, PairDbResponse, PairInfo & AssetIdsPair>({
    cursorSerialization: {
      deserialize,
      serialize,
    },
    name: SERVICE_NAME.SEARCH,
    resultSchema,
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
