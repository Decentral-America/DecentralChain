import { Effect, type Option, pipe } from 'effect';
import { type AppError } from '../../errorHandling';
import { type AssetIdsPair, type PairInfo, type SearchedItems, type Service } from '../../types';
import {
  getWithDecimalsProcessing,
  mgetWithDecimalsProcessing,
  searchWithDecimalsProcessing,
} from '../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../assets';
import { type WithMoneyFormat } from '../types';
import { modifyDecimals } from './modifyDecimals';
import {
  type PairsGetRequest,
  type PairsMgetRequest,
  type PairsRepo,
  type PairsSearchRequest,
} from './repo/types';

export type PairsServiceMgetRequest = PairsMgetRequest;
export type PairsServiceSearchRequest = PairsSearchRequest;
export type PairsService = {
  get: Service<PairsGetRequest & WithMoneyFormat, Option.Option<PairInfo & AssetIdsPair>>;
  mget: Service<
    PairsServiceMgetRequest & WithMoneyFormat,
    Option.Option<PairInfo & AssetIdsPair>[]
  >;
  search: Service<PairsSearchRequest & WithMoneyFormat, SearchedItems<PairInfo & AssetIdsPair>>;
};

export default (
  repo: PairsRepo,
  validatePairs: (matcher: string, pairs: AssetIdsPair[]) => Effect.Effect<void, AppError>,
  assetsService: AssetsService,
): PairsService => ({
  get: (req) =>
    pipe(
      validatePairs(req.matcher, [req.pair]),
      Effect.flatMap(() =>
        getWithDecimalsProcessing<PairsGetRequest & WithMoneyFormat, PairInfo & AssetIdsPair>(
          modifyDecimals(assetsService),
          repo.get,
        )(req),
      ),
    ),
  mget: (req) =>
    pipe(
      validatePairs(req.matcher, req.pairs),
      Effect.flatMap(() =>
        mgetWithDecimalsProcessing<
          PairsServiceMgetRequest & WithMoneyFormat,
          PairInfo & AssetIdsPair
        >(
          modifyDecimals(assetsService),
          repo.mget,
        )(req),
      ),
    ),
  search: (req) =>
    searchWithDecimalsProcessing<PairsSearchRequest & WithMoneyFormat, PairInfo & AssetIdsPair>(
      modifyDecimals(assetsService),
      repo.search,
    )(req),
});
