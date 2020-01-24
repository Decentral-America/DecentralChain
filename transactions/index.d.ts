import {
    IInvokeScriptCall,
    IInvokeScriptPayment,
    IMassTransferItem,
    IWithId,
    TDataTransactionEntry,
    TExchangeTransactionOrder,
    TRANSACTION_TYPE,
    TTransactionType,
    TTransferTransactionAttachment,
} from '../src';

export type TBase64Script = string;
export type TBase58Bytes = string;
export type TProofs = Array<string>;
export type TLong = string | number;
export type TAssetDecimals = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ITransaction<LONG = TLong,
    TYPE extends TTransactionType = TTransactionType> {
    type: TYPE;
    senderPublicKey: string;
    timestamp: number;
    fee: LONG;
}

export interface IWithApiMixin extends IWithId {
    sender: string;
    height: number;
}

// type TExtendMap<MAP, EXTEND> = {
//     [Key in keyof MAP]: MAP[Key] & EXTEND;
// }
//
// export type TTransactionFromAPI<LONG = TLong> = TTransaction<LONG> & IWithApiMixin
//
// export type TTransactionFromAPIMap<LONG> = {
//     [Key in keyof TTransactionMap<LONG>]: TTransactionMap<LONG>[Key] & IWithApiMixin
// };


export type TTransaction<LONG = TLong> =
    | IGenesisTransaction<LONG>
    | IPaymentTransaction<LONG>
    | TIssueTransaction<LONG>
    | TTransferTransaction<LONG>
    | TReissueTransaction<LONG>
    | TBurnTransaction<LONG>
    | TLeaseTransaction<LONG>
    | TCancelLeaseTransaction<LONG>
    | TAliasTransaction<LONG>
    | TMassTransferTransaction<LONG>
    | TDataTransaction<LONG>
    | TSetScriptTransaction<LONG>
    | TSponsorshipTransaction<LONG>
    | TExchangeTransaction<LONG>
    | TSetAssetScriptTransaction<LONG>
    | TInvokeScriptTransaction<LONG>
    | TUpdateAssetInfoTransaction<LONG>;

export type TTransactionMap<LONG = TLong> = {
    [TRANSACTION_TYPE.GENESIS]: TGenesisTransaction<LONG>;
    [TRANSACTION_TYPE.PAYMENT]: TPaymentTransaction<LONG>;
    [TRANSACTION_TYPE.ISSUE]: TIssueTransaction<LONG>;
    [TRANSACTION_TYPE.TRANSFER]: TTransferTransaction<LONG>;
    [TRANSACTION_TYPE.REISSUE]: TReissueTransaction<LONG>;
    [TRANSACTION_TYPE.BURN]: TBurnTransaction<LONG>;
    [TRANSACTION_TYPE.LEASE]: TLeaseTransaction<LONG>;
    [TRANSACTION_TYPE.CANCEL_LEASE]: TCancelLeaseTransaction<LONG>;
    [TRANSACTION_TYPE.ALIAS]: TAliasTransaction<LONG>;
    [TRANSACTION_TYPE.MASS_TRANSFER]: TMassTransferTransaction<LONG>;
    [TRANSACTION_TYPE.DATA]: TDataTransaction<LONG>;
    [TRANSACTION_TYPE.SET_SCRIPT]: TSetScriptTransaction<LONG>;
    [TRANSACTION_TYPE.SPONSORSHIP]: TSponsorshipTransaction<LONG>;
    [TRANSACTION_TYPE.EXCHANGE]: TExchangeTransaction<LONG>;
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: TSetAssetScriptTransaction<LONG>;
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: TInvokeScriptTransaction<LONG>;
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: TUpdateAssetInfoTransaction<LONG>;
};

