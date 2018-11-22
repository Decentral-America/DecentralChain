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

export interface IWithProofs {
    /**
     * Transaction signatures
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

export type TDataTransactionEntry<LONG> =
    IDataTransactionEntryInteger<LONG> |
    IDataTransactionEntryBoolean |
    IDataTransactionEntryString |
    IDataTransactionEntryBinary;

export interface ITransaction<LONG> {
    timestamp: number;
    fee: LONG;
}


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

export interface TransferTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.TRANSFER;
    recipient: string;
    amount: LONG;
    feeAssetId?: string;
    assetId?: string;
    attachment?: string;
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

export interface ISetScriptTransaction<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.SET_SCRIPT;
    script: string | null //base64
}

export interface ISponsorship<LONG> extends ITransaction<LONG> {
    type: TRANSACTION_TYPE.SPONSORSHIP;
    assetId: string;
    minSponsoredAssetFee: LONG;
}
