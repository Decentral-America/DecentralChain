import { type AssetIdsPair } from '../../../types';
import { type PairDbResponse } from './transformResult';

/** matchPairs :: (AssetIdsPair, PairDbResponse) -> Boolean */
export const matchRequestResult = (request: AssetIdsPair, result: PairDbResponse): boolean =>
  result.amount_asset_id === request.amountAsset && result.price_asset_id === request.priceAsset;
