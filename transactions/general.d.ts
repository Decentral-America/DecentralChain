export * from './sign';
export * from './api';
import { DATA_FIELD_TYPE, TRANSACTION_TYPE } from '..';


export interface IWithId {
    id: string;
}

export interface IWithChainId {
    chainId: number;
}

export interface IWithSender {
    senderPublicKey: string;
}

export interface IWithVersion {
    version: number;
}

export interface IWithSignature {
    signature: string;
}

export interface IWithProofs {
    /**
     * Transaction proofs
     * @minItems 0
     * @maxItems 8
     */
    proofs: string[]
}

export interface IMassTransferItem<LONG> {
    recipient: string
    amount: LONG;
}

export interface IDataTransactionEntryInteger<LONG> {
    key: string;
    type: DATA_FIELD_TYPE.INTEGER;
    value: LONG;
}

export interface IDataTransactionEntryBoolean {
    key: string;
    type: DATA_FIELD_TYPE.BOOLEAN;
    value: boolean;
}

export interface IDataTransactionEntryString {
    key: string;
    type: DATA_FIELD_TYPE.STRING;
    value: string;
}

export interface IDataTransactionEntryBinary {
    key: string;
    type: DATA_FIELD_TYPE.BINARY;
    value: Uint8Array;
}

export interface IExchangeTransactionOrder<LONG> {
    matcherPublicKey: string;
    assetPair: {
        amountAsset: string;
        priceAsset: string;
    },
    orderType: string;
    price: LONG;
    amount: LONG;
    timestamp: number;
    expiration: number;
    matcherFee: LONG;
}

export type TDataTransactionEntry<LONG> =
    IDataTransactionEntryInteger<LONG> |
    IDataTransactionEntryBoolean |
    IDataTransactionEntryString |
    IDataTransactionEntryBinary;

export interface ITransaction<LONG> {
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
    ISponsorship<LONG> |
    IExchangeTransaction<LONG> |
    ISetAssetScript<LONG>;

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
    [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorship<LONG>,
    [TRANSACTION_TYPE.EXCHANGE]: IExchangeTransaction<LONG>,
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScript<LONG>
};

export interface IIssueTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.ISSUE
    name: string;
    description: string;
    decimals: number;
    quantity: LONG;
    reissuable: boolean;
    chainId: number;
    script?: string;
}

export interface ITransferTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.TRANSFER;
    recipient: string;
    amount: LONG;
    feeAssetId: string | null;
    assetId: string | null;
    attachment: string;
}

export interface IReissueTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.REISSUE;
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
}

export interface IBurnTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.BURN;
    assetId: string;
    quantity: LONG;
}

export interface ILeaseTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.LEASE;
    amount: LONG;
    recipient: string;
}

export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.CANCEL_LEASE;
    leaseId: string;
}

export interface IAliasTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.ALIAS;
    alias: string;
}

export interface IMassTransferTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.MASS_TRANSFER;
    transfers: IMassTransferItem<LONG>;
    assetId?: string;
    attachment?: string;
}

export interface IDataTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.DATA;
    data: Array<TDataTransactionEntry<LONG>>;
}

export interface IExchangeTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.EXCHANGE;
}

export interface ISetScriptTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.SET_SCRIPT;
    script: string | null //base64
}

export interface ISponsorship<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.SPONSORSHIP;
    assetId: string;
    minSponsoredAssetFee: LONG;
}

export interface ISetAssetScript<LONG> extends ITransaction<LONG>, IWithVersion, IWithChainId {
    type: TRANSACTION_TYPE.SET_ASSET_SCRIPT;
    assetId: string;
    script: string;
}
