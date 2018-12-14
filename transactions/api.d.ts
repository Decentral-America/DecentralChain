import {
    IMassTransferItem,
    ITransaction,
    IWithId,
    IWithProofs,
    IWithSender, IWithVersion,
    TDataTransactionEntry,
    IExchangeTransactionOrder,
    TRANSACTION_TYPE
} from '..';

export namespace api {

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
        IExchangeTransaction<LONG>;

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
        [TRANSACTION_TYPE.EXCHANGE]: IExchangeTransaction<LONG>
    };

    export interface IIssueTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.ISSUE
        chainId: number;
        name: string;
        description: string;
        decimals: number;
        quantity: LONG;
        reissuable: boolean;
        script?: string;
    }

    export interface ITransferTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.TRANSFER;
        recipient: string;
        amount: LONG;
        feeAssetId: string;
        assetId: string;
        attachment: string;
    }

    export interface IReissueTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.REISSUE;
        chainId: number;
        assetId: string;
        quantity: LONG;
        reissuable: boolean;
    }

    export interface IBurnTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.BURN;
        chainId: number;
        assetId: string;
        quantity: LONG;
    }

    export interface ILeaseTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.LEASE;
        amount: LONG;
        recipient: string;
    }

    export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.CANCEL_LEASE;
        chainId: number;
        leaseId: string;
    }

    export interface IAliasTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.ALIAS;
        alias: string;
    }

    export interface IMassTransferTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.MASS_TRANSFER;
        transfers: IMassTransferItem<LONG>;
        assetId: string;
        attachment: string;
    }

    export interface IDataTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.DATA;
        data: Array<TDataTransactionEntry<LONG>>;
    }

    export interface ISetScriptTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.SET_SCRIPT;
        chainId: number;
        script: string | null //base64
    }

    export interface ISponsorship<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.SPONSORSHIP;
        chainId: number;
        assetId: string;
        minSponsoredAssetFee: LONG;
    }

    export interface IExchangeTransaction<LONG> extends ITransaction<LONG>, IWithId, IWithProofs, IWithSender, IWithVersion {
        type: TRANSACTION_TYPE.EXCHANGE;
        senderPublicKey: string;
        price: LONG;
        amount: LONG;
        buyMatcherFee: LONG;
        sellMatcherFee: LONG;
        order1: IExchangeTransactionOrder<LONG>;
        order2: IExchangeTransactionOrder<LONG>;
    }

}