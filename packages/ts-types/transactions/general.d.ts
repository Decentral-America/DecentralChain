import { DATA_FIELD_TYPE, TRANSACTION_TYPE, TTransactionType } from '../src';


export type TOrderType = 'buy' | 'sell';
export type TBase64Script = string;
export type TBase58Bytes = string;
export type TProofs = Array<string>;

interface _IWithProofs {
    proofs: TProofs;
}

export interface IMassTransferItem<LONG> {
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
    value: Uint8Array;
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
    senderPublicKey: string;
}

export type TDataTransactionEntry<LONG> =
    IDataTransactionEntryInteger<LONG> |
    IDataTransactionEntryBoolean |
    IDataTransactionEntryString |
    IDataTransactionEntryBinary;

export interface ITransaction<LONG, TYPE extends TTransactionType = TTransactionType> {
    type: TYPE;
    senderPublicKey: string;
    version: number;
    timestamp: number;
    fee: LONG;
}

export type TTransaction<LONG> =
    IIssueTransaction<LONG> |
    ITransferTransaction<LONG> |
    IReissueTransaction<LONG> |
    IBurnTransaction<LONG> |
    ILeaseTransaction<LONG> |
    ICancelLeaseTransaction<LONG> |
    IAliasTransaction<LONG> |
    IMassTransferTransaction<LONG> |
    IDataTransaction<LONG> |
    ISetScriptTransaction<LONG> |
    ISponsorshipTransaction<LONG> |
    IExchangeTransaction<LONG> |
    ISetAssetScriptTransaction<LONG>;

// export type TTransactionWithId<LONG> = // TODO! 
//     IIssueTransaction<LONG> |
//     ITransferTransaction<LONG> |
//     IReissueTransaction<LONG> |
//     IBurnTransaction<LONG> |
//     ILeaseTransaction<LONG> |
//     ICancelLeaseTransaction<LONG> |
//     IAliasTransaction<LONG> |
//     IMassTransferTransaction<LONG> |
//     IDataTransaction<LONG> |
//     ISetScriptTransaction<LONG> |
//     ISponsorshipTransaction<LONG> |
//     IExchangeTransaction<LONG> |
//     ISetAssetScriptTransaction<LONG>;

export type TTransactionMap<LONG> = {
    [TRANSACTION_TYPE.ISSUE]: IIssueTransaction<LONG>,
    [TRANSACTION_TYPE.TRANSFER]: ITransferTransaction<LONG>,
    [TRANSACTION_TYPE.REISSUE]: IReissueTransaction<LONG>,
    [TRANSACTION_TYPE.BURN]: IBurnTransaction<LONG>,
    [TRANSACTION_TYPE.LEASE]: ILeaseTransaction<LONG>,
    [TRANSACTION_TYPE.CANCEL_LEASE]: ICancelLeaseTransaction<LONG>,
    [TRANSACTION_TYPE.ALIAS]: IAliasTransaction<LONG>,
    [TRANSACTION_TYPE.MASS_TRANSFER]: IMassTransferTransaction<LONG>,
    [TRANSACTION_TYPE.DATA]: IDataTransaction<LONG>,
    [TRANSACTION_TYPE.SET_SCRIPT]: ISetScriptTransaction<LONG>,
    [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorshipTransaction<LONG>,
    [TRANSACTION_TYPE.EXCHANGE]: IExchangeTransaction<LONG>,
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScriptTransaction<LONG>
};

export interface IIssueTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.ISSUE> {
    name: string;
    description: string;
    decimals: number;
    quantity: LONG;
    reissuable: boolean;
    chainId: number;
    script?: TBase64Script | null;
}

export interface ITransferTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.TRANSFER> {
    recipient: string;
    amount: LONG;
    feeAssetId: string | null;
    assetId: string | null;
    attachment: TBase58Bytes;
}

export interface IReissueTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.REISSUE> {
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
}

export interface IBurnTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.BURN> {
    assetId: string;
    quantity: LONG;
}

export interface ILeaseTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.LEASE> {
    amount: LONG;
    recipient: string;
}

export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.CANCEL_LEASE> {
    leaseId: string;
}

export interface IAliasTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.ALIAS> {
    alias: string;
}

export interface IMassTransferTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.MASS_TRANSFER> {
    transfers: Array<IMassTransferItem<LONG>>;
    assetId?: string;
    attachment?: TBase58Bytes;
}

export interface IDataTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.DATA> {
    data: Array<TDataTransactionEntry<LONG>>;
}

export interface IExchangeTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.EXCHANGE> {
    buyOrder: IExchangeTransactionOrder<LONG> & _IWithProofs;
    sellOrder: IExchangeTransactionOrder<LONG> & _IWithProofs;
    price: LONG;
    amount: LONG;
    buyMatcherFee: LONG;
    sellMatcherFee: LONG;
}

export interface ISetScriptTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.SET_SCRIPT> {
    script: TBase64Script | null;
}

export interface ISponsorshipTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.SPONSORSHIP> {
    assetId: string;
    minSponsoredAssetFee: LONG;
}

export interface ISetAssetScriptTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT> {
    chainId: number;
    assetId: string;
    script: TBase64Script;
}
