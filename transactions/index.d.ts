import { IWithProofs, TRANSACTION_TYPE, TTransactionType, TTransferTransactionAttachment } from '../src';
import {
    IExchangeTransactionOrder,
    IInvokeScriptCall,
    IInvokeScriptPayment,
    IMassTransferItem,
    IWithId,
    TDataTransactionEntry
} from '../src/parts';


export type TBase64Script = string;
export type TBase58Bytes = string;
export type TProofs = Array<string>;


export interface ITransaction<LONG = string | number, TYPE extends TTransactionType = TTransactionType> {
    type: TYPE;
    senderPublicKey: string;
    version: number;
    timestamp: number;
    fee: LONG;
    proofs: TProofs;
}

export type TTransaction<LONG = string | number> =
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
    TSponsorshipTransaction<LONG> |
    TExchangeTransaction<LONG> |
    TSetAssetScriptTransaction<LONG> |
    TInvokeScriptTransaction<LONG>|
    TUpdateAssetInfoTransaction<LONG>;

export type TTransactionMap<LONG = string | number> = {
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
    [TRANSACTION_TYPE.SPONSORSHIP]: TSponsorshipTransaction<LONG>,
    [TRANSACTION_TYPE.EXCHANGE]: TExchangeTransaction<LONG>,
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: TSetAssetScriptTransaction<LONG>,
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: TInvokeScriptTransaction<LONG>,
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: TUpdateAssetInfoTransaction<LONG>,
};

export type TTransactionWithId<LONG> =
    TIssueTransactionWithId<LONG> |
    TTransferTransactionWithId<LONG> |
    TReissueTransactionWithId<LONG> |
    TBurnTransactionWithId<LONG> |
    TLeaseTransactionWithId<LONG> |
    TCancelLeaseTransactionWithId<LONG> |
    TAliasTransactionWithId<LONG> |
    TMassTransferTransactionWithId<LONG> |
    TDataTransactionWithId<LONG> |
    TSetScriptTransactionWithId<LONG> |
    TSponsorshipTransactionWithId<LONG> |
    TExchangeTransactionWithId<LONG> |
    TSetAssetScriptTransactionWithId<LONG> |
    TInvokeScriptTransactionWithId<LONG>|
    TUpdateAssetInfoTransactionWithId<LONG>;

export type TTransactionWithIdMap<LONG> = {
    [TRANSACTION_TYPE.ISSUE]: TIssueTransactionWithId<LONG>,
    [TRANSACTION_TYPE.TRANSFER]: TTransferTransactionWithId<LONG>,
    [TRANSACTION_TYPE.REISSUE]: TReissueTransactionWithId<LONG>,
    [TRANSACTION_TYPE.BURN]: TBurnTransactionWithId<LONG>,
    [TRANSACTION_TYPE.LEASE]: TLeaseTransactionWithId<LONG>,
    [TRANSACTION_TYPE.CANCEL_LEASE]: TCancelLeaseTransactionWithId<LONG>,
    [TRANSACTION_TYPE.ALIAS]: TAliasTransactionWithId<LONG>,
    [TRANSACTION_TYPE.MASS_TRANSFER]: TMassTransferTransactionWithId<LONG>,
    [TRANSACTION_TYPE.DATA]: TDataTransactionWithId<LONG>,
    [TRANSACTION_TYPE.SET_SCRIPT]: TSetScriptTransactionWithId<LONG>,
    [TRANSACTION_TYPE.SPONSORSHIP]: TSponsorshipTransactionWithId<LONG>,
    [TRANSACTION_TYPE.EXCHANGE]: TExchangeTransactionWithId<LONG>,
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: TSetAssetScriptTransactionWithId<LONG>,
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: TInvokeScriptTransactionWithId<LONG>,
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: TUpdateAssetInfoTransaction<LONG>,
}


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
    attachment: TBase58Bytes | TTransferTransactionAttachment;
}

export interface IReissueTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.REISSUE> {
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
    chainId: number;
}

export interface IBurnTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.BURN> {
    assetId: string;
    quantity: LONG;
    chainId: number;
}

export interface ILeaseTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.LEASE> {
    amount: LONG;
    recipient: string;
}

export interface ICancelLeaseTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.CANCEL_LEASE> {
    leaseId: string;
    chainId: number;
}

export interface IAliasTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.ALIAS> {
    alias: string;
}

export interface IMassTransferTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.MASS_TRANSFER> {
    transfers: Array<IMassTransferItem<LONG>>;
    assetId?: string;
    attachment?: TBase58Bytes | TTransferTransactionAttachment;
}

export interface IDataTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.DATA> {
    data: Array<TDataTransactionEntry<LONG>>;
}

export interface IExchangeTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.EXCHANGE> {
    order1: IExchangeTransactionOrder<LONG> & IWithProofs;
    order2: IExchangeTransactionOrder<LONG> & IWithProofs;
    price: LONG;
    amount: LONG;
    buyMatcherFee: LONG;
    sellMatcherFee: LONG;
}

