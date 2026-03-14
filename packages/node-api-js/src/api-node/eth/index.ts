import query from '../../tools/query';
import request from '../../tools/request';
import { toArray } from '../../tools/utils';
import { type TAssetDetails } from '../assets';

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
  options: RequestInit = {},
): Promise<TAssetDetails[] | TAssetDetails> {
  const id = toArray(ethAssetId);

  return request<TAssetDetails[]>({
    base,
    options,
    url: `/eth/assets${query({ id })}`,
  }).then((list) => {
    if (Array.isArray(ethAssetId)) return list;
    const first = list[0];
    if (!first) throw new Error('Expected asset details');
    return first;
  });
}
