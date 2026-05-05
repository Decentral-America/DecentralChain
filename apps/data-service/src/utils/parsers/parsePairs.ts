// @ts-nocheck
import { Either, pipe } from 'effect';
import { compose, isNil, split } from 'ramda';
import { type Parser } from '../../http/_common/filters/types';
import { type AssetIdsPair } from '../../types';
import { parseArrayQuery } from './parseArrayQuery';

export type ParsePairs = Parser<AssetIdsPair[] | undefined>;

export const parsePairs: ParsePairs = (pairsRaw?: string) =>
  isNil(pairsRaw)
    ? Either.right(undefined)
    : pipe(
        parseArrayQuery(pairsRaw),
        Either.map((pairs) =>
          pairs.map(
            compose(([amountAsset, priceAsset]) => ({ amountAsset, priceAsset }), split('/')),
          ),
        ),
      );