export type TTransactionVersionsMap<LONG = TLong> = {
    [TRANSACTION_TYPE.ISSUE]: TReissueTransactionMap<LONG>;
    [TRANSACTION_TYPE.TRANSFER]: TTransferTransactionMap<LONG>;
    [TRANSACTION_TYPE.REISSUE]: TReissueTransactionMap<LONG>;
    [TRANSACTION_TYPE.BURN]: TBurnTransactionMap<LONG>;
    [TRANSACTION_TYPE.LEASE]: TLeaseTransactionMap<LONG>;
    [TRANSACTION_TYPE.CANCEL_LEASE]: TCancelLeaseTransactionMap<LONG>;
    [TRANSACTION_TYPE.ALIAS]: TAliasTransactionMap<LONG>;
    [TRANSACTION_TYPE.MASS_TRANSFER]: TMassTransferTransactionMap<LONG>;
    [TRANSACTION_TYPE.DATA]: TDataTransactionMap<LONG>;
    [TRANSACTION_TYPE.SET_SCRIPT]: TSetScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.SPONSORSHIP]: TSponsorshipTransactionMap<LONG>;
    [TRANSACTION_TYPE.EXCHANGE]: TExchangeTransactionMap<LONG>;
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: TSetAssetScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: TInvokeScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: TUpdateAssetInfoTransactionMap<LONG>;
};

export interface IGenesisTransaction<LONG = TLong>
    extends Omit<ITransaction<LONG, typeof TRANSACTION_TYPE.GENESIS>, 'senderPublicKey'> {
    signature: string
    recipient: string
    amount: LONG
}

export interface IPaymentTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.PAYMENT> {
    sender: string
    recipient: string
    amount: LONG
    signature: string
}

export interface IIssueTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.ISSUE> {
    name: string;
    description: string;
    decimals: TAssetDecimals;
    quantity: LONG;
    reissuable: boolean;
    chainId: number;
    script: TBase64Script | null;
}

export interface ITransferTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.TRANSFER> {
    recipient: string;
    amount: LONG;
    feeAssetId: string | null;
    assetId: string | null;
    // attachment: TBase58Bytes | TTransferTransactionAttachment;
}

export interface IReissueTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.REISSUE> {
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
    chainId: number;
}

export interface IBurnTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.BURN> {
    assetId: string;
    quantity: LONG;
    chainId: number;
}

export interface ILeaseTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.LEASE> {
    amount: LONG;
    recipient: string;
}

export interface ICancelLeaseTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.CANCEL_LEASE> {
    leaseId: string;
    chainId: number;
}

export interface IAliasTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.ALIAS> {
    alias: string;
}

export interface IMassTransferTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.MASS_TRANSFER> {
    transfers: Array<IMassTransferItem<LONG>>;
    assetId: string | null;
}

export interface IDataTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.DATA> {
    data: Array<TDataTransactionEntry<LONG>>;
}

export interface IExchangeTransaction<LONG>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.EXCHANGE> {
    order1: TExchangeTransactionOrder
    order2: TExchangeTransactionOrder
    price: LONG;
    amount: LONG;
    buyMatcherFee: LONG;
    sellMatcherFee: LONG;
}

export interface ISetScriptTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.SET_SCRIPT> {
    script: TBase64Script | null;
    chainId: number;
}

export interface ISponsorshipTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.SPONSORSHIP> {
    assetId: string;
    minSponsoredAssetFee: LONG;
}

export interface ISetAssetScriptTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT> {
    chainId: number;
    assetId: string;
    script: TBase64Script;
}

export interface IInvokeScriptTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.INVOKE_SCRIPT> {
    chainId: number;
    dApp: string;
    call: IInvokeScriptCall<LONG> | null;
    feeAssetId: string | null;
    payment: Array<IInvokeScriptPayment<LONG>> | null;
}

export interface IUpdateAssetInfoTransaction<LONG = TLong>
    extends ITransaction<LONG, typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO> {
    type: typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO;
    assetId: string;
    name: string;
    description: string;
    chainId: number;
    feeAssetId: string | null;
}

//---------------------------------------------------------------------------------------------------------------------


//IssueTransaction
export interface IIssueTransactionV1<LONG = TLong> extends IIssueTransaction<LONG> {
    version: 1;
}

export interface IIssueTransactionV2<LONG = TLong> extends IIssueTransaction<LONG> {
    version: 2;
    chainId: number;
}

