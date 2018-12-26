import {
    IMassTransferItem,
    ITransaction,
    IWithId,
    IWithProofs,
    IWithSignature,
    IWithSender,
    IWithVersion,
    TDataTransactionEntry,
    IExchangeTransactionOrder,
    TRANSACTION_TYPE
} from '..';

export namespace api {

    export type TProofsOrSignature = IWithProofs & IWithVersion | IWithSignature;
    export type TBaseAPITransaction<LONG> = ITransaction<LONG> & IWithId & IWithSender & TProofsOrSignature;

    export type TTransaction<LONG> =
        TIssueTransaction<LONG> |
        TTransferTransaction<LONG> |
        TReissueTransaction<LONG> |
        TBurnTransaction<LONG> |
        TLeaseTransaction<LONG> |
        TCancelLeaseTransaction<LONG> |
        TAliasTransaction<LONG> |
        TMassTransferTransaction<LONG> |
        TDataTransaction<LONG> |
        TSetScriptTransaction<LONG> |
        TSponsorship<LONG> |
        TExchangeTransaction<LONG>;

    export type TTransactionMap<LONG> = {
        [TRANSACTION_TYPE.ISSUE]: TIssueTransaction<LONG>,
        [TRANSACTION_TYPE.TRANSFER]: TTransferTransaction<LONG>,
        [TRANSACTION_TYPE.REISSUE]: TReissueTransaction<LONG>,
        [TRANSACTION_TYPE.BURN]: TBurnTransaction<LONG>,
        [TRANSACTION_TYPE.LEASE]: TLeaseTransaction<LONG>,
        [TRANSACTION_TYPE.CANCEL_LEASE]: TCancelLeaseTransaction<LONG>,
        [TRANSACTION_TYPE.ALIAS]: TAliasTransaction<LONG>,
        [TRANSACTION_TYPE.MASS_TRANSFER]: TMassTransferTransaction<LONG>,
        [TRANSACTION_TYPE.DATA]: TDataTransaction<LONG>,
        [TRANSACTION_TYPE.SET_SCRIPT]: TSetScriptTransaction<LONG>,
        [TRANSACTION_TYPE.SPONSORSHIP]: TSponsorship<LONG>,
        [TRANSACTION_TYPE.EXCHANGE]: TExchangeTransaction<LONG>
    };

    export type TIssueTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.ISSUE
        chainId: number;
        name: string;
        description: string;
        decimals: number;
        quantity: LONG;
        reissuable: boolean;
        script?: string;
    };

    export type TTransferTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.TRANSFER;
        recipient: string;
        amount: LONG;
        feeAssetId: string;
        assetId: string;
        attachment: string;
    }

    export type TReissueTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.REISSUE;
        chainId: number;
        assetId: string;
        quantity: LONG;
        reissuable: boolean;
    }

    export type TBurnTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.BURN;
        chainId: number;
        assetId: string;
        quantity: LONG;
    }

    export type TLeaseTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.LEASE;
        amount: LONG;
        recipient: string;
    }

    export type TCancelLeaseTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.CANCEL_LEASE;
        chainId: number;
        leaseId: string;
    }

    export type TAliasTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.ALIAS;
        alias: string;
    }

    export type TMassTransferTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.MASS_TRANSFER;
        transfers: IMassTransferItem<LONG>;
        assetId: string;
        attachment: string;
    }

    export type TDataTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.DATA;
        data: Array<TDataTransactionEntry<LONG>>;
    }

    export type TSetScriptTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.SET_SCRIPT;
        chainId: number;
        script: string | null; //base64
    }

    export type TSponsorship<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.SPONSORSHIP;
        chainId: number;
        assetId: string;
        minSponsoredAssetFee: LONG;
    }

    export type TExchangeTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: TRANSACTION_TYPE.EXCHANGE;
        sender: string;
        price: LONG;
        amount: LONG;
        buyMatcherFee: LONG;
        sellMatcherFee: LONG;
        order1: TExchangeTransacationOrder<LONG>;
        order2: TExchangeTransacationOrder<LONG>;
    }

    export type TExchangeTransactionOrderV1<LONG> =
        IExchangeTransactionOrder<LONG>
        & IWithId
        & IWithSender
        & IWithSignature;
    export type TExchangeTransactionOrderV2<LONG> =
        IExchangeTransactionOrder<LONG>
        & IWithId
        & IWithSender
        & IWithProofs
        & IWithVersion;
    export type TExchangeTransacationOrder<LONG> =
        TExchangeTransactionOrderV1<LONG>
        | TExchangeTransactionOrderV2<LONG>;
}