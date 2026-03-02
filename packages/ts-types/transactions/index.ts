import type { Long, TRANSACTION_TYPE, TransactionType } from '../src';
import type {
    AliasTransaction,
    AliasTransactionFromNode,
    AliasTransactionMap,
} from './alias';
import type {
    BurnTransaction,
    BurnTransactionFromNode,
    BurnTransactionMap,
} from './burn';
import type {
    CancelLeaseTransaction,
    CancelLeaseTransactionFromNode,
    CancelLeaseTransactionMap,
} from './cancel-lease';
import type {
    CommitToGenerationTransaction,
    CommitToGenerationTransactionFromNode,
    CommitToGenerationTransactionMap,
} from './commit-to-generation';
import type {
    DataTransaction,
    DataTransactionFromNode,
    DataTransactionMap,
} from './data';
import type {
    EthereumTransaction,
    EthereumTransactionMap,
} from './ethereum';
import type {
    ExchangeTransaction,
    ExchangeTransactionFromNode,
    ExchangeTransactionMap,
} from './exchange';
import type {
    GenesisTransaction,
    GenesisTransactionFromNode,
    GenesisTransactionMap,
} from './genesis';
import type {
    InvokeScriptTransaction,
    InvokeScriptTransactionFromNode,
    InvokeScriptTransactionMap,
} from './invoke-script';
import type {
    IssueTransaction,
    IssueTransactionFromNode,
    IssueTransactionMap,
} from './issue';
import type {
    LeaseTransaction,
    LeaseTransactionFromNode,
    LeaseTransactionMap,
} from './lease';
import type {
    MassTransferTransaction,
    MassTransferTransactionFromNode,
    MassTransferTransactionMap,
} from './mass-transfer';
import type {
    PaymentTransaction,
    PaymentTransactionFromNode,
    PaymentTransactionMap,
} from './payment';
import type {
    ReissueTransaction,
    ReissueTransactionFromNode,
    ReissueTransactionMap,
} from './reissue';
import type {
    SetAssetScriptTransaction,
    SetAssetScriptTransactionFromNode,
    SetAssetScriptTransactionMap,
} from './set-asset-script';
import type {
    SetScriptTransaction,
    SetScriptTransactionFromNode,
    SetScriptTransactionMap,
} from './set-script';
import type {
    SponsorshipTransaction,
    SponsorshipTransactionFromNode,
    SponsorshipTransactionMap,
} from './sponsorship';
import type {
    TransferTransaction,
    TransferTransactionFromNode,
    TransferTransactionMap,
} from './transfer';
import type {
    UpdateAssetInfoTransaction,
    UpdateAssetInfoTransactionFromNode,
    UpdateAssetInfoTransactionMap,
} from './update-asset-info';

export type BaseTransaction<
    LONG = Long,
    TYPE extends TransactionType = TransactionType
> = {
    type: TYPE;
    chainId: number;
    senderPublicKey: string;
    timestamp: number;
    fee: LONG;
};

export type Transaction<LONG = Long> =
    | GenesisTransaction<LONG>
    | PaymentTransaction<LONG>
    | IssueTransaction<LONG>
    | TransferTransaction<LONG>
    | ReissueTransaction<LONG>
    | BurnTransaction<LONG>
    | LeaseTransaction<LONG>
    | CancelLeaseTransaction<LONG>
    | AliasTransaction<LONG>
    | MassTransferTransaction<LONG>
    | DataTransaction<LONG>
    | SetScriptTransaction<LONG>
    | SponsorshipTransaction<LONG>
    | ExchangeTransaction<LONG>
    | SetAssetScriptTransaction<LONG>
    | InvokeScriptTransaction<LONG>
    | UpdateAssetInfoTransaction<LONG>
    | CommitToGenerationTransaction<LONG>;