export interface IIssueTransactionV3<LONG = TLong> extends IIssueTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId: string | null;
}

export type TIssueTransactionMap<LONG = TLong> = {
    1: IIssueTransactionV1<LONG>;
    2: IIssueTransactionV2<LONG>;
    3: IIssueTransactionV3<LONG>;
};

//TransferTransaction
export interface ITransferTransactionV1<LONG>
    extends ITransferTransaction<LONG> {
    version: 1;
    attachment: TBase58Bytes;
}

export interface ITransferTransactionV2<LONG>
    extends ITransferTransaction<LONG> {
    version: 2;
    attachment: TBase58Bytes;
}

export interface ITransferTransactionV3<LONG>
    extends ITransferTransaction<LONG> {
    version: 3;
    chainId: number;
    attachment: TTransferTransactionAttachment;
}

export type TTransferTransactionMap<LONG = TLong> = {
    1: ITransferTransactionV1<LONG>;
    2: ITransferTransactionV2<LONG>;
    3: ITransferTransactionV3<LONG>;
}

//LeaseTransaction
export interface ILeaseTransactionV1<LONG> extends ILeaseTransaction<LONG> {
    version: 1;
}

export interface ILeaseTransactionV2<LONG> extends ILeaseTransaction<LONG> {
    version: 2;
}

export interface ILeaseTransactionV3<LONG> extends ILeaseTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId: string | null;
}

export type TLeaseTransactionMap<LONG = TLong> = {
    1: ILeaseTransactionV1<LONG>;
    2: ILeaseTransactionV2<LONG>;
    3: ILeaseTransactionV3<LONG>;
}

//BurnTransaction
export interface IBurnTransactionV1<LONG> extends IBurnTransaction<LONG> {
    version: 1;
}

export interface IBurnTransactionV2<LONG> extends IBurnTransaction<LONG> {
    version: 2;
    chainId: number;
}

export interface IBurnTransactionV3<LONG> extends IBurnTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId?: string | null;
}

export type TBurnTransactionMap<LONG = TLong> = {
    1: IBurnTransactionV1<LONG>;
    2: IBurnTransactionV2<LONG>;
    3: IBurnTransactionV3<LONG>;
}

//IReissueTransaction
export interface IReissueTransactionV1<LONG> extends IReissueTransaction<LONG> {
    version: 1;
}

export interface IReissueTransactionV2<LONG> extends IReissueTransaction<LONG> {
    version: 2;
    chainId: number;
}

export interface IReissueTransactionV3<LONG> extends IReissueTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId: string | null;
}

export type TReissueTransactionMap<LONG = TLong> = {
    1: IReissueTransactionV1<LONG>;
    2: IReissueTransactionV2<LONG>;
    3: IReissueTransactionV3<LONG>;
}

//ICancelLeaseTransaction
export interface ICancelLeaseTransactionV1<LONG>
    extends ICancelLeaseTransaction<LONG> {
    version: 1;
}

export interface ICancelLeaseTransactionV2<LONG>
    extends ICancelLeaseTransaction<LONG> {
    version: 2;
    chainId: number;
}

export interface ICancelLeaseTransactionV3<LONG>
    extends ICancelLeaseTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId?: string | null;
}

export type TCancelLeaseTransactionMap<LONG = TLong> = {
    1: ICancelLeaseTransactionV1<LONG>;
    2: ICancelLeaseTransactionV2<LONG>;
    3: ICancelLeaseTransactionV3<LONG>;
}

//IAliasTransaction
export interface IAliasTransactionV1<LONG> extends IAliasTransaction<LONG> {
    version: 1;
}

export interface IAliasTransactionV2<LONG> extends IAliasTransaction<LONG> {
    version: 2;
}

export interface IAliasTransactionV3<LONG> extends IAliasTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId?: string | null;
}

export type TAliasTransactionMap<LONG = TLong> = {
    1: IAliasTransactionV1<LONG>;
    2: IAliasTransactionV2<LONG>;
    3: IAliasTransactionV3<LONG>;
}

