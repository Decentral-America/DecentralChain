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
} from '../src';

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
        3: TIssueTransaction<LONG>,
        4: TTransferTransaction<LONG>,
        5: TReissueTransaction<LONG>,
        6: TBurnTransaction<LONG>,
        7: TLeaseTransaction<LONG>,
        8: TCancelLeaseTransaction<LONG>,
        9: TAliasTransaction<LONG>,
        10: TMassTransferTransaction<LONG>,
        11: TDataTransaction<LONG>,
        12: TSetScriptTransaction<LONG>,
        13: TSponsorship<LONG>,
        14: TExchangeTransaction<LONG>
    };

    export type TIssueTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.ISSUE
        chainId: number;
        name: string;
        description: string;
        decimals: number;
        quantity: LONG;
        reissuable: boolean;
        script?: string;
    };

    export type TTransferTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.TRANSFER;
        recipient: string;
        amount: LONG;
        feeAssetId: string;
        assetId: string;
        attachment: string;
    }

    export type TReissueTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.REISSUE;
        chainId: number;
        assetId: string;
        quantity: LONG;
        reissuable: boolean;
    }

    export type TBurnTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.BURN;
        chainId: number;
        assetId: string;
        quantity: LONG;
    }

    export type TLeaseTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.LEASE;
        amount: LONG;
        recipient: string;
    }

    export type TCancelLeaseTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.CANCEL_LEASE;
        chainId: number;
        leaseId: string;
    }

    export type TAliasTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.ALIAS;
        alias: string;
    }

    export type TMassTransferTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.MASS_TRANSFER;
        transfers: IMassTransferItem<LONG>;
        assetId: string;
        attachment: string;
    }

    export type TDataTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.DATA;
        data: Array<TDataTransactionEntry<LONG>>;
    }

    export type TSetScriptTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.SET_SCRIPT;
        chainId: number;
        script: string | null; //base64
    }

    export type TSponsorship<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.SPONSORSHIP;
        chainId: number;
        assetId: string;
        minSponsoredAssetFee: LONG;
    }

    export type TExchangeTransaction<LONG> = TBaseAPITransaction<LONG> & {
        type: typeof TRANSACTION_TYPE.EXCHANGE;
        sender: string;
        price: LONG;
        amount: LONG;
        buyMatcherFee: LONG;
        sellMatcherFee: LONG;
        order1: TExchangeTransactionOrder<LONG>;
        order2: TExchangeTransactionOrder<LONG>;
    }

    export type TExchangeTransactionOrder<LONG> =
        IExchangeTransactionOrder<LONG>
        & IWithId
        & IWithSender
        & TProofsOrSignature;
}