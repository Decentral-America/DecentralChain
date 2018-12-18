import { DATA_ENTRY_TYPES, DATA_PROVIDER_VERSIONS, RESPONSE_STATUSES, STATUS_LIST } from './constants';


export interface IProviderData {
    name: string;
    link: string;
    email: string;
    version: DATA_PROVIDER_VERSIONS;
    description: Record<string, string>;
}

export interface IProviderAsset {
    id: string;
    status: STATUS_LIST;
    ticker: string;
    link: string;
    email: string;
    logo: string;
    version: DATA_PROVIDER_VERSIONS;
    description: Record<string, string>;
}

export interface ISuccessResponse<T> {
    status: RESPONSE_STATUSES.OK;
    content: T;
}

export interface IErrorResponse<T> {
    status: RESPONSE_STATUSES.ERROR;
    content: Partial<T>;
    errors: Array<IResponseError>;
}

export type TResponse<T> = ISuccessResponse<T> | IErrorResponse<T>;

export interface IResponseError {
    path: string;
    error: Error;
}

export interface IBaseDataTx {
    key: string;
}

export interface IStringDataTXField extends IBaseDataTx {
    type: DATA_ENTRY_TYPES.STRING;
    value: string;
}

export interface IIntegerDataTXField extends IBaseDataTx {
    type: DATA_ENTRY_TYPES.INTEGER;
    value: number;
}

export interface IBooleanDataTXField extends IBaseDataTx {
    type: DATA_ENTRY_TYPES.BOOLEAN;
    value: boolean;
}

export interface IBinaryDataTXField extends IBaseDataTx {
    type: DATA_ENTRY_TYPES.BINARY;
    value: string;
}

export type TDataTxField = IStringDataTXField | IIntegerDataTXField | IBooleanDataTXField | IBinaryDataTXField;

export type TSuspicious = STATUS_LIST.SCAM | STATUS_LIST.SUSPICIOUS | STATUS_LIST.NOT_VERIFY;
export type TScamAsset = Partial<IProviderAsset> & { status: TSuspicious, id: string, version: DATA_PROVIDER_VERSIONS };
export type TProviderAsset = TScamAsset | IProviderAsset;
export type TDataOrFields = IProviderData | TProviderAsset | Array<TDataTxField>;