//IMassTransferTransaction
export interface IMassTransferTransactionV1<LONG>
    extends IMassTransferTransaction<LONG> {
    version: 1;
    attachment: TBase58Bytes;
}

export interface IMassTransferTransactionV2<LONG>
    extends IMassTransferTransaction<LONG> {
    version: 2;
    chainId: number;
    feeAssetId?: string | null;
    attachment: TTransferTransactionAttachment;
}

export type TMassTransferTransactionMap<LONG = TLong> = {
    1: IMassTransferTransactionV1<LONG>;
    2: IMassTransferTransactionV2<LONG>;
}

//IDataTransaction
export interface IDataTransactionV1<LONG> extends IDataTransaction<LONG> {
    version: 1;
}

export interface IDataTransactionV2<LONG> extends IDataTransaction<LONG> {
    version: 2;
    chainId: number;
    feeAssetId: string | null;
}

export type TDataTransactionMap<LONG = TLong> = {
    1: IDataTransactionV1<LONG>;
    2: IDataTransactionV2<LONG>;
}

//ISetScriptTransaction
export interface ISetScriptTransactionV1<LONG>
    extends ISetScriptTransaction<LONG> {
    version: 1;
}

export interface ISetScriptTransactionV2<LONG>
    extends ISetScriptTransaction<LONG> {
    version: 2;
    chainId: number;
    feeAssetId: string | null;
}

export type TSetScriptTransactionMap<LONG = TLong> = {
    1: ISetScriptTransactionV1<LONG>;
    2: ISetScriptTransactionV2<LONG>;
}

//ISponsorshipTransaction
export interface ISponsorshipTransactionV1<LONG>
    extends ISponsorshipTransaction<LONG> {
    version: 1;
}

export interface ISponsorshipTransactionV2<LONG>
    extends ISponsorshipTransaction<LONG> {
    version: 2;
    chainId: number;
    feeAssetId?: string | null;
}

export type TSponsorshipTransactionMap<LONG = TLong> = {
    1: ISponsorshipTransactionV1<LONG>;
    2: ISponsorshipTransactionV2<LONG>;
}

//IExchangeTransaction // TODO maybe create map by version for check orders version?
export interface IExchangeTransactionV1<LONG>
    extends IExchangeTransaction<LONG> {
    version: 1;
}

export interface IExchangeTransactionV2<LONG>
    extends IExchangeTransaction<LONG> {
    version: 2;
}

export interface IExchangeTransactionV3<LONG = TLong>
    extends IExchangeTransaction<LONG> {
    version: 3;
    chainId: number;
    feeAssetId?: string | null;
}

export type TExchangeTransactionMap<LONG = TLong> = {
    1: IExchangeTransactionV1<LONG>;
    2: IExchangeTransactionV2<LONG>;
    3: IExchangeTransactionV3<LONG>;
}


//ISetAssetScriptTransaction
export interface ISetAssetScriptTransactionV1<LONG>
    extends ISetAssetScriptTransaction<LONG> {
    version: 1;
}

export interface ISetAssetScriptTransactionV2<LONG>
    extends ISetAssetScriptTransaction<LONG> {
    version: 2;
    chainId: number;
    feeAssetId?: string | null;
}

export type TSetAssetScriptTransactionMap<LONG = TLong> = {
    1: ISetAssetScriptTransactionV1<LONG>;
    2: ISetAssetScriptTransactionV2<LONG>;
}

//IInvokeScriptTransaction
export interface IInvokeScriptTransactionV1<LONG>
    extends IInvokeScriptTransaction<LONG> {
    version: 1;
}

export interface IInvokeScriptTransactionV2<LONG>
    extends IInvokeScriptTransaction<LONG> {
    version: 2;
    chainId: number;
}

export type TInvokeScriptTransactionMap<LONG = TLong> = {
    1: IInvokeScriptTransactionV1<LONG>;
    2: IInvokeScriptTransactionV2<LONG>;
}

//IUpdateAssetInfoTransaction
export interface IUpdateAssetInfoTransactionV1<LONG>
    extends IUpdateAssetInfoTransaction<LONG> {
    version: 1;
    chainId: number;
}

