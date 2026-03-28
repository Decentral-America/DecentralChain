import {
  type AssetDecimals,
  type IssueTransaction,
  type SignedTransaction,
  TRANSACTION_TYPE,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import { type TLong } from '../../interface';
import query from '../../tools/query';
import request from '../../tools/request';
import { pathSegment, toArray } from '../../tools/utils';

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
  options: RequestInit = {},
): Promise<TAssetDetails | TAssetDetails[]> {
  const isOnce = !Array.isArray(assetId);
  return Promise.all(
    toArray(assetId).map((id) =>
      request<TAssetDetails>({
        base,
        options,
        url: `/assets/details/${pathSegment(id)}`,
      }),
    ),
  ).then((list) => {
    if (!isOnce) return list;
    const first = list[0];
    if (!first) throw new Error('Expected asset details');
    return first;
  });
}

/**
 * GET /assets/details
 * Provides detailed information about the given assets
 */
export function fetchAssetsDetails(
  base: string,
  assetIds: string[],
  options: RequestInit = {},
): Promise<(TAssetDetails | TErrorResponse)[]> {
  const params = assetIds.map((assetId) => `id=${encodeURIComponent(assetId)}`).join('&');

  const queryStr = assetIds.length ? `?${params}` : '';

  return request<(TAssetDetails | TErrorResponse)[]>({
    base,
    options,
    url: `/assets/details${queryStr}`,
  });
}

export function fetchAssetDistribution(
  base: string,
  assetId: string,
  height: number,
  limit: number,
  after?: string,
  options: RequestInit = {},
): Promise<IAssetDistribution> {
  return request({
    base,
    options,
    url: `/assets/${pathSegment(assetId)}/distribution/${pathSegment(height)}/limit/${pathSegment(limit)}${query({ after })}`,
  });
}

/**
 * GET /assets/{assetId}/distribution
 * Asset balance distribution — requires node API key
 */

export function fetchAssetsAddressLimit(
  base: string,
  address: string,
  limit: number,
  options: RequestInit = {},
): Promise<TAssetDetails[]> {
  return request({
    base,
    options,
    url: `/assets/nft/${pathSegment(address)}/limit/${pathSegment(limit)}`,
  });
}

/**
 * GET assets/nft/${address}/limit/${limit}
 * Asset balance distribution — requires node API key
 */
interface IFetchAssetsNftParams {
  address: string;
  limit: number;
  after?: string;
}

export function fetchAssetsNft(
  base: string,
  { address, limit, after }: IFetchAssetsNftParams,
  options: RequestInit = {},
): Promise<TAssetDetails[]> {
  const afterQuery = after ? `?after=${encodeURIComponent(after)}` : '';

  return request({
    base,
    options,
    url: `/assets/nft/${pathSegment(address)}/limit/${pathSegment(limit)}${afterQuery}`,
  });
}

export async function fetchAssetsBalance(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<TAssetsBalance> {
  const balancesResponse = await request<TAssetsBalance>({
    base,
    options,
    url: `/assets/balance/${pathSegment(address)}`,
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
      chainId: 0,
      decimals: assetDetails.decimals,
      description: assetDetails.description,
      fee: 10 ** 8,
      feeAssetId: null,
      height: assetDetails.issueHeight,
      id: assetDetails.originTransactionId,
      name: assetDetails.name,
      proofs: [],
      quantity: assetDetails.quantity,
      reissuable: assetDetails.reissuable,
      script: assetDetails.scripted ? '-' : null,
      sender: assetDetails.issuer,
      senderPublicKey: assetDetails.issuerPublicKey,
      timestamp: assetDetails.issueTimestamp,
      type: TRANSACTION_TYPE.ISSUE,
      version: 3,
    } as NonNullable<TAssetBalance['issueTransaction']>;
  });

  return balancesResponse;
}

export function fetchBalanceAddressAssetId(
  base: string,
  address: string,
  assetId: string,
  options: RequestInit = {},
): Promise<IBalanceAddressAssetId> {
  return request({
    base,
    options,
    url: `/assets/balance/${pathSegment(address)}/${pathSegment(assetId)}`,
  });
}

/**
 * GET /eth/assets?id={assetId}
 * Convert a DecentralChain asset ID to its Ethereum-compatible representation.
 */
export function convertEthAssetId(base: string, assetId: string): Promise<string> {
  return request<TAssetDetails[]>({
    base,
    url: `/eth/assets${query({ id: assetId })}`,
  }).then((assets) => {
    const first = assets[0];
    if (!first) throw new Error('Asset not found');
    return first.assetId;
  });
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
  issueTransaction?: SignedTransaction<IssueTransaction & WithApiMixin> | undefined;
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
