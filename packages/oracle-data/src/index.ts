import type {
  IProviderData,
  TDataOrFields,
  TDataTxField,
  TProviderAsset,
  TResponse,
} from './interface.js';
import { parseAssetData, parseOracleData } from './parse/index.js';
import { getFieldsDiff, isProvider, toHash } from './utils/index.js';
import { DATA_TO_FIELDS } from './schemas/index.js';

/** Parse oracle provider data from an array of data transaction fields. */
export function getProviderData(dataTxFields: TDataTxField[]): TResponse<IProviderData> {
  return parseOracleData(toHash<TDataTxField>('key')(dataTxFields));
}

/** Parse oracle asset data from an array of data transaction fields. */
export function getProviderAssets(dataTxFields: TDataTxField[]): TResponse<TProviderAsset>[] {
  return parseAssetData(toHash<TDataTxField>('key')(dataTxFields));
}

/** Convert provider data back to data transaction fields. */
export function getFieldsFromData(data: IProviderData): TDataTxField[] {
  return DATA_TO_FIELDS.PROVIDER(data);
}

/** Convert asset data back to data transaction fields. */
export function getFieldsFromAsset(data: TProviderAsset): TDataTxField[] {
  return DATA_TO_FIELDS.ASSET(data);
}

/** Convert either provider or asset data to data transaction fields. */
export function getFields(data: IProviderData | TProviderAsset): TDataTxField[] {
  if (isProvider(data)) {
    return getFieldsFromData(data);
  } else {
    return getFieldsFromAsset(data);
  }
}

/** Get the diff between two data objects of the same type. */
export function getDifferenceByData<T extends IProviderData | TProviderAsset>(
  previous: T,
  next: T,
): TDataTxField[] {
  return getFieldsDiff(toFields(previous), toFields(next));
}

/** Get the diff between two arrays of data transaction fields. */
export function getDifferenceByFields(
  previous: TDataTxField[],
  next: TDataTxField[],
): TDataTxField[] {
  return getFieldsDiff(previous, next);
}

function toFields(some: TDataOrFields): TDataTxField[] {
  return Array.isArray(some) ? some : getFields(some);
}

export type {
  IProviderData,
  IProviderAsset,
  ISuccessResponse,
  IErrorResponse,
  TResponse,
  IResponseError,
  IBaseDataTx,
  IStringDataTXField,
  IIntegerDataTXField,
  IBooleanDataTXField,
  IBinaryDataTXField,
  TDataTxField,
  TSuspicious,
  TScamAsset,
  TProviderAsset,
  TDataOrFields,
} from './interface.js';
export {
  STATUS_LIST,
  DATA_PROVIDER_VERSIONS,
  RESPONSE_STATUSES,
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_KEYS,
  DATA_PROVIDER_DESCRIPTION_PATTERN,
  ORACLE_ASSET_FIELD_PATTERN,
  PATTERNS,
  isValidStatus,
  isValidAssetId,
} from './constants.js';