export type TransactionMap<LONG = Long> = {
    [TRANSACTION_TYPE.GENESIS]: GenesisTransaction<LONG>;
    [TRANSACTION_TYPE.PAYMENT]: PaymentTransaction<LONG>;
    [TRANSACTION_TYPE.ISSUE]: IssueTransaction<LONG>;
    [TRANSACTION_TYPE.TRANSFER]: TransferTransaction<LONG>;
    [TRANSACTION_TYPE.REISSUE]: ReissueTransaction<LONG>;
    [TRANSACTION_TYPE.BURN]: BurnTransaction<LONG>;
    [TRANSACTION_TYPE.LEASE]: LeaseTransaction<LONG>;
    [TRANSACTION_TYPE.CANCEL_LEASE]: CancelLeaseTransaction<LONG>;
    [TRANSACTION_TYPE.ALIAS]: AliasTransaction<LONG>;
    [TRANSACTION_TYPE.MASS_TRANSFER]: MassTransferTransaction<LONG>;
    [TRANSACTION_TYPE.DATA]: DataTransaction<LONG>;
    [TRANSACTION_TYPE.SET_SCRIPT]: SetScriptTransaction<LONG>;
    [TRANSACTION_TYPE.SPONSORSHIP]: SponsorshipTransaction<LONG>;
    [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction<LONG>;
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: SetAssetScriptTransaction<LONG>;
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: InvokeScriptTransaction<LONG>;
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction<LONG>;
    [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: CommitToGenerationTransaction<LONG>;
};

export type TransactionVersionsMap<LONG = Long> = {
    [TRANSACTION_TYPE.GENESIS]: GenesisTransactionMap<LONG>;
    [TRANSACTION_TYPE.PAYMENT]: PaymentTransactionMap<LONG>;
    [TRANSACTION_TYPE.ISSUE]: IssueTransactionMap<LONG>;
    [TRANSACTION_TYPE.TRANSFER]: TransferTransactionMap<LONG>;
    [TRANSACTION_TYPE.REISSUE]: ReissueTransactionMap<LONG>;
    [TRANSACTION_TYPE.BURN]: BurnTransactionMap<LONG>;
    [TRANSACTION_TYPE.LEASE]: LeaseTransactionMap<LONG>;
    [TRANSACTION_TYPE.CANCEL_LEASE]: CancelLeaseTransactionMap<LONG>;
    [TRANSACTION_TYPE.ALIAS]: AliasTransactionMap<LONG>;
    [TRANSACTION_TYPE.MASS_TRANSFER]: MassTransferTransactionMap<LONG>;
    [TRANSACTION_TYPE.DATA]: DataTransactionMap<LONG>;
    [TRANSACTION_TYPE.SET_SCRIPT]: SetScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.SPONSORSHIP]: SponsorshipTransactionMap<LONG>;
    [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransactionMap<LONG>;
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: SetAssetScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: InvokeScriptTransactionMap<LONG>;
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransactionMap<LONG>;
    [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: CommitToGenerationTransactionMap<LONG>;
};

export type Omit<A extends Record<string, any>, B extends keyof A> = {
    [Key in Exclude<keyof A, B>]: A[Key];
};

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
};

type WithSignature = {
    signature: string;
};

type WithProofs = {
    proofs: Array<string>;
};

export type SignedTransaction<TX extends Transaction<any>> = TX &
    (TX['type'] extends keyof TWithSignatureMap
        ? TX['version'] extends TWithSignatureMap[TX['type']]
            ? WithSignature
            : WithProofs
        : WithProofs);

export type TransactionFromNode<LONG = Long> =
    | GenesisTransactionFromNode<LONG>
    | PaymentTransactionFromNode<LONG>
    | IssueTransactionFromNode<LONG>
    | TransferTransactionFromNode<LONG>
    | ReissueTransactionFromNode<LONG>
    | BurnTransactionFromNode<LONG>
    | ExchangeTransactionFromNode<LONG>
    | LeaseTransactionFromNode<LONG>
    | CancelLeaseTransactionFromNode<LONG>
    | AliasTransactionFromNode<LONG>
    | MassTransferTransactionFromNode<LONG>
    | DataTransactionFromNode<LONG>
    | SetScriptTransactionFromNode<LONG>
    | SponsorshipTransactionFromNode<LONG>
    | SetAssetScriptTransactionFromNode<LONG>
    | InvokeScriptTransactionFromNode<LONG>
    | UpdateAssetInfoTransactionFromNode<LONG>
    | CommitToGenerationTransactionFromNode<LONG>;

export type {
    AliasTransactionFields,
    AliasTransactionV1,
    AliasTransactionV2,
    AliasTransactionV3,
    AliasTransactionMap,
    AliasTransaction,
    AliasTransactionFromNode,
} from './alias';
export type {
    BurnTransactionFields,
    BurnTransactionV1,
    BurnTransactionV2,
    BurnTransactionV3,
    BurnTransactionMap,
    BurnTransaction,
    BurnTransactionFromNode,
} from './burn';
export type {
    CancelLeaseTransactionFields,
    CancelLeaseTransactionV1,
    CancelLeaseTransactionV2,
    CancelLeaseTransactionV3,
    CancelLeaseTransactionMap,
    CancelLeaseTransaction,
    CancelLeaseTransactionFromNode,
} from './cancel-lease';
export type {
    CommitToGenerationTransactionFields,
    CommitToGenerationTransactionV1,
    CommitToGenerationTransactionMap,
    CommitToGenerationTransaction,
    CommitToGenerationTransactionFromNode,
} from './commit-to-generation';
export type {
    DataTransactionFields,
    DataTransactionV1,
    DataTransactionV2,
    DataTransactionMap,
    DataTransaction,
    DataTransactionFromNode,
} from './data';
export type {
    EthereumTransactionFields,
    EthereumTransactionV1,
    EthereumTransactionMap,
    EthereumTransaction,
} from './ethereum';
export type {
    ExchangeTransactionFields,
    ExchangeTransactionV1,
    ExchangeTransactionV2,
    ExchangeTransactionV3,
    ExchangeTransactionMap,
    ExchangeTransaction,
    ExchangeTransactionFromNode,
} from './exchange';
export type {
    GenesisTransactionFields,
    GenesisTransactionV1,
    GenesisTransactionMap,
    GenesisTransaction,
    GenesisTransactionFromNode,
} from './genesis';
export type {
    InvokeScriptTransactionFields,
    InvokeScriptTransactionV1,
    InvokeScriptTransactionV2,
    InvokeScriptTransactionMap,
    InvokeScriptTransaction,
    InvokeScriptTransactionFromNode,
} from './invoke-script';
export type {
    IssueTransactionFields,
    IssueTransactionV1,
    IssueTransactionV2,
    IssueTransactionV3,
    IssueTransactionMap,
    IssueTransaction,
    IssueTransactionFromNode,
} from './issue';
export type {
    LeaseTransactionFields,
    LeaseTransactionV1,
    LeaseTransactionV2,
    LeaseTransactionV3,
    LeaseTransactionMap,
    LeaseTransaction,
    LeaseTransactionFromNode,
} from './lease';
export type {
    MassTransferTransactionFields,
    MassTransferTransactionV1,
    MassTransferTransactionV2,
    MassTransferTransactionMap,
    MassTransferTransaction,
    MassTransferTransactionFromNode,
} from './mass-transfer';
export type {
    PaymentTransactionFields,
    PaymentTransactionV1,
    PaymentTransactionMap,
    PaymentTransaction,
    PaymentTransactionFromNode,
} from './payment';
export type {
    ReissueTransactionFields,
    ReissueTransactionV1,
    ReissueTransactionV2,
    ReissueTransactionV3,
    ReissueTransactionMap,
    ReissueTransaction,
    ReissueTransactionFromNode,
} from './reissue';
export type {
    SetAssetScriptTransactionFields,
    SetAssetScriptTransactionV1,
    SetAssetScriptTransactionV2,
    SetAssetScriptTransactionMap,
    SetAssetScriptTransaction,
    SetAssetScriptTransactionFromNode,
} from './set-asset-script';
export type {
    SetScriptTransactionFields,
    SetScriptTransactionV1,
    SetScriptTransactionV2,
    SetScriptTransactionMap,
    SetScriptTransaction,
    SetScriptTransactionFromNode,
} from './set-script';
export type {
    SponsorshipTransactionFields,
    SponsorshipTransactionV1,
    SponsorshipTransactionV2,
    SponsorshipTransactionMap,
    SponsorshipTransaction,
    SponsorshipTransactionFromNode,
} from './sponsorship';
export type {
    TransferTransactionFields,
    TransferTransactionV1,
    TransferTransactionV2,
    TransferTransactionV3,
    TransferTransactionMap,
    TransferTransaction,
    TransferTransactionFromNode,
} from './transfer';
export type {
    UpdateAssetInfoTransactionFields,
    UpdateAssetInfoTransactionV1,
    UpdateAssetInfoTransactionMap,
    UpdateAssetInfoTransaction,
    UpdateAssetInfoTransactionFromNode,
} from './update-asset-info';
