import request from '../../tools/request';
import { type TAssetDetails } from '../assets';
import { toArray } from '../../tools/utils';
import query from '../../tools/query';

export function fetchEthAssetDetails(
  base: string,
  ethAssetId: string,
  options?: RequestInit,
): Promise<TAssetDetails>;
export function fetchEthAssetDetails(
  base: string,
  ethAssetId: string[],
  options?: RequestInit,
): Promise<TAssetDetails[]>;
export function fetchEthAssetDetails(
  base: string,
  ethAssetId: string | string[],
  options: RequestInit = Object.create(null),
): Promise<TAssetDetails[] | TAssetDetails> {
  const id = toArray(ethAssetId);

  return request<TAssetDetails[]>({
    base,
    url: `/eth/assets${query({ id })}`,
    options,
  }).then((list) => (Array.isArray(ethAssetId) ? list : list[0]!));
}
