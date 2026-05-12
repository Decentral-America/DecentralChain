import { Effect, pipe } from 'effect';
import { defaultTo, zipObj } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type ExchangeTx, OrderPriceMode, OrderType } from './repo/types';

const wavesByDefault = defaultTo('DCC');

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: ExchangeTx[]): Effect.Effect<ExchangeTx[], AppError> => {
    // extract unique assetIds participating in provided transactions
    const participatingAssetIds = Array.from(
      txs.reduce(
        (assetIds, tx) =>
          [
            tx.feeAsset,
            tx.order1.assetPair.amountAsset,
            tx.order1.assetPair.priceAsset,
            tx.order1.matcherFeeAssetId,
            tx.order2.matcherFeeAssetId,
          ]
            .map(wavesByDefault)
            .reduce((set, id) => set.add(id), assetIds),
        new Set<string>(),
      ),
    );

    return pipe(
      assetsService.precisions({ ids: participatingAssetIds }),
      Effect.map(zipObj(participatingAssetIds)),
      Effect.map((precisionsMap) => {
        const p = (assetId: string | null | undefined): number =>
          precisionsMap[wavesByDefault(assetId)] ?? 0;

        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex decimal processing for exchange transactions
        return txs.map((tx) => {
          const feePrecision = p(tx.feeAsset);

          const amountAssetPrecision = p(tx.order1.assetPair.amountAsset);
          const priceAssetPrecision = p(tx.order1.assetPair.priceAsset);

          // exchange v3 support
          const txPricePrecision =
            !tx.version || tx.version < 3 ? 8 + priceAssetPrecision - amountAssetPrecision : 8;

          const order1MatcherFeePrecision = p(tx.order1.matcherFeeAssetId);
          // order v4 price mode support
          const order1PricePrecision =
            tx.order1.version < 4 || tx.order1.priceMode === OrderPriceMode.AssetDecimals
              ? 8 + priceAssetPrecision - amountAssetPrecision
              : 8;

          const order2MatcherFeePrecision = p(tx.order2.matcherFeeAssetId);
          // order v4 price mode support
          const order2PricePrecision =
            tx.order2.version < 4 || tx.order2.priceMode === OrderPriceMode.AssetDecimals
              ? 8 + priceAssetPrecision - amountAssetPrecision
              : 8;

          const buyMatcherFeePrecision =
            tx.order1.orderType === OrderType.Buy
              ? order1MatcherFeePrecision
              : order2MatcherFeePrecision;

          const sellMatcherFeePrecision =
            tx.order1.orderType === OrderType.Sell
              ? order1MatcherFeePrecision
              : order2MatcherFeePrecision;

          return {
            ...tx,
            amount: tx.amount.shiftedBy(-amountAssetPrecision),
            buyMatcherFee: tx.buyMatcherFee.shiftedBy(-buyMatcherFeePrecision),
            fee: tx.fee.shiftedBy(-feePrecision),
            order1: {
              ...tx.order1,
              amount: tx.order1.amount.shiftedBy(-amountAssetPrecision),
              matcherFee: tx.order1.matcherFee.shiftedBy(-order1MatcherFeePrecision),
              price: tx.order1.price.shiftedBy(-order1PricePrecision),
            },
            order2: {
              ...tx.order2,
              amount: tx.order2.amount.shiftedBy(-amountAssetPrecision),
              matcherFee: tx.order2.matcherFee.shiftedBy(-order2MatcherFeePrecision),
              price: tx.order2.price.shiftedBy(-order2PricePrecision),
            },
            price: tx.price.shiftedBy(-txPricePrecision),
            sellMatcherFee: tx.sellMatcherFee.shiftedBy(-sellMatcherFeePrecision),
          };
        });
      }),
    );
  };
