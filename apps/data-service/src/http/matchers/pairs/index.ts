import Router from '@koa/router';
import { Effect, pipe } from 'effect';

import { type PairsService } from '../../../services/pairs';
import { type AssetIdsPair, type Pair, type PairInfo } from '../../../types';
import { createHttpHandler } from '../../_common';
import { postToGet } from '../../_common/postToGet';
import {
  get as getSerializer,
  mget as mgetSerializer,
  search as searchSerializer,
} from '../../_common/serialize';
import { isMgetRequest, pairWithData } from '../../pairs';
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

const subrouter = new Router();

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

export default (pairsService: PairsService) =>
  subrouter
    .get(
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
    )
    .get('/pairs', mgetOrSearchHttpHandler(pairsService))
    .post('/pairs', postToGet(mgetOrSearchHttpHandler(pairsService)));
