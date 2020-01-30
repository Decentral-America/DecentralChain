import { DATA_FIELD_TYPE, TExchangeTransaction, TLong, TProofs } from './index';


export type TExchangeTransactionOrderType = 'buy' | 'sell';

export type TBase64string = string;

export interface IInvokeScriptCall<LONG> {
    function: string;
    args: Array<TInvokeScriptCallArgument<LONG>>;
}

export interface IInvokeScriptPayment<LONG = TLong> {
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

export interface IMassTransferItem<LONG = TLong> {
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

export interface ITransferTransactionEntryInteger<LONG = TLong> {
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
    orderType: TExchangeTransactionOrderType;
    price: LONG;
    amount: LONG;
    timestamp: number;
    expiration: number;
    matcherFee: LONG;
    senderPublicKey: string;
}

export interface IExchangeTransactionOrderV1<LONG = TLong> extends IExchangeTransactionOrder<LONG> {
    version: 1
}

export interface IExchangeTransactionOrderV2<LONG = TLong> extends IExchangeTransactionOrder<LONG> {
    version: 2
}

export interface IExchangeTransactionOrderV3<LONG = TLong> extends IExchangeTransactionOrder<LONG> {
    version: 3
    matcherFeeAssetId: string;
}

export interface IExchangeTransactionOrderV4<LONG = TLong> extends IExchangeTransactionOrder<LONG> {
    version: 4
    matcherFeeAssetId: string;
}

export type TSignedIExchangeTransactionOrder<ORDER extends TExchangeTransactionOrder<unknown>> = ORDER &
    (ORDER extends { version: 1 } ? { signature: string; } : { proofs: Array<string> })


export type TExchangeTransactionOrder<LONG = TLong> =
    IExchangeTransactionOrderV1<LONG>
    | IExchangeTransactionOrderV2<LONG>
    | IExchangeTransactionOrderV3<LONG>
    | IExchangeTransactionOrderV4<LONG>


export type TExchangeTransactionOrderByTx<TX extends TExchangeTransaction> =
    TX extends { version: 1 }
        ? TExchangeTransactionOrderMap[1]
        : (TX extends { version: 2 } ? TExchangeTransactionOrderMap[1 | 2 | 3] : TExchangeTransactionOrder)


export type TExchangeTransactionOrderMap<LONG = TLong> = {
    1: IExchangeTransactionOrderV1<LONG>;
    2: IExchangeTransactionOrderV2<LONG>;
    3: IExchangeTransactionOrderV3<LONG>;
    4: IExchangeTransactionOrderV4<LONG>;
}

export type TDataTransactionEntry<LONG = TLong> =
    IDataTransactionEntryInteger<LONG> |
    IDataTransactionEntryBoolean |
    IDataTransactionEntryString |
    IDataTransactionEntryBinary;

// export type TDataTransactionTypelessDataEntry = {
//     key: string
//     value: string | number //| boolean | Uint8Array | number[]
// }

export type TDataTransactionDeleteRequest = {
    key: string
}

export type TTransferTransactionAttachment =
    ITransferTransactionEntryInteger |
    ITransferTransactionEntryBoolean |
    ITransferTransactionEntryString |
    ITransferTransactionEntryBinary;