export interface ISetScriptTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.SET_SCRIPT> {
    script: TBase64Script | null;
    chainId: number;
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

export interface IInvokeScriptTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.INVOKE_SCRIPT> {
    chainId: number;
    dApp: string;
    call: IInvokeScriptCall<LONG> | null | undefined;
    feeAssetId: string | null;
    payment: Array<IInvokeScriptPayment<LONG>> | null | undefined;
}

export interface IUpdateAssetInfoTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO> {
    type: typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO
    assetId: string
    name: string
    description: string
    chainId: number
    feeAssetId?: string | null
}

//---------------------------------------------------------------------------------------------------------------------

//IssueTransaction
export interface IIssueTransactionV1<LONG> extends IIssueTransaction<LONG> {
    version: 1
    signature: string
}

export interface IIssueTransactionV2<LONG> extends IIssueTransaction<LONG> {
    version: 2
}

export interface IIssueTransactionV3<LONG> extends IIssueTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//TransferTransaction
export interface ITransferTransactionV1<LONG> extends ITransferTransaction<LONG> {
    version: 1
    signature: string
}

export interface ITransferTransactionV2<LONG> extends ITransferTransaction<LONG> {
    version: 2
}

export interface ITransferTransactionV3<LONG> extends ITransferTransaction<LONG> {
    version: 3
    chainId: number
    attachment: TTransferTransactionAttachment
}


//LeaseTransaction
export interface ILeaseTransactionV1<LONG> extends ILeaseTransaction<LONG> {
    version: 1
    signature: string
}

export interface ILeaseTransactionV2<LONG> extends ILeaseTransaction<LONG> {
    version: 2
}

export interface ILeaseTransactionV3<LONG> extends ILeaseTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//BurnTransaction
export interface IBurnTransactionV1<LONG> extends IBurnTransaction<LONG> {
    version: 1
    signature: string
}

export interface IBurnTransactionV2<LONG> extends IBurnTransaction<LONG> {
    version: 2
}

export interface IBurnTransactionV3<LONG> extends IBurnTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//IReissueTransaction
export interface IReissueTransactionV1<LONG> extends IReissueTransaction<LONG> {
    version: 1
    signature: string
}

export interface IReissueTransactionV2<LONG> extends IReissueTransaction<LONG> {
    version: 2
}

export interface IReissueTransactionV3<LONG> extends IReissueTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//ICancelLeaseTransaction
export interface ICancelLeaseTransactionV1<LONG> extends ICancelLeaseTransaction<LONG> {
    version: 1
    signature: string
}

export interface ICancelLeaseTransactionV2<LONG> extends ICancelLeaseTransaction<LONG> {
    version: 2
}

export interface ICancelLeaseTransactionV3<LONG> extends ICancelLeaseTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//IAliasTransaction
export interface IAliasTransactionV1<LONG> extends IAliasTransaction<LONG> {
    version: 1
    signature: string
}

export interface IAliasTransactionV2<LONG> extends IAliasTransaction<LONG> {
    version: 2
}

export interface IAliasTransactionV3<LONG> extends IAliasTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//IMassTransferTransaction
export interface IMassTransferTransactionV1<LONG> extends IMassTransferTransaction<LONG> {
    version: 1
    signature: string
}

export interface IMassTransferTransactionV2<LONG> extends IMassTransferTransaction<LONG> {
    version: 2
    chainId: number
    feeAssetId?: string | null
    attachment: TTransferTransactionAttachment
}


//IDataTransaction
export interface IDataTransactionV1<LONG> extends IDataTransaction<LONG> {
    version: 1
    signature: string
}

export interface IDataTransactionV2<LONG> extends IDataTransaction<LONG> {
    version: 2
    chainId: number
    feeAssetId?: string | null
}


//ISetScriptTransaction
export interface ISetScriptTransactionV1<LONG> extends ISetScriptTransaction<LONG> {
    version: 1
    signature: string
}

export interface ISetScriptTransactionV2<LONG> extends ISetScriptTransaction<LONG> {
    version: 2
    chainId: number
    feeAssetId?: string | null
}


//ISponsorshipTransaction
export interface ISponsorshipTransactionV1<LONG> extends ISponsorshipTransaction<LONG> {
    version: 1
    signature: string
}

export interface ISponsorshipTransactionV2<LONG> extends ISponsorshipTransaction<LONG> {
    version: 2
    chainId: number
    feeAssetId?: string | null
}


//IExchangeTransaction
export interface IExchangeTransactionV1<LONG> extends IExchangeTransaction<LONG> {
    version: 1
    signature: string
}

export interface IExchangeTransactionV2<LONG> extends IExchangeTransaction<LONG> {
    version: 2
}

export interface IExchangeTransactionV3<LONG = string | number> extends IExchangeTransaction<LONG> {
    version: 3
    chainId: number
    feeAssetId?: string | null
}


//ISetAssetScriptTransaction
export interface ISetAssetScriptTransactionV1<LONG> extends ISetAssetScriptTransaction<LONG> {
    version: 1
    signature: string
}

export interface ISetAssetScriptTransactionV2<LONG> extends ISetAssetScriptTransaction<LONG> {
    version: 2
    chainId: number
    feeAssetId?: string | null
}


//IInvokeScriptTransaction
export interface IInvokeScriptTransactionV1<LONG> extends IInvokeScriptTransaction<LONG> {
    version: 1
    signature: string
}

export interface IInvokeScriptTransactionV2<LONG> extends IInvokeScriptTransaction<LONG> {
    version: 2
    chainId: number
}


//IUpdateAssetInfoTransaction
export interface IUpdateAssetInfoTransactionV1<LONG> extends IUpdateAssetInfoTransaction<LONG> {
    version: 1
}


export type TIssueTransaction<LONG = string | number> =
    IIssueTransactionV1<LONG>
    | IIssueTransactionV2<LONG>
    | IIssueTransactionV3<LONG>;

export type TTransferTransaction<LONG = string | number> =
    ITransferTransactionV1<LONG>
    | ITransferTransactionV2<LONG>
    | ITransferTransactionV3<LONG>;

export type TLeaseTransaction<LONG = string | number> =
    ILeaseTransactionV1<LONG>
    | ILeaseTransactionV2<LONG>
    | ILeaseTransactionV3<LONG>;

export type TBurnTransaction<LONG = string | number> =
    IBurnTransactionV1<LONG>
    | IBurnTransactionV2<LONG>
    | IBurnTransactionV3<LONG>;

export type TReissueTransaction<LONG = string | number> =
    IReissueTransactionV1<LONG>
    | IReissueTransactionV2<LONG>
    | IReissueTransactionV3<LONG>;

export type TCancelLeaseTransaction<LONG = string | number> =
    ICancelLeaseTransactionV1<LONG>
    | ICancelLeaseTransactionV2<LONG>
    | ICancelLeaseTransactionV3<LONG> ;

export type TAliasTransaction<LONG = string | number> =
    IAliasTransactionV1<LONG>
    | IAliasTransactionV2<LONG>
    | IAliasTransactionV3<LONG>;

export type TMassTransferTransaction<LONG = string | number> =
    IMassTransferTransactionV1<LONG>
    | IMassTransferTransactionV2<LONG>

export type TDataTransaction<LONG = string | number> =
    IDataTransactionV1<LONG>
    | IDataTransactionV2<LONG>

export type TSetScriptTransaction<LONG = string | number> =
    ISetScriptTransactionV1<LONG>
    | ISetScriptTransactionV2<LONG>

export type TSponsorshipTransaction<LONG = string | number> =
    ISponsorshipTransactionV1<LONG>
    | ISponsorshipTransactionV2<LONG>

export type TExchangeTransaction<LONG = string | number> =
    IExchangeTransactionV1<LONG>
    | IExchangeTransactionV2<LONG>
    | IExchangeTransactionV3<LONG>;

export type TSetAssetScriptTransaction<LONG = string | number> =
    ISetAssetScriptTransactionV1<LONG>
    | ISetAssetScriptTransactionV2<LONG>

export type TInvokeScriptTransaction<LONG = string | number> =
    IInvokeScriptTransactionV1<LONG>
    | IInvokeScriptTransactionV2<LONG>

export type TUpdateAssetInfoTransaction<LONG = string | number> = IUpdateAssetInfoTransactionV1<LONG>


//---------------------------------------------------------------------------------------------------------------------


export type TIssueTransactionWithId<LONG = string | number> = TIssueTransaction<LONG> & IWithId
export type TTransferTransactionWithId<LONG = string | number> = TTransferTransaction<LONG> & IWithId
export type TReissueTransactionWithId<LONG = string | number> = TReissueTransaction<LONG> & IWithId
export type TBurnTransactionWithId<LONG = string | number> = TBurnTransaction<LONG> & IWithId
export type TLeaseTransactionWithId<LONG = string | number> = TLeaseTransaction<LONG> & IWithId
export type TCancelLeaseTransactionWithId<LONG = string | number> = TCancelLeaseTransaction<LONG> & IWithId
export type TAliasTransactionWithId<LONG = string | number> = TAliasTransaction<LONG> & IWithId
export type TMassTransferTransactionWithId<LONG = string | number> = TMassTransferTransaction<LONG> & IWithId
export type TDataTransactionWithId<LONG = string | number> = TDataTransaction<LONG> & IWithId
export type TSetScriptTransactionWithId<LONG = string | number> = TSetScriptTransaction<LONG> & IWithId
export type TSponsorshipTransactionWithId<LONG = string | number> = TSponsorshipTransaction<LONG> & IWithId
export type TExchangeTransactionWithId<LONG = string | number> = TExchangeTransaction<LONG> & IWithId
export type TSetAssetScriptTransactionWithId<LONG = string | number> = TSetAssetScriptTransaction<LONG> & IWithId
export type TInvokeScriptTransactionWithId<LONG = string | number> = TInvokeScriptTransaction<LONG> & IWithId
export type TUpdateAssetInfoTransactionWithId<LONG = string | number> = TUpdateAssetInfoTransaction<LONG> & IWithId

//---------------------------------------------------------------------------------------------------------------------


