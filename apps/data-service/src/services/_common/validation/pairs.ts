import { Effect, Option, pipe } from 'effect';
import { zip } from 'ramda';

import { type AppError, ValidationError } from '../../../errorHandling';
import { type AssetIdsPair } from '../../../types';

import { type AssetsService } from '../../assets';
import { type PairOrderingService } from '../../PairOrderingService';

export const validatePairs =
  (assetsMget: AssetsService['mget'], pairOrderingService: PairOrderingService) =>
  (matcher: string, pairs: AssetIdsPair[]): Effect.Effect<void, AppError> => {
    // correct order
    const incorrectPairs = pairs.filter((p) => {
      const order = pairOrderingService.isCorrectOrder(matcher, p);
      return Option.isSome(order) ? !order.value : true;
    });

    if (incorrectPairs.length) {
      return Effect.fail(
        new ValidationError('Wrong assets order in provided pair(s)', { pairs: incorrectPairs }),
      );
    }

    // all assets exist
    const assetIdsSet: Set<string> = new Set();
    pairs.forEach((p) => {
      assetIdsSet.add(p.amountAsset);
      assetIdsSet.add(p.priceAsset);
    });
    const assetIds = Array.from(assetIdsSet);

    return pipe(
      assetsMget({ ids: assetIds }),
      Effect.flatMap((assets) => {
        const nonExistingIds = zip(assetIds, assets)
          .filter((x) => Option.isNone(x[1]))
          .map((x) => x[0]);

        if (!nonExistingIds.length) {
          return Effect.succeed(undefined as undefined);
        } else {
          return Effect.fail(
            new ValidationError(new Error('Assets do not exist in the blockchain'), {
              assets: nonExistingIds,
            }),
          );
        }
      }),
    );
  };
