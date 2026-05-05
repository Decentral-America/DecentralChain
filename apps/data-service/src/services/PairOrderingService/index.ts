import { createOrderPair, type TOrderPair } from '@decentralchain/assets-pairs-order';
import { type Task, waitAll } from 'folktale/concurrency/task';
import { of as just, type Maybe, empty as nothing } from 'folktale/maybe';
import { map, zipObj } from 'ramda';
import { type InitError } from '../../errorHandling';
import { type AssetIdsPair } from '../../types';
import { loadMatcherSettings } from './loadMatcherSettings';

export interface PairOrderingService {
  isCorrectOrder(matcher: string, pair: AssetIdsPair): Maybe<boolean>;

  getCorrectOrder(matcher: string, pair: [string, string]): Maybe<AssetIdsPair>;
}

export class PairOrderingServiceImpl implements PairOrderingService {
  private orderPair: Record<string, TOrderPair>;

  constructor(matchersSettings: Record<string, string[]>) {
    this.orderPair = map(createOrderPair, matchersSettings);
  }

  public static create(
    matchersSettingsURLs: Record<string, string>,
  ): Task<InitError, PairOrderingService> {
    const matcherAddresses = Object.keys(matchersSettingsURLs);

    const matcherSettingsTasks = matcherAddresses.map((ma) =>
      loadMatcherSettings(matchersSettingsURLs[ma]).map((s) => s.priceAssets),
    );

    return waitAll(matcherSettingsTasks)
      .map((settings) => zipObj(matcherAddresses, settings))
      .map((s) => new PairOrderingServiceImpl(s));
  }

  getCorrectOrder(matcher: string, pair: [string, string]): Maybe<AssetIdsPair> {
    if (!this.orderPair[matcher]) return nothing();
    else {
      const correctOrder = this.orderPair[matcher](pair[0], pair[1]);
      return just({
        amountAsset: correctOrder[0],
        priceAsset: correctOrder[1],
      });
    }
  }

  public isCorrectOrder(matcher: string, pair: AssetIdsPair): Maybe<boolean> {
    return this.getCorrectOrder(matcher, [pair.amountAsset, pair.priceAsset]).map(
      (p) => p.amountAsset === pair.amountAsset,
    );
  }
}
