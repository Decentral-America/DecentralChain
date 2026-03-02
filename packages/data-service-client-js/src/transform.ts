import type { IAssetJSON, ICandleJSON } from '@decentralchain/data-entities';
import { Asset, Candle } from '@decentralchain/data-entities';

import { ApiTypes } from './types';
import { id } from './utils';
const transformer = (input: any): any => {
  if (input === null || input === undefined) {
    return input;
  }
  const { __type, data, ...rest } = input;
  switch (__type) {
    case ApiTypes.List:
      if (!Array.isArray(data)) {
        throw new Error(`Transform error: expected array for list type, got ${typeof data}`);
      }
      return data.map(transformer);
    case ApiTypes.Asset:
      return transformAsset(data);
    case ApiTypes.Alias:
      return data;
    case ApiTypes.Pair:
      return transformPair(data);
    case ApiTypes.Transaction:
      return data;
    case ApiTypes.Candle:
      return transformCandle(data);
    default:
      return { __type, data, ...rest };
  }
};

const transformAsset = (data: IAssetJSON): Asset | null => (data === null ? null : new Asset(data));
const transformPair = id;
const transformCandle = (data: ICandleJSON): Candle | null =>
  data === null ? null : new Candle(data);

export default transformer;
