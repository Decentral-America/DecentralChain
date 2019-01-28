import {
    IMassTransferItem,
    ITransaction,
    IWithId,
    IWithProofs,
    IWithSender,
    IWithVersion,
    TDataTransactionEntry,
    TRANSACTION_TYPE
} from '../src';

export namespace sign {

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
        ISponsorship<LONG>

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
        [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorship<LONG>
    };

    export interface IIssueTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.ISSUE
        name: string;
        description: string;
        decimals: number;
        quantity: LONG;
        reissuable: boolean;
        chainId: number;
        script?: string;
    }

    export interface ITransferTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.TRANSFER;
        recipient: string;
        amount: LONG;
        feeAssetId?: string;
        assetId?: string;
        attachment?: string;
    }

    export interface IReissueTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.REISSUE;
        assetId: string;
        quantity: LONG;
        reissuable: boolean;
        chainId: number;
    }

    export interface IBurnTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.BURN;
        assetId: string;
        quantity: LONG;
        chainId: number;
    }

    export interface ILeaseTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.LEASE;
        amount: LONG;
        recipient: string;
    }

    export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.CANCEL_LEASE;
        leaseId: string;
        chainId: number;
    }

    export interface IAliasTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.ALIAS;
        alias: string;
    }

    export interface IMassTransferTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.MASS_TRANSFER;
        transfers: IMassTransferItem<LONG>;
        assetId?: string;
        attachment?: string;
    }

    export interface IDataTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.DATA;
        data: Array<TDataTransactionEntry<LONG>>;
    }

    export interface ISetScriptTransaction<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.SET_SCRIPT;
        chainId: number;
        script: string | null //base64
    }

    export interface ISponsorship<LONG> extends ITransaction<LONG>, Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        type: typeof TRANSACTION_TYPE.SPONSORSHIP;
        chainId: number;
        assetId: string;
        minSponsoredAssetFee: LONG;
    }

    export interface IExchangeTransactionOrder<LONG> extends Partial<IWithId>, Partial<IWithProofs>, Partial<IWithSender>, Partial<IWithVersion> {
        matcherPublicKey: string;
        assetPair: {
            amountAsset: string;
            priceAsset: string;
        },
        orderType: string;
        price: LONG;
        amount: LONG;
        timestamp?: number;
        expiration?: number;
        matcherFee?: LONG;
    }

}