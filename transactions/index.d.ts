import { TRANSACTION_TYPE, TTransactionType } from '../src';
import {
    IExchangeTransactionOrder, IInvokeScriptCall, IInvokeScriptPayment,
    IMassTransferItem,
    IWithId,
    IWithProofs,
    TDataTransactionEntry
} from '../src/parts';


export type TBase64Script = string;
export type TBase58Bytes = string;
export type TProofs = Array<string>;

export interface IWithApiMixin extends IWithId, IWithProofs {
    sender: string;
    height?: number;
}

type TExtendMap<MAP, EXTEND> = {
    [Key in keyof MAP]: MAP[Key] & EXTEND;
}


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
    ISetAssetScriptTransaction<LONG> |
    IInvokeScriptTransaction<LONG> |
    IUpdateAssetInfoTransaction<LONG>;

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
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScriptTransaction<LONG>,
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: IInvokeScriptTransaction<LONG>,
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: IUpdateAssetInfoTransaction<LONG>
};

export type TTransactionWithId<LONG> = TTransaction<LONG> & IWithId;
export type TTransactionWithIdMap<LONG> = TExtendMap<TTransactionMap<LONG>, IWithId>;
export type TTransactionWithProofs<LONG> = TTransaction<LONG> & IWithProofs;
export type TTransactionWithProofsMap<LONG> = TExtendMap<TTransactionMap<LONG>, IWithProofs>;
export type TTransactionFromAPI<LONG> = TTransaction<LONG> & IWithApiMixin;
export type TTransactionFromAPIMap<LONG> = TExtendMap<TTransactionMap<LONG>, IWithApiMixin>;

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
    assetId: string | null;
    attachment: TBase58Bytes;
}

export interface IDataTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.DATA> {
    data: Array<TDataTransactionEntry<LONG>>;
}

export interface IExchangeTransaction<LONG> extends ITransaction<LONG, typeof TRANSACTION_TYPE.EXCHANGE> {
    buyOrder: IExchangeTransactionOrder<LONG> & IWithProofs;
    sellOrder: IExchangeTransactionOrder<LONG> & IWithProofs;
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
    assetId: string;
    name: string;
    description: string;
}

export interface IIssueTransactionWithId<LONG> extends IIssueTransaction<LONG>, IWithId {
}

export interface ITransferTransactionWithId<LONG> extends ITransferTransaction<LONG>, IWithId {
}

export interface IReissueTransactionWithId<LONG> extends IReissueTransaction<LONG>, IWithId {
}

export interface IBurnTransactionWithId<LONG> extends IBurnTransaction<LONG>, IWithId {
}

export interface ILeaseTransactionWithId<LONG> extends ILeaseTransaction<LONG>, IWithId {
}

export interface ICancelLeaseTransactionWithId<LONG> extends ICancelLeaseTransaction<LONG>, IWithId {
}

export interface IAliasTransactionWithId<LONG> extends IAliasTransaction<LONG>, IWithId {
}

export interface IMassTransferTransactionWithId<LONG> extends IMassTransferTransaction<LONG>, IWithId {
}

export interface IDataTransactionWithId<LONG> extends IDataTransaction<LONG>, IWithId {
}

export interface ISetScriptTransactionWithId<LONG> extends ISetScriptTransaction<LONG>, IWithId {
}

export interface ISponsorshipTransactionWithId<LONG> extends ISponsorshipTransaction<LONG>, IWithId {
}

export interface IExchangeTransactionWithId<LONG> extends IExchangeTransaction<LONG>, IWithId {
}

export interface ISetAssetScriptTransactionWithId<LONG> extends ISetAssetScriptTransaction<LONG>, IWithId {
}

export interface IInvokeScriptTransactionWithId<LONG> extends IInvokeScriptTransaction<LONG>, IWithId {
}

export interface IUpdateAssetInfoTransactionWithId<LONG> extends IUpdateAssetInfoTransaction<LONG>, IWithId {
}

export interface IIssueTransactionWithProofs<LONG> extends IIssueTransaction<LONG>, IWithProofs {
}

export interface ITransferTransactionWithProofs<LONG> extends ITransferTransaction<LONG>, IWithProofs {
}

export interface IReissueTransactionWithProofs<LONG> extends IReissueTransaction<LONG>, IWithProofs {
}

export interface IBurnTransactionWithProofs<LONG> extends IBurnTransaction<LONG>, IWithProofs {
}

export interface ILeaseTransactionWithProofs<LONG> extends ILeaseTransaction<LONG>, IWithProofs {
}

export interface ICancelLeaseTransactionWithProofs<LONG> extends ICancelLeaseTransaction<LONG>, IWithProofs {
}

export interface IAliasTransactionWithProofs<LONG> extends IAliasTransaction<LONG>, IWithProofs {
}

export interface IMassTransferTransactionWithProofs<LONG> extends IMassTransferTransaction<LONG>, IWithProofs {
}

export interface IDataTransactionWithProofs<LONG> extends IDataTransaction<LONG>, IWithProofs {
}

export interface ISetScriptTransactionWithProofs<LONG> extends ISetScriptTransaction<LONG>, IWithProofs {
}

export interface ISponsorshipTransactionWithProofs<LONG> extends ISponsorshipTransaction<LONG>, IWithProofs {
}

export interface IExchangeTransactionWithProofs<LONG> extends IExchangeTransaction<LONG>, IWithProofs {
}

export interface ISetAssetScriptTransactionWithProofs<LONG> extends ISetAssetScriptTransaction<LONG>, IWithProofs {
}

export interface IInvokeScriptTransactionWithProofs<LONG> extends IInvokeScriptTransaction<LONG>, IWithProofs {
}

export interface IUpdateAssetInfoTransactionWithProofs<LONG> extends IUpdateAssetInfoTransaction<LONG>, IWithProofs {
}
