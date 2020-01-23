import { DATA_FIELD_TYPE, TProofs } from './index';


export type TOrderType = 'buy' | 'sell';

export type TBase64string = string

export interface IInvokeScriptCall<LONG> {
    function: string;
    args: Array<TInvokeScriptCallArgument<LONG>>;
}

export interface IInvokeScriptPayment<LONG = string | number> {
    assetId: string;
    amount: LONG;
}

export type TInvokeScriptCallArgument<LONG> =
    IInvokeScriptCallStringOrBinaryArgument |
    IInvokeScriptCallBoolArgument |
    IInvokeScriptCallIntArgument<LONG>;

export interface IInvokeScriptCallStringOrBinaryArgument {
    type: 'string' | 'binary';
    value: string;
}

export interface IInvokeScriptCallBoolArgument {
    type: 'boolean';
    value: boolean;
}

export interface IInvokeScriptCallIntArgument<LONG> {
    type: 'integer';
    value: LONG;
}

export interface IWithProofs {
    proofs: TProofs;
}

export interface IWithId {
    id: string;
}

export interface IMassTransferItem<LONG = string | number> {
    recipient: string
    amount: LONG;
}

export interface IDataTransactionEntryInteger<LONG> {
    key: string;
    type: typeof DATA_FIELD_TYPE.INTEGER;
    value: LONG;
}

export interface IDataTransactionEntryBoolean {
    key: string;
    type: typeof DATA_FIELD_TYPE.BOOLEAN;
    value: boolean;
}

export interface IDataTransactionEntryString {
    key: string;
    type: typeof DATA_FIELD_TYPE.STRING;
    value: string;
}

export interface IDataTransactionEntryBinary {
    key: string;
    type: typeof DATA_FIELD_TYPE.BINARY;
    value: TBase64string;
}

export interface ITransferTransactionEntryInteger<LONG = string | number> {
    type: typeof DATA_FIELD_TYPE.INTEGER
    value: LONG
}

export interface ITransferTransactionEntryBoolean {
    type: typeof DATA_FIELD_TYPE.BOOLEAN
    value: boolean
}

export interface ITransferTransactionEntryString {
    type: typeof DATA_FIELD_TYPE.STRING
    value: string
}

export interface ITransferTransactionEntryBinary {
    type: typeof DATA_FIELD_TYPE.BINARY
    value: string
}

export interface IExchangeTransactionOrder<LONG> {
    matcherPublicKey: string;
    version: number;
    assetPair: {
        amountAsset: string;
        priceAsset: string;
    },
    orderType: TOrderType;
    price: LONG;
    amount: LONG;
    timestamp: number;
    expiration: number;
    matcherFee: LONG;
    matcherFeeAssetId: string;
    senderPublicKey: string;
}

export interface IOrder<LONG> {
    matcherPublicKey: string;
    version: number;
    assetPair: {
        amountAsset: string;
        priceAsset: string;
    },
    orderType: TOrderType;
    price: LONG;
    amount: LONG;
    timestamp: number;
    expiration: number;
    matcherFee: LONG;
    matcherFeeAssetId: string;
    senderPublicKey: string;
}

export interface IOrderV1<LONG> extends IOrder<LONG> {
    //небыло пруфов быра сигнатура
}

export interface IOrderV2<LONG> extends IOrder<LONG> {
    //вместо подписи пруфы
}

export interface IOrderV3<LONG> extends IOrder<LONG> {
    //В третьей версии добавилось поле matcherFeeAssetId
}

export interface IExchangeTransactionOrderWithProofs<LONG> extends IExchangeTransactionOrder<LONG>, IWithProofs {
}

export type TDataTransactionEntry<LONG = string | number> =
    IDataTransactionEntryInteger<LONG> |
    IDataTransactionEntryBoolean |
    IDataTransactionEntryString |
    IDataTransactionEntryBinary;

export type TDataTransactionTypelessDataEntry = {
    key: string
    value: string | number | boolean | Uint8Array | number[]
}

export type TDataTransactionDeleteRequest = {
    type?: null
    value?: null
    key: string
}

export type TTransferTransactionAttachment =
    ITransferTransactionEntryInteger |
    ITransferTransactionEntryBoolean |
    ITransferTransactionEntryString |
    ITransferTransactionEntryBinary;
