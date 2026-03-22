import { Asset, Candle, type IAssetJSON, type ICandleJSON } from '@decentralchain/data-entities';

import { ApiTypes } from './types';
import { id } from './utils';

const transformer = (input: unknown): unknown => {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input !== 'object') {
    return input;
  }
  const { __type, data, ...rest } = input as Record<string, unknown>;
  switch (__type) {
    case ApiTypes.List:
      if (!Array.isArray(data)) {
        throw new Error(`Transform error: expected array for list type, got ${typeof data}`);
      }
      return data.map(transformer).filter((item) => item != null);
    case ApiTypes.Asset:
      return transformAsset(data as IAssetJSON);
    case ApiTypes.Alias:
      return data;
    case ApiTypes.Pair:
      return transformPair(data);
    case ApiTypes.Transaction:
      return data;
    case ApiTypes.Candle:
      return transformCandle(data as ICandleJSON);
    default:
      return { __type, data, ...rest };
  }
};

const transformAsset = (data: IAssetJSON): Asset | null => (data === null ? null : new Asset(data));
const transformPair = id;
const transformCandle = (data: ICandleJSON | null): Candle | null => {
  if (data === null) return null;
  // Empty candles from the API have null OHLCV fields — skip them rather than throw.
  if ((data as unknown as Record<string, unknown>)['open'] == null) return null;
  return new Candle(data);
};

export default transformer;
