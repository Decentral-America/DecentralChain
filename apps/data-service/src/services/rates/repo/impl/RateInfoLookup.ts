import { type Asset, BigNumber } from '@decentralchain/data-entities';
import { Option, pipe } from 'effect';
import { path } from 'ramda';
import { MoneyFormat } from '../../../../services/types';
import { type CacheSync } from '../../../../types';
import { isDefined, map2 } from '../../../../utils/fp/optionOps';
import { createPairHasBaseAsset, flip } from '../../data';
import { type AssetPair, type RateWithPair, type VolumeAwareRateInfo } from '../../RateEstimator';
import { inv, invOnSatoshi, safeDivide } from '../../util';

type RateLookupTable = {
  [amountAsset: string]: { [priceAsset: string]: VolumeAwareRateInfo };
};

type AssetPairWithMoneyFormat = AssetPair & { moneyFormat: MoneyFormat };

export default class RateInfoLookup
  implements Omit<CacheSync<AssetPairWithMoneyFormat, RateWithPair>, 'set'>
{
  private readonly lookupTable: RateLookupTable;
  private readonly mPairAcceptanceVolumeThreshold: Option.Option<BigNumber>;
  private readonly baseAsset: Asset;

  constructor(
    data: Array<VolumeAwareRateInfo>,
    mPairAcceptanceVolumeThreshold: Option.Option<BigNumber>,
    baseAsset: Asset,
  ) {
    this.mPairAcceptanceVolumeThreshold = mPairAcceptanceVolumeThreshold;
    this.baseAsset = baseAsset;
    this.lookupTable = this.toLookupTable(data);
  }

  has(pairWithMoneyFormat: AssetPairWithMoneyFormat): boolean {
    return isDefined(this.get(pairWithMoneyFormat));
  }

  get(pairWithMoneyFormat: AssetPairWithMoneyFormat): Option.Option<VolumeAwareRateInfo> {
    const pairHasBaseAsset = createPairHasBaseAsset(this.baseAsset.id);
    const lookup = (pair: AssetPair, flipped: boolean) =>
      this.getFromLookupTable(pair, flipped, pairWithMoneyFormat.moneyFormat);

    if (pairHasBaseAsset(pairWithMoneyFormat)) {
      return Option.orElse(lookup(pairWithMoneyFormat, false), () =>
        lookup(pairWithMoneyFormat, true),
      );
    }

    const baseAssetPaired = this.lookupThroughBaseAsset(this.baseAsset, pairWithMoneyFormat);
    const hasPairWithBaseAsset = Option.isSome(baseAssetPaired);

    return pipe(
      Option.orElse(lookup(pairWithMoneyFormat, false), () => lookup(pairWithMoneyFormat, true)),
      Option.filter(
        (val) =>
          (val.volumeWaves !== null &&
            Option.match(this.mPairAcceptanceVolumeThreshold, {
              onNone: () => false,
              onSome: (threshold) => val.volumeWaves.gte(threshold),
            })) ||
          !hasPairWithBaseAsset,
      ),
      (filtered) => Option.orElse(filtered, () => baseAssetPaired),
    );
  }

  private toLookupTable(data: Array<VolumeAwareRateInfo>): RateLookupTable {
    return data.reduce<RateLookupTable>((acc, item) => {
      acc[item.amountAsset.id] = acc[item.amountAsset.id] ?? {};
      (acc[item.amountAsset.id] as Record<string, VolumeAwareRateInfo>)[item.priceAsset.id] = item;
      return acc;
    }, {});
  }

  private getFromLookupTable(
    pair: AssetPair,
    flipped: boolean,
    moneyFormat: MoneyFormat,
  ): Option.Option<VolumeAwareRateInfo> {
    const lookupData = flipped ? flip(pair) : pair;
    const foundValue = Option.fromNullable(
      path([lookupData.amountAsset.id, lookupData.priceAsset.id], this.lookupTable) as
        | VolumeAwareRateInfo
        | null
        | undefined,
    );

    return Option.map(foundValue, (data) => {
      if (flipped) {
        const flippedData = flip({ ...data });
        if (moneyFormat === MoneyFormat.Long) {
          flippedData.rate = pipe(
            invOnSatoshi(flippedData.rate, 8),
            Option.map((r) => r.shiftedBy(8)),
            Option.getOrElse(() => new BigNumber(0)),
          );
        } else {
          flippedData.rate = Option.getOrElse(inv(flippedData.rate), () => new BigNumber(0));
        }
        return flippedData;
      } else {
        return data;
      }
    });
  }

  private lookupThroughBaseAsset(
    baseAsset: Asset,
    pair: AssetPairWithMoneyFormat,
  ): Option.Option<VolumeAwareRateInfo> {
    return map2<VolumeAwareRateInfo, VolumeAwareRateInfo, VolumeAwareRateInfo>(
      (info1, info2) => ({
        ...pair,
        rate: pipe(
          safeDivide(info1.rate, info2.rate),
          Option.map((r) =>
            pair.moneyFormat === MoneyFormat.Long ? r.shiftedBy(8).decimalPlaces(0) : r,
          ),
          Option.getOrElse(() => new BigNumber(0)),
        ),
        volumeWaves: BigNumber.max(info1.volumeWaves, info2.volumeWaves),
      }),
      this.get({
        amountAsset: pair.amountAsset,
        moneyFormat: pair.moneyFormat,
        priceAsset: baseAsset,
      }),
      this.get({
        amountAsset: pair.priceAsset,
        moneyFormat: pair.moneyFormat,
        priceAsset: baseAsset,
      }),
    );
  }
}
