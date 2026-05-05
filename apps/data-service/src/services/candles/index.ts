import { Effect, pipe } from 'effect';
import { type AppError } from '../../errorHandling';
import { type AssetIdsPair, type CandleInfo, type SearchedItems, type Service } from '../../types';
import { searchWithDecimalsProcessing } from '../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../assets';
import { MoneyFormat, type WithMoneyFormat } from '../types';
import { modifyDecimals } from './modifyDecimals';
import { type CandlesRepo, type CandlesSearchRequest } from './repo';

export type CandlesServiceSearchRequest = CandlesSearchRequest & WithMoneyFormat;
export type CandlesService = {
  search: Service<CandlesServiceSearchRequest, SearchedItems<CandleInfo>>;
  searchLast: Service<CandlesServiceSearchRequest, CandleInfo | null>;
};

export default (
  repo: CandlesRepo,
  validatePairs: (matcher: string, pairs: AssetIdsPair[]) => Effect.Effect<void, AppError>,
  assetsService: AssetsService,
): CandlesService => ({
  search: (req) =>
    pipe(
      validatePairs(req.matcher, [{ amountAsset: req.amountAsset, priceAsset: req.priceAsset }]),
      Effect.flatMap(() =>
        searchWithDecimalsProcessing<CandlesServiceSearchRequest, CandleInfo>(
          modifyDecimals(assetsService, [req.amountAsset, req.priceAsset]),
          repo.search,
        )(req),
      ),
      Effect.map((result) => ({
        ...result,
        items:
          req.moneyFormat === MoneyFormat.Long
            ? result.items.map((candle) => ({
                ...candle,
                weightedAveragePrice:
                  candle.txsCount > 0
                    ? candle.weightedAveragePrice.decimalPlaces(0)
                    : candle.weightedAveragePrice,
              }))
            : result.items,
      })),
    ),

  searchLast: (req) =>
    pipe(
      validatePairs(req.matcher, [{ amountAsset: req.amountAsset, priceAsset: req.priceAsset }]),
      Effect.flatMap(() =>
        searchWithDecimalsProcessing<CandlesServiceSearchRequest, CandleInfo>(
          modifyDecimals(assetsService, [req.amountAsset, req.priceAsset]),
          repo.searchLast,
        )(req),
      ),
      Effect.map((result) =>
        result && Array.isArray(result.items) && result.items[0]
          ? {
              ...result.items[0],
              weightedAveragePrice:
                result.items[0].txsCount > 0
                  ? result.items[0].weightedAveragePrice.decimalPlaces(0)
                  : result.items[0].weightedAveragePrice,
            }
          : null,
      ),
    ),
});
