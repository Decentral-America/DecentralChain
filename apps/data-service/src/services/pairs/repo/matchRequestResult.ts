import { type AssetIdsPair } from '../../../types';
import { type PairDbResponse } from './transformResult';

const { prop, and, equals } = require('ramda');

/** matchPairs :: (Object, Object) -> Boolean */
export const matchRequestResult = (request: AssetIdsPair[], result: PairDbResponse): boolean =>
  and(
    equals(prop('amount_asset_id', result), prop('amountAsset', request)),
    equals(prop('price_asset_id', result), prop('priceAsset', request)),
  );
