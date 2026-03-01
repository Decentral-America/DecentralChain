import { type TLong } from '../../interface';
import {
  type AssetDecimals,
  type IssueTransaction,
  type SignedTransaction,
  TRANSACTION_TYPE,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import request from '../../tools/request';
import { toArray } from '../../tools/utils';

/**
 * GET /assets/details/{assetId}
 * Information about an asset
 */
export function fetchDetails(
  base: string,
  assetId: string,
  options?: RequestInit,
): Promise<TAssetDetails>;
export function fetchDetails(
  base: string,
  assetId: string[],
  options?: RequestInit,
): Promise<TAssetDetails[]>;
export function fetchDetails<T extends string | string[]>(
  base: string,
  assetId: T,
  options: RequestInit = Object.create(null),
): Promise<TAssetDetails | TAssetDetails[]> {
  const isOnce = !Array.isArray(assetId);
  return Promise.all(
    toArray(assetId).map((id) =>
      request<TAssetDetails>({
        base,
        url: `/assets/details/${id}`,
        options,
      }),
    ),
  ).then((list) => (isOnce ? list[0]! : list));
}

/**
 * GET /assets/details
 * Provides detailed information about the given assets
 */
export function fetchAssetsDetails(
  base: string,
  assetIds: string[],
  options: RequestInit = Object.create(null),
): Promise<(TAssetDetails | TErrorResponse)[]> {
  const params = assetIds.map((assetId) => `id=${assetId}`).join('&');

  const query = assetIds.length ? `?${params}` : '';

  return request<(TAssetDetails | TErrorResponse)[]>({
    base,
    url: `/assets/details${query}`,
    options,
  });
}

export function fetchAssetDistribution(
  base: string,
  assetId: string,
  height: number,
  limit: number,
  options: RequestInit = Object.create(null),
): Promise<IAssetDistribution> {
  return request({
    base,
    url: `/assets/${assetId}/distribution/${height}/limit/${limit}`,
    options,
  });
}

/**
 * TODO
 * GET /assets/{assetId}/distribution
 * Asset balance distribution
 */

export function fetchAssetsAddressLimit(
  base: string,
  address: string,
  limit: number,
  options: RequestInit = Object.create(null),
): Promise<TAssetDetails[]> {
  return request({ base, url: `/assets/nft/${address}/limit/${limit}`, options });
}

/**
 * TODO
 * GET assets/nft/${address}/limit/${limit}
 * Asset balance distribution
 */
interface IFetchAssetsNftParams {
  address: string;
  limit: number;
  after?: string;
}

export function fetchAssetsNft(
  base: string,
  { address, limit, after }: IFetchAssetsNftParams,
  options: RequestInit = Object.create(null),
): Promise<TAssetDetails[]> {
  const url = new URL(`assets/nft/${address}/limit/${limit}`, base);

  if (after) {
    url.searchParams.append('after', after);
  }

  return request({ base, url: `${url.pathname}${url.search}`, options });
}

export async function fetchAssetsBalance(
  base: string,
  address: string,
  options: RequestInit = Object.create(null),
): Promise<TAssetsBalance> {
  const balancesResponse = await request<TAssetsBalance>({
    base,
    url: `/assets/balance/${address}`,
    options,
  });

  const assetsWithoutIssueTransaction = balancesResponse.balances.reduce<Record<string, number>>(
    (acc, balance, index) => {
      if (!balance.issueTransaction) {
        acc[balance.assetId] = index;
      }

      return acc;
    },
    {},
  );

  const assetsDetailsResponse = await fetchAssetsDetails(
    base,
    Object.keys(assetsWithoutIssueTransaction),
    options,
  );

  assetsDetailsResponse.forEach((assetDetails) => {
    if ('error' in assetDetails) {
      return;
    }

    const assetIndex = assetsWithoutIssueTransaction[assetDetails.assetId];
    if (assetIndex === undefined) return;
    const assetBalance = balancesResponse.balances[assetIndex];

    if (!assetBalance) {
      return;
    }

    assetBalance.issueTransaction = {
      id: assetDetails.originTransactionId,
      name: assetDetails.name,
      decimals: assetDetails.decimals,
      description: assetDetails.description,
      quantity: assetDetails.quantity,
      reissuable: assetDetails.reissuable,
      sender: assetDetails.issuer,
      senderPublicKey: assetDetails.issuerPublicKey,
      timestamp: assetDetails.issueTimestamp,
      height: assetDetails.issueHeight,
      script: assetDetails.scripted ? '-' : null,
      proofs: [],
      fee: 10 ** 8,
      feeAssetId: null,
      version: 3,
      type: TRANSACTION_TYPE.ISSUE,
      chainId: 0,
    } as any;
  });

  return balancesResponse;
}

export function fetchBalanceAddressAssetId(
  base: string,
  address: string,
  assetId: string,
  options: RequestInit = Object.create(null),
): Promise<IBalanceAddressAssetId> {
  return request({ base, url: `/assets/balance/${address}/${assetId}`, options });
}

export interface IAssetDistribution {
  hasNext: boolean;
  lastItem: string | null;
  items: Record<string, number>;
}

export interface IBalanceAddressAssetId<LONG = TLong> {
  address: string;
  assetId: string;
  balance: LONG;
}

export interface TAssetsBalance {
  address: string;
  balances: TAssetBalance[];
}

export interface TAssetBalance<LONG = TLong> {
  assetId: string;
  balance: LONG;
  reissuable: true;
  minSponsoredAssetFee: LONG | null;
  sponsorBalance: LONG | null;
  quantity: LONG;
  issueTransaction: SignedTransaction<IssueTransaction & WithApiMixin>;
}

export interface TAssetDetails<LONG = TLong> {
  assetId: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  name: string;
  description: string;
  decimals: AssetDecimals;
  reissuable: boolean;
  quantity: LONG;
  scripted: boolean;
  minSponsoredAssetFee: LONG | null;
  originTransactionId: string;
}

export interface TErrorResponse {
  error: number;
  message: string;
}
