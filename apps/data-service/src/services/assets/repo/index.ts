import { type Asset } from '@decentralchain/data-entities';
import { Effect, Either, Option, pipe } from 'effect';
import { type DbError, type Timeout } from '../../../errorHandling';
import { type AssetInfo } from '../../../types';
import { forEach, isEmpty } from '../../../utils/fp/maybeOps';
import { tap } from '../../../utils/tap';
import { type CommonRepoDependencies } from '../..';
// resolver creation and presets
import { get as createGetResolver, mget as createMgetResolver } from '../../_common/createResolver';
import { getData as getByIdPg } from '../../_common/presets/pg/getById/pg';
import { getData as mgetByIdsPg } from '../../_common/presets/pg/mgetByIds/pg';
import { transformResults as transformMgetResults } from '../../_common/presets/pg/mgetByIds/transformResult';
import { searchPreset } from '../../_common/presets/pg/search';
import { validateResult } from '../../_common/presets/validation';
import { type Cursor, deserialize, serialize } from './cursor';
// validation
import { result as resultSchema } from './schema';
import * as sql from './sql';
import { transformDbResponse } from './transformAsset';
import {
  type AssetDbResponse,
  type AssetsCache,
  type AssetsGetRequest,
  type AssetsMgetRequest,
  type AssetsRepo,
  type AssetsSearchRequest,
} from './types';

export { create as createCache } from './cache';

export default ({
  drivers: { pg },
  emitEvent,
  cache,
}: CommonRepoDependencies & {
  cache: AssetsCache;
}): AssetsRepo => {
  const SERVICE_NAME = {
    GET: 'assets.get',
    MGET: 'assets.mget',
    SEARCH: 'assets.search',
  };

  return {
    get: createGetResolver<AssetsGetRequest, AssetsGetRequest, AssetDbResponse, Asset>({
      emitEvent,
      getData: (req) => {
        const cached = cache.get(req);
        if (Option.isSome(cached)) {
          return Effect.succeed(Option.some(cached.value));
        }
        return pipe(
          getByIdPg<AssetDbResponse, string>({
            name: SERVICE_NAME.GET,
            pg,
            sql: sql.get,
          })(req),
          Effect.map(tap((maybeResp) => forEach((x) => cache.set(req, x), maybeResp))),
        );
      },
      transformInput: (r) => Either.right(r) as any,
      transformResult: (res) => Option.map(res, transformDbResponse),
      validateResult: validateResult(resultSchema, SERVICE_NAME.GET) as any,
    }),

    mget: createMgetResolver<AssetsMgetRequest, AssetsMgetRequest, AssetDbResponse, Asset>({
      emitEvent,
      getData: (request) => {
        const results: Array<Option.Option<AssetDbResponse>> = request.map((x) => cache.get(x));

        const notCachedIndexes = results.reduce<number[]>((acc, x, i) => {
          if (isEmpty(x)) acc.push(i);
          return acc;
        }, []);

        const notCachedAssetIdIndexes: Record<string, number[]> = {};
        notCachedIndexes.forEach((i) => {
          if (Array.isArray(notCachedAssetIdIndexes[request[i] as string])) {
            (notCachedAssetIdIndexes[request[i] as string] as number[]).push(i);
          } else {
            notCachedAssetIdIndexes[request[i] as string] = [i];
          }
        });

        return pipe(
          (mgetByIdsPg as any)({
            matchRequestResult: (req: string, res: any) => res.asset_id === req,
            name: SERVICE_NAME.MGET,
            pg,
            sql: sql.mget,
          })(Object.keys(notCachedAssetIdIndexes)) as Effect.Effect<
            Option.Option<AssetDbResponse>[],
            DbError | Timeout,
            never
          >,
          Effect.map((fromDb: Option.Option<AssetDbResponse>[]) => {
            fromDb.forEach((assetInfo: Option.Option<AssetDbResponse>) => {
              forEach((value: AssetDbResponse) => {
                Object.values(notCachedAssetIdIndexes[value.asset_id] as number[]).forEach(
                  (idx) => {
                    results[idx] = assetInfo;
                  },
                );
                cache.set(value.asset_id, value);
              }, assetInfo as any);
            });
            return results;
          }),
        );
      },
      transformInput: (r) => Either.right(r) as any,
      transformResult: transformMgetResults<string[], AssetDbResponse, AssetInfo>(
        transformDbResponse,
      ) as any,
      validateResult: validateResult(resultSchema, SERVICE_NAME.MGET) as any,
    }),

    search: searchPreset<Cursor, AssetsSearchRequest, AssetDbResponse, AssetInfo>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: SERVICE_NAME.SEARCH,
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformDbResponse,
    })({
      emitEvent,
      pg,
    }),
  };
};
