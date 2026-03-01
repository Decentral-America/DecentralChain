import { type TLong } from '../../interface';
import request from '../../tools/request';
import query from '../../tools/query';
import { type DataTransactionEntry } from '@decentralchain/ts-types';

export function fetchDataKey(
  base: string,
  address: string,
  key: string,
  options: RequestInit = Object.create(null),
): Promise<DataTransactionEntry<TLong>> {
  return request({
    base,
    url: `/addresses/data/${address}/${encodeURIComponent(key)}`,
    options,
  });
}

export function fetchScriptInfoMeta(
  base: string,
  address: string,
): Promise<IScriptInfoMetaResponse> {
  return request({
    base,
    url: `/addresses/scriptInfo/${address}/meta`,
  });
}

export function fetchBalanceDetails(
  base: string,
  address: string,
  options: RequestInit = Object.create(null),
): Promise<IBalanceDetails<TLong>> {
  return request({
    base,
    url: `/addresses/balance/details/${address}`,
    options,
  });
}

export function fetchBalanceConfirmations(
  base: string,
  address: string,
  confirmations: number,
  options: RequestInit = Object.create(null),
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    url: `/addresses/balance/${address}/${confirmations}`,
    options,
  });
}

export function fetchScriptInfo(
  base: string,
  address: string,
  options: RequestInit = Object.create(null),
): Promise<IScriptInfo> {
  return request({
    base,
    url: `/addresses/scriptInfo/${address}`,
    options,
  });
}

export function data(
  base: string,
  address: string,
  params: IDataQueryParams = Object.create(null),
  options: RequestInit = Object.create(null),
): Promise<DataTransactionEntry<TLong>[]> {
  return request({
    base,
    url: `/addresses/data/${address}${query(params)}`,
    options,
  });
}

export function fetchValidate(base: string, address: string): Promise<IValidateResponse> {
  return request({
    base,
    url: `/addresses/validate/${address}`,
  });
}

export function fetchBalance(
  base: string,
  address: string,
  options: RequestInit = Object.create(null),
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    url: `/addresses/balance/${address}`,
    options,
  });
}

export function fetchEffectiveBalanceConfirmations(
  base: string,
  address: string,
  confirmations: number,
  options: RequestInit = Object.create(null),
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    url: `/addresses/effectiveBalance/${address}/${confirmations}`,
    options,
  });
}

export function fetchEffectiveBalance(
  base: string,
  address: string,
  options: RequestInit = Object.create(null),
): Promise<IBalanceConfirmations<TLong>> {
  return request({
    base,
    url: `/addresses/effectiveBalance/${address}`,
    options,
  });
}

export function fetchSeq(base: string, from: number, to: number): Promise<string[]> {
  return request({
    base,
    url: `/addresses/seq/${from}/${to}`,
  });
}

export function fetchSeed(base: string, address: string): Promise<string> {
  return request({
    base,
    url: `/addresses/seed/${address}`,
  });
}

export function fetchPublicKey(base: string, publicKey: string): Promise<IPublicKeyResponse> {
  return request({
    base,
    url: `/addresses/publicKey/${publicKey}`,
  });
}

export function fetchAddresses(base: string): Promise<string[]> {
  return request({
    base,
    url: '/addresses',
  });
}

// @TODO: when correct API key is received
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
  matches?: string;
  keys?: string | string[];
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
