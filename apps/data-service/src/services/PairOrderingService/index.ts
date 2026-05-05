import { createOrderPair, type TOrderPair } from '@decentralchain/assets-pairs-order';
import { Effect, Option, pipe } from 'effect';
import { map, zipObj } from 'ramda';
import { type InitError } from '../../errorHandling';
import { type AssetIdsPair } from '../../types';
import { loadMatcherSettings } from './loadMatcherSettings';

export interface PairOrderingService {
  isCorrectOrder(matcher: string, pair: AssetIdsPair): Option.Option<boolean>;
  getCorrectOrder(matcher: string, pair: [string, string]): Option.Option<AssetIdsPair>;
}

export class PairOrderingServiceImpl implements PairOrderingService {
  private orderPair: Record<string, TOrderPair>;

  constructor(matchersSettings: Record<string, string[]>) {
    this.orderPair = (map as any)(createOrderPair, matchersSettings) as Record<string, TOrderPair>;
  }

  public static create(
    matchersSettingsURLs: Record<string, string>,
  ): Effect.Effect<PairOrderingService, InitError> {
    const matcherAddresses = Object.keys(matchersSettingsURLs);
    const matcherSettingsTasks = matcherAddresses.map((ma) =>
      pipe(
        loadMatcherSettings(matchersSettingsURLs[ma] as string),
        Effect.map((s: { priceAssets: string[] }) => s.priceAssets),
      ),
    );

    return pipe(
      Effect.all(matcherSettingsTasks),
      Effect.map((settings) => zipObj(matcherAddresses, settings as any)),
      Effect.map((s) => new PairOrderingServiceImpl(s as any)),
    ) as Effect.Effect<PairOrderingService, InitError, never>;
  }

  getCorrectOrder(matcher: string, pair: [string, string]): Option.Option<AssetIdsPair> {
    if (!this.orderPair[matcher]) return Option.none();
    const correctOrder = this.orderPair[matcher]?.(pair[0] as string, pair[1] as string);
    return Option.some({
      amountAsset: correctOrder[0] as string,
      priceAsset: correctOrder[1] as string,
    });
  }

  public isCorrectOrder(matcher: string, pair: AssetIdsPair): Option.Option<boolean> {
    return Option.map(
      this.getCorrectOrder(matcher, [pair.amountAsset, pair.priceAsset]),
      (p) => p.amountAsset === pair.amountAsset,
    );
  }
}
