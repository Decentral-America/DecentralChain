import { IProviderData, TDataOrFields, TDataTxField, TProviderAsset, TResponse } from './interface';
import { parseAssetData, parseOracleData } from './parse';
import { getFieldsDiff, isProvider, toHash } from './utils';
import { DATA_TO_FIELDS } from './schemas';


export function getProviderData(dataTxFields: Array<TDataTxField>): TResponse<IProviderData> {
    return parseOracleData(toHash<TDataTxField>('key')(dataTxFields));
}

export function getProviderAssets(dataTxFields: Array<TDataTxField>): Array<TResponse<TProviderAsset>> {
    return parseAssetData(toHash<TDataTxField>('key')(dataTxFields));
}

export function getFieldsFromData(data: IProviderData): Array<TDataTxField> {
    return DATA_TO_FIELDS.PROVIDER(data);
}

export function getFieldsFromAsset(data: TProviderAsset): Array<TDataTxField> {
    return DATA_TO_FIELDS.ASSET(data);
}

export function getFields(data: IProviderData | TProviderAsset): Array<TDataTxField> {
    if (isProvider(data)) {
        return getFieldsFromData(data);
    } else {
        return getFieldsFromAsset(data);
    }
}

export function getDifferenceByData<T extends IProviderData | TProviderAsset>(previous: T, next: T): Array<TDataTxField> {
    return getFieldsDiff(toFields(previous), toFields(next));
}

export function getDifferenceByFields(previous: Array<TDataTxField>, next: Array<TDataTxField>): Array<TDataTxField> {
    return getFieldsDiff(previous, next);
}

function toFields(some: TDataOrFields): Array<TDataTxField> {
    return Array.isArray(some) ? some : getFields(some);
}

export * from './interface';
export * from './constants';
