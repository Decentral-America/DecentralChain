import { type Asset } from '@decentralchain/data-entities';
import { get } from '../api/assets/assets';

export function toAsset(asset: Asset | string): Promise<Asset> {
  return typeof asset === 'string' ? get(asset) : Promise.resolve(asset);
}
