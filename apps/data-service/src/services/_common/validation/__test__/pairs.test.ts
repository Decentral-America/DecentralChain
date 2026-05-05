// @ts-nocheck

import { type Asset } from '@decentralchain/data-entities';
import { Effect, Option } from 'effect';
import { type AssetIdsPair } from '../../../../types';
import { type AssetsService } from '../../../assets';
import { type PairOrderingService } from '../../../PairOrderingService';
import { validatePairs } from '../pairs';

const mockAsset = (id: string) => ({ id }) as unknown as Asset;

const createMockAssets = (ids: string[]): AssetsService =>
  ({
    mget: ({ ids: reqIds }: { ids: string[] }) =>
      Effect.succeed(
        reqIds.map((id) => (ids.includes(id) ? Option.some(mockAsset(id)) : Option.none())),
      ),
  }) as unknown as AssetsService;

const createMockPairOrdering = (correctOrder = true): PairOrderingService =>
  ({
    getCorrectOrder: (_matcher: string, [a, b]: [string, string]) =>
      Option.some({ amountAsset: a, priceAsset: b }),
    isCorrectOrder: () => Option.some(correctOrder),
  }) as unknown as PairOrderingService;

describe('validatePairs', () => {
  const matcher = 'matcher-address';
  const pairs: AssetIdsPair[] = [{ amountAsset: 'assetA', priceAsset: 'assetB' }];

  it('succeeds if pairs are in correct order and assets exist', async () => {
    const result = await Effect.runPromise(
      validatePairs(createMockAssets(['assetA', 'assetB']).mget, createMockPairOrdering(true))(
        matcher,
        pairs,
      ),
    );
    expect(result).toBeUndefined();
  });

  it('fails if pairs are in wrong order', async () => {
    await expect(
      Effect.runPromise(
        validatePairs(createMockAssets(['assetA', 'assetB']).mget, createMockPairOrdering(false))(
          matcher,
          pairs,
        ),
      ),
    ).rejects.toBeDefined();
  });

  it('fails if assets do not exist', async () => {
    await expect(
      Effect.runPromise(
        validatePairs(createMockAssets([]).mget, createMockPairOrdering(true))(matcher, pairs),
      ),
    ).rejects.toBeDefined();
  });
});
