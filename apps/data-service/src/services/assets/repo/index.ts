import { type Asset } from '@decentralchain/data-entities';
import { of as taskOf } from 'folktale/concurrency/task';
import { of as just, type Maybe } from 'folktale/maybe';
import { Ok as ok } from 'folktale/result';
import { propEq } from 'ramda';
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
        return cache.get(req).matchWith({
          Just: ({ value }) => taskOf(just(value)),
          Nothing: () =>
            getByIdPg<AssetDbResponse, string>({
              name: SERVICE_NAME.GET,
              pg,
              sql: sql.get,
            })(req).map(tap((maybeResp) => forEach((x) => cache.set(req, x), maybeResp))),
        });
      },
      transformInput: ok,
      transformResult: (res) => res.map(transformDbResponse),
      validateResult: validateResult(resultSchema, SERVICE_NAME.GET),
    }),

    mget: createMgetResolver<AssetsMgetRequest, AssetsMgetRequest, AssetDbResponse, Asset>({
      emitEvent,
      getData: (request) => {
        const results: Array<Maybe<AssetDbResponse>> = request.map((x) => cache.get(x));

        const notCachedIndexes = results.reduce<number[]>((acc, x, i) => {
          if (isEmpty(x)) acc.push(i);
          return acc;
        }, []);

        const notCachedAssetIdIndexes: Record<string, number[]> = {};
        notCachedIndexes.forEach((i) => {
          if (Array.isArray(notCachedAssetIdIndexes[request[i]])) {
            notCachedAssetIdIndexes[request[i]].push(i);
          } else {
            notCachedAssetIdIndexes[request[i]] = [i];
          }
        });

        return mgetByIdsPg<AssetDbResponse, string>({
          matchRequestResult: propEq('asset_id'),
          name: SERVICE_NAME.MGET,
          pg,
          sql: sql.mget,
        })(Object.keys(notCachedAssetIdIndexes)).map((fromDb) => {
          fromDb.forEach((assetInfo) =>
            forEach((value) => {
              Object.values(notCachedAssetIdIndexes[value.asset_id]).forEach((idx) => {
                results[idx] = assetInfo;
              });
              cache.set(value.asset_id, value);
            }, assetInfo),
          );
          return results;
        });
      },
      transformInput: ok,
      transformResult: transformMgetResults<string[], AssetDbResponse, AssetInfo>(
        transformDbResponse,
      ),
      validateResult: validateResult(resultSchema, SERVICE_NAME.MGET),
    }),

    search: searchPreset<Cursor, AssetsSearchRequest, AssetDbResponse, AssetInfo>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: SERVICE_NAME.SEARCH,
      resultSchema,
      sql: sql.search,
      transformResult: transformDbResponse,
    })({
      emitEvent,
      pg,
    }),
  };
};
