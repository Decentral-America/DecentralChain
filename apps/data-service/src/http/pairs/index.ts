import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { omit } from 'ramda';

import {
  type PairsService,
  type PairsServiceMgetRequest,
  type PairsServiceSearchRequest,
} from '../../services/pairs';
import { type AssetIdsPair, type Pair, type PairInfo, pair } from '../../types';
import { createHttpHandler } from '../_common';
import { postToGet } from '../_common/postToGet';
import {
  get as getSerializer,
  mget as mgetSerializer,
  search as serachSerializer,
} from '../_common/serialize';
import { type AppEnv } from '../_common/types';
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

export const isMgetRequest = (
  req: PairsServiceMgetRequest | PairsServiceSearchRequest,
): req is PairsServiceMgetRequest => 'pairs' in req && Array.isArray(req.pairs);

export const pairWithData = (p: (PairInfo & AssetIdsPair) | null): Pair =>
  p
    ? pair(omit(['amountAsset', 'priceAsset'], p), {
        amountAsset: p.amountAsset,
        priceAsset: p.priceAsset,
      })
    : pair(null, null);

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
              serachSerializer<PairInfo & AssetIdsPair, Pair, PairInfo>(pairWithData, lsnFormat),
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
