import { type DataTransactionEntry } from '@decentralchain/ts-types';
import query from '../../tools/query';
import request from '../../tools/request';
import { deepAssign, pathSegment } from '../../tools/utils';
import { type TLong } from '../../types';

export function fetchDataKey(
  base: string,
  address: string,
  key: string,
  options: RequestInit = {},
): Promise<DataTransactionEntry<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/data/${pathSegment(address)}/${encodeURIComponent(key)}`,
  });
}

export function fetchScriptInfoMeta(
  base: string,
  address: string,
): Promise<IScriptInfoMetaResponse> {
  return request({
    base,
    url: `/addresses/scriptInfo/${pathSegment(address)}/meta`,
  });
}

export function fetchBalanceDetails(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IBalanceDetails<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/balance/details/${pathSegment(address)}`,
  });
}

export function fetchBalanceConfirmations(
  base: string,
  address: string,
  confirmations: number,
  options: RequestInit = {},
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/balance/${pathSegment(address)}/${pathSegment(confirmations)}`,
  });
}

export function fetchScriptInfo(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IScriptInfo> {
  return request({
    base,
    options,
    url: `/addresses/scriptInfo/${pathSegment(address)}`,
  });
}

export function data(
  base: string,
  address: string,
  params: IDataQueryParams = {},
  options: RequestInit = {},
): Promise<DataTransactionEntry<TLong>[]> {
  return request({
    base,
    options,
    url: `/addresses/data/${pathSegment(address)}${query(params)}`,
  });
}

export function fetchValidate(base: string, address: string): Promise<IValidateResponse> {
  return request({
    base,
    url: `/addresses/validate/${pathSegment(address)}`,
  });
}

export function fetchBalance(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/balance/${pathSegment(address)}`,
  });
}

/**
 * POST /addresses/balance
 * Get balances for multiple addresses in a single request.
 */
export function fetchMultipleBalance(
  base: string,
  addresses: string[],
  options: RequestInit = {},
): Promise<IBalanceConfirmations<TLong>[]> {
  return request({
    base,
    options: deepAssign(
      { ...options },
      {
        body: JSON.stringify({ addresses }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ),
    url: '/addresses/balance',
  });
}

export function fetchEffectiveBalanceConfirmations(
  base: string,
  address: string,
  confirmations: number,
  options: RequestInit = {},
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/effectiveBalance/${pathSegment(address)}/${pathSegment(confirmations)}`,
  });
}

export function fetchEffectiveBalance(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    options,
    url: `/addresses/effectiveBalance/${pathSegment(address)}`,
  });
}

export function fetchSeq(base: string, from: number, to: number): Promise<string[]> {
  return request({
    base,
    url: `/addresses/seq/${pathSegment(from)}/${pathSegment(to)}`,
  });
}

/**
 * @deprecated SECURITY WARNING: This endpoint exposes the wallet seed over the network.
 * It requires the node's API key and should NEVER be called against production nodes.
 * Prefer local key management. Will be removed in a future major version.
 */
export function fetchSeed(base: string, address: string): Promise<string> {
  return request({
    base,
    url: `/addresses/seed/${pathSegment(address)}`,
  });
}

export function fetchPublicKey(base: string, publicKey: string): Promise<IPublicKeyResponse> {
  return request({
    base,
    url: `/addresses/publicKey/${pathSegment(publicKey)}`,
  });
}

export function fetchAddresses(base: string): Promise<string[]> {
  return request({
    base,
    url: '/addresses',
  });
}

// NOTE: Requires node API key
//  /addresses/verifyText/{address}
//  /addresses/signText/{address}
//  /addresses/sign/{address}
//  /addresses   POST
//  /addresses/verify/{address}
//  /addresses/{address}   DELETE

export interface IBalanceConfirmations<LONG> {
  address: string;
  confirmations: number;
  balance: LONG;
}

export interface IScriptInfo<LONG = TLong> {
  address: string;
  complexity: number;
  callableComplexities: Record<string, number>;
  verifierComplexity: number;
  extraFee: LONG;
  script?: string;
  scriptText?: string;
}

export interface IDataQueryParams {
  matches?: string | undefined;
  keys?: string | string[] | undefined;
}

export interface IBalanceDetails<LONG> {
  address: string;
  /** Total balance including outgoing leases. Regular = Available + LeaseOut. */
  regular: LONG;
  /** Minimum effective balance over the last 1000 blocks. */
  generating: LONG;
  /** Spendable balance excluding outgoing leases. */
  available: LONG;
  /** Balance for block generation (includes incoming leases, excludes outgoing). Effective = Available + LeaseIn - LeaseOut. */
  effective: LONG;
}

export type ICallableFuncArgumentType = 'Int' | 'String' | 'ByteVector' | 'Boolean';
export type TCallableFuncArgumentsArray = { name: string; type: ICallableFuncArgumentType }[];
export type TCallableFuncArgumentsRecord = Record<string, ICallableFuncArgumentType>;
export type TCallableFuncArguments = TCallableFuncArgumentsArray | TCallableFuncArgumentsRecord;

export interface IScriptInfoMeta<TArguments extends TCallableFuncArguments> {
  version: string;
  isArrayArguments?: boolean;
  callableFuncTypes: Record<string, TArguments>;
}

export interface IScriptInfoMetaResponse {
  address: string;
  meta: IScriptInfoMeta<TCallableFuncArguments>;
}

export interface IValidateResponse {
  address: string;
  valid: boolean;
}

export interface IPublicKeyResponse {
  address: string;
}
