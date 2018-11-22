import {
    IMassTransferItem,
    ITransaction,
    IWithChainId,
    IWithId,
    IWithProofs,
    IWithSender,
    IWithVersion, TDataTransactionEntry,
    TRANSACTION_TYPE
} from '..';

export namespace sign {

    export interface IIssueTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.ISSUE
        name: string;
        description: string;
        decimals: number;
        quantity: LONG;
        reissuable: boolean;
        chainId: number;
        script?: string;
    }

    export interface ITransferTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: TRANSACTION_TYPE.TRANSFER;
        recipient: string;
        amount: LONG;
        feeAssetId?: string;
        assetId?: string;
        attachment?: string;
    }

    export interface IReissueTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.REISSUE;
        assetId: string;
        quantity: LONG;
        reissuable: boolean;
    }

    export interface IBurnTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.BURN;
        assetId: string;
        quantity: LONG;
    }

    export interface ILeaseTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: TRANSACTION_TYPE.LEASE;
        amount: LONG;
        recipient: string;
    }

    export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.CANCEL_LEASE;
        leaseId: string;
    }

    export interface IAliasTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: TRANSACTION_TYPE.ALIAS;
        alias: string;
    }

    export interface IMassTransferTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: TRANSACTION_TYPE.MASS_TRANSFER;
        transfers: IMassTransferItem<LONG>;
        assetId?: string;
        attachment?: string;
    }

    export interface IDataTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: TRANSACTION_TYPE.DATA;
        data: Array<TDataTransactionEntry<LONG>>;
    }

    export interface ISetScriptTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.SET_SCRIPT;
        script: string | null //base64
    }

    export interface ISponsorship<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion>, IWithChainId {
        type: TRANSACTION_TYPE.SPONSORSHIP;
        assetId: string;
        minSponsoredAssetFee: LONG;
    }

}