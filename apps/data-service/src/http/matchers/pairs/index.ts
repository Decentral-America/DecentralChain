import { Effect, pipe } from 'effect';
import { Hono } from 'hono';

import { type PairsService } from '../../../services/pairs';
import { type AssetIdsPair, type Pair, type PairInfo } from '../../../types';
import { createHttpHandler } from '../../_common';
import { postToGet } from '../../_common/postToGet';
import {
  get as getSerializer,
  mget as mgetSerializer,
  search as searchSerializer,
} from '../../_common/serialize';
import { type AppEnv } from '../../_common/types';
import { isMgetRequest, pairWithData } from '../../pairs';
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

const mgetOrSearchHttpHandler = (pairsService: PairsService) =>
  createHttpHandler(
    (req, lsnFormat) =>
      isMgetRequest(req)
        ? pipe(
            pairsService.mget(req),
            Effect.map(
              mgetSerializer<PairInfo & AssetIdsPair, Pair, PairInfo>(pairWithData, lsnFormat),
            ),
          )
        : pipe(
            pairsService.search(req),
            Effect.map(
              searchSerializer<PairInfo & AssetIdsPair, Pair, PairInfo>(pairWithData, lsnFormat),
            ),
          ),
    parseMgetOrSearch,
  );

export default (pairsService: PairsService) => {
  const app = new Hono<AppEnv>();
  app.get(
    '/pairs/:amountAsset/:priceAsset',
    createHttpHandler(
      (req, lsnFormat) =>
        pipe(
          pairsService.get(req),
          Effect.map(
            getSerializer<PairInfo & AssetIdsPair, Pair, PairInfo>(pairWithData, lsnFormat),
          ),
        ),
      parseGet,
    ),
  );
  app.get('/pairs', mgetOrSearchHttpHandler(pairsService));
  app.post('/pairs', postToGet(mgetOrSearchHttpHandler(pairsService)));
  return app;
};