export type TUpdateAssetInfoTransactionMap<LONG = TLong> = {
    1: IUpdateAssetInfoTransactionV1<LONG>;
}

export type TGenesisTransaction<LONG = TLong> = IGenesisTransaction<LONG>

export type TPaymentTransaction<LONG = TLong> = IPaymentTransaction<LONG>

export type TIssueTransaction<LONG = TLong> =
    | IIssueTransactionV1<LONG>
    | IIssueTransactionV2<LONG>
    | IIssueTransactionV3<LONG>;

export type TTransferTransaction<LONG = TLong> =
    | ITransferTransactionV1<LONG>
    | ITransferTransactionV2<LONG>
    | ITransferTransactionV3<LONG>;

export type TLeaseTransaction<LONG = TLong> =
    | ILeaseTransactionV1<LONG>
    | ILeaseTransactionV2<LONG>
    | ILeaseTransactionV3<LONG>;

export type TBurnTransaction<LONG = TLong> =
    | IBurnTransactionV1<LONG>
    | IBurnTransactionV2<LONG>
    | IBurnTransactionV3<LONG>;

export type TReissueTransaction<LONG = TLong> =
    | IReissueTransactionV1<LONG>
    | IReissueTransactionV2<LONG>
    | IReissueTransactionV3<LONG>;

export type TCancelLeaseTransaction<LONG = TLong> =
    | ICancelLeaseTransactionV1<LONG>
    | ICancelLeaseTransactionV2<LONG>
    | ICancelLeaseTransactionV3<LONG>;

export type TAliasTransaction<LONG = TLong> =
    | IAliasTransactionV1<LONG>
    | IAliasTransactionV2<LONG>
    | IAliasTransactionV3<LONG>;

export type TMassTransferTransaction<LONG = TLong> =
    | IMassTransferTransactionV1<LONG>
    | IMassTransferTransactionV2<LONG>;

export type TDataTransaction<LONG = TLong> =
    | IDataTransactionV1<LONG>
    | IDataTransactionV2<LONG>;

export type TSetScriptTransaction<LONG = TLong> =
    | ISetScriptTransactionV1<LONG>
    | ISetScriptTransactionV2<LONG>;

export type TSponsorshipTransaction<LONG = TLong> =
    | ISponsorshipTransactionV1<LONG>
    | ISponsorshipTransactionV2<LONG>;

export type TExchangeTransaction<LONG = TLong> =
    | IExchangeTransactionV1<LONG>
    | IExchangeTransactionV2<LONG>
    | IExchangeTransactionV3<LONG>;

export type TSetAssetScriptTransaction<LONG = TLong> =
    | ISetAssetScriptTransactionV1<LONG>
    | ISetAssetScriptTransactionV2<LONG>;

export type TInvokeScriptTransaction<LONG = TLong> =
    | IInvokeScriptTransactionV1<LONG>
    | IInvokeScriptTransactionV2<LONG>;

export type TUpdateAssetInfoTransaction<LONG = TLong> = IUpdateAssetInfoTransactionV1<LONG>;

//
type TWithSignatureMap = {
    [TRANSACTION_TYPE.GENESIS]: 1;
    [TRANSACTION_TYPE.PAYMENT]: 1;
    [TRANSACTION_TYPE.ISSUE]: 1;
    [TRANSACTION_TYPE.TRANSFER]: 1;
    [TRANSACTION_TYPE.REISSUE]: 1;
    [TRANSACTION_TYPE.BURN]: 1;
    [TRANSACTION_TYPE.EXCHANGE]: 1;
    [TRANSACTION_TYPE.LEASE]: 1;
    [TRANSACTION_TYPE.CANCEL_LEASE]: 1;
    [TRANSACTION_TYPE.ALIAS]: 1;
}

export type TSignedTransaction<TX extends TTransaction<unknown>> = TX & (
    TX extends { version: 1 }
        ? TX['type'] extends keyof TWithSignatureMap ? { signature: string } : { proofs: Array<string> }
        : { proofs: Array<string> }
    )
declare const s: TSignedTransaction<IIssueTransactionV3>;
