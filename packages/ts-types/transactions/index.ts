import {
    InvokeScriptCall,
    InvokeScriptPayment,
    MassTransferItem,
    DataTransactionEntry,
    ExchangeTransactionOrder,
    TRANSACTION_TYPE,
    TransactionType,
    Long,
    AssetDecimals,
    Base64Script,
    Base58Bytes,
    WithVersion,
    SignedIExchangeTransactionOrder,
} from '../src';

export type BaseTransaction<LONG = Long, TYPE extends TransactionType = TransactionType> = {
    type: TYPE;
    chainId: number;
    senderPublicKey: string;
    timestamp: number;
    fee: LONG;
}

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
    | UpdateAssetInfoTransaction<LONG>;

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
};

type Omit<A extends Record<string, any>, B extends keyof A> = {
    [Key in Exclude<keyof A, B>]: A[Key]
}

export type GenesisTransactionFields<LONG = Long> = {
    recipient: string;
    amount: LONG;
}

export type PaymentTransactionFields<LONG = Long> = {
    sender: string;
    recipient: string;
    amount: LONG;
}

export type IssueTransactionFields<LONG = Long> = {
    name: string;
    description: string;
    decimals: AssetDecimals;
    quantity: LONG;
    reissuable: boolean;
    script: Base64Script | null;
}

export type TransferTransactionFields<LONG = Long> = {
    recipient: string;
    amount: LONG;
    feeAssetId: string | null;
    assetId: string | null;
    attachment: Base58Bytes | null;
}

export type ReissueTransactionFields<LONG = Long> = {
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
}

export type BurnTransactionFields<LONG = Long> = {
    assetId: string;
    amount: LONG;
}

export type LeaseTransactionFields<LONG = Long> = {
    amount: LONG;
    recipient: string;
}

export type CancelLeaseTransactionFields<LONG = Long> = {
    leaseId: string;
}

export type AliasTransactionFields<LONG = Long> = {
    alias: string;
}

export type MassTransferTransactionFields<LONG = Long> = {
    attachment: string;
    transfers: Array<MassTransferItem<LONG>>;
    assetId: string | null;
}

export type DataTransactionFields<LONG = Long> = {
    data: Array<DataTransactionEntry<LONG>>;
}

export type ExchangeTransactionFields<LONG = Long> = {
    order1: SignedIExchangeTransactionOrder<ExchangeTransactionOrder<LONG>>;
    order2: SignedIExchangeTransactionOrder<ExchangeTransactionOrder<LONG>>;
    price: LONG;
    amount: LONG;
    buyMatcherFee: LONG;
    sellMatcherFee: LONG;
}

export type SetScriptTransactionFields<LONG = Long> = {
    script: Base64Script | null;
}


export type SponsorshipTransactionFields<LONG = Long> = {
    assetId: string;
    minSponsoredAssetFee: LONG;
}

export type SetAssetScriptTransactionFields<LONG = Long> = {
    assetId: string;
    script: Base64Script;
}

export type InvokeScriptTransactionFields<LONG = Long> = {
    dApp: string;
    call: InvokeScriptCall<LONG> | null;
    feeAssetId: string | null;
    payment: Array<InvokeScriptPayment<LONG>> | null;
}

export type UpdateAssetInfoTransactionFields<LONG = Long> = {
    assetId: string;
    name: string;
    description: string;
    feeAssetId: string | null;
}

export interface IUpdateAssetInfoTransaction<LONG = Long> extends BaseTransaction<LONG, typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO>,
    UpdateAssetInfoTransactionFields<LONG> {
}

//--------------------------------------------------------------------------------------------------------------------

//GenesisTransaction
export type GenesisTransactionV1<LONG> = WithVersion<GenesisTransactionFields<LONG> & Omit<BaseTransaction<LONG, 1>, 'senderPublicKey'>, 1>;
export type GenesisTransactionMap<LONG = Long> = {
    1: GenesisTransactionV1<LONG>;
};

//PaymentTransaction
export type PaymentTransactionV1<LONG> = WithVersion<PaymentTransactionFields<LONG> & BaseTransaction<LONG, 2>, 1>;

export type PaymentTransactionMap<LONG = Long> = {
    1: PaymentTransactionV1<LONG>;
};

//IssueTransaction
export type IssueTransactionV1<LONG = Long> = WithVersion<IssueTransactionFields<LONG> & BaseTransaction<LONG, 3>, 1>;
export type IssueTransactionV2<LONG = Long> = WithVersion<IssueTransactionFields<LONG> & BaseTransaction<LONG, 3>, 2>;
export type IssueTransactionV3<LONG = Long> = WithVersion<IssueTransactionFields<LONG> & BaseTransaction<LONG, 3> & {
    feeAssetId: string | null
}, 3>;

export type IssueTransactionMap<LONG = Long> = {
    1: IssueTransactionV1<LONG>;
    2: IssueTransactionV2<LONG>;
    3: IssueTransactionV3<LONG>;
};

//TransferTransaction
export type TransferTransactionV1<LONG> = WithVersion<TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>, 1>;
export type TransferTransactionV2<LONG> = WithVersion<TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>, 2>;
export type TransferTransactionV3<LONG> = WithVersion<TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>, 3>;

export type TransferTransactionMap<LONG = Long> = {
    1: TransferTransactionV1<LONG>;
    2: TransferTransactionV2<LONG>;
    3: TransferTransactionV3<LONG>;
};

//ReissueTransaction
export type ReissueTransactionV1<LONG> = WithVersion<ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>, 1>;
export type ReissueTransactionV2<LONG> = WithVersion<ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>, 2>;
export type ReissueTransactionV3<LONG> = WithVersion<ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>, 3>;

export type ReissueTransactionMap<LONG = Long> = {
    1: ReissueTransactionV1<LONG>;
    2: ReissueTransactionV2<LONG>;
    3: ReissueTransactionV3<LONG>;
};

//BurnTransaction
export type BurnTransactionV1<LONG> = WithVersion<BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>, 1>;
export type BurnTransactionV2<LONG> = WithVersion<BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>, 2>;
export type BurnTransactionV3<LONG> = WithVersion<BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>, 3>;

export type BurnTransactionMap<LONG = Long> = {
    1: BurnTransactionV1<LONG>;
    2: BurnTransactionV2<LONG>;
    3: BurnTransactionV3<LONG>;
};

//ExchangeTransaction // TODO maybe create map by version for check orders version?
export type ExchangeTransactionV1<LONG = Long> = WithVersion<ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>, 1>;
export type ExchangeTransactionV2<LONG = Long> = WithVersion<ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>, 2>;
export type ExchangeTransactionV3<LONG = Long> = WithVersion<ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>, 3>;

export type ExchangeTransactionMap<LONG = Long> = {
    1: ExchangeTransactionV1<LONG>;
    2: ExchangeTransactionV2<LONG>;
    3: ExchangeTransactionV3<LONG>;
};

//LeaseTransaction
export type LeaseTransactionV1<LONG> = WithVersion<LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>, 1>;
export type LeaseTransactionV2<LONG> = WithVersion<LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>, 2>;
export type LeaseTransactionV3<LONG> = WithVersion<LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>, 3>;

export type LeaseTransactionMap<LONG = Long> = {
    1: LeaseTransactionV1<LONG>;
    2: LeaseTransactionV2<LONG>;
    3: LeaseTransactionV3<LONG>;
};

//CancelLeaseTransaction
export type CancelLeaseTransactionV1<LONG> = WithVersion<CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>, 1>;
export type CancelLeaseTransactionV2<LONG> = WithVersion<CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>, 2>;
export type CancelLeaseTransactionV3<LONG> = WithVersion<CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>, 3>;

export type CancelLeaseTransactionMap<LONG = Long> = {
    1: LeaseTransactionV1<LONG>;
    2: LeaseTransactionV2<LONG>;
    3: LeaseTransactionV3<LONG>;
};

//AliasTransaction
export type AliasTransactionV1<LONG> = WithVersion<AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>, 1>;
export type AliasTransactionV2<LONG> = WithVersion<AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>, 2>;
export type AliasTransactionV3<LONG> = WithVersion<AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>, 3>;

export type AliasTransactionMap<LONG = Long> = {
    1: AliasTransactionV1<LONG>;
    2: AliasTransactionV2<LONG>;
    3: AliasTransactionV3<LONG>;
};

//MassTransferTransaction
export type MassTransferTransactionV1<LONG> = WithVersion<MassTransferTransactionFields<LONG> & BaseTransaction<LONG, 11>, 1>;
export type MassTransferTransactionV2<LONG> = WithVersion<MassTransferTransactionFields<LONG> & BaseTransaction<LONG, 11>, 2>;

export type MassTransferTransactionMap<LONG = Long> = {
    1: MassTransferTransactionV1<LONG>;
    2: MassTransferTransactionV2<LONG>;
};

//DataTransaction
export type DataTransactionV1<LONG> = WithVersion<DataTransactionFields<LONG> & BaseTransaction<LONG, 12>, 1>;
export type DataTransactionV2<LONG> = WithVersion<DataTransactionFields<LONG> & BaseTransaction<LONG, 12>, 2>;

export type DataTransactionMap<LONG = Long> = {
    1: DataTransactionV1<LONG>;
    2: DataTransactionV2<LONG>;
};

//SetScriptTransaction
export type SetScriptTransactionV1<LONG> = WithVersion<SetScriptTransactionFields<LONG> & BaseTransaction<LONG, 13>, 1>;
export type SetScriptTransactionV2<LONG> = WithVersion<SetScriptTransactionFields<LONG> & BaseTransaction<LONG, 13>, 2>;

export type SetScriptTransactionMap<LONG = Long> = {
    1: SetScriptTransactionV1<LONG>;
    2: SetScriptTransactionV2<LONG>;
};

//ISponsorshipTransaction
export type SponsorshipTransactionV1<LONG> = WithVersion<SponsorshipTransactionFields<LONG> & BaseTransaction<LONG, 14>, 1>;
export type SponsorshipTransactionV2<LONG> = WithVersion<SponsorshipTransactionFields<LONG> & BaseTransaction<LONG, 14>, 2>;

export type SponsorshipTransactionMap<LONG = Long> = {
    1: SponsorshipTransactionV1<LONG>;
    2: SponsorshipTransactionV2<LONG>;
};

//SetAssetScriptTransaction
export type SetAssetScriptTransactionV1<LONG> = WithVersion<SetAssetScriptTransactionFields<LONG> & BaseTransaction<LONG, 15>, 1>;
export type SetAssetScriptTransactionV2<LONG> = WithVersion<SetAssetScriptTransactionFields<LONG> & BaseTransaction<LONG, 15>, 2>;

export type SetAssetScriptTransactionMap<LONG = Long> = {
    1: SetAssetScriptTransactionV1<LONG>;
    2: SetAssetScriptTransactionV2<LONG>;
};

//IInvokeScriptTransaction
export type InvokeScriptTransactionV1<LONG> = WithVersion<InvokeScriptTransactionFields<LONG> & BaseTransaction<LONG, 16>, 1>;
export type InvokeScriptTransactionV2<LONG> = WithVersion<InvokeScriptTransactionFields<LONG> & BaseTransaction<LONG, 16>, 2>;

export type InvokeScriptTransactionMap<LONG = Long> = {
    1: InvokeScriptTransactionV1<LONG>;
    2: InvokeScriptTransactionV2<LONG>;
};

//UpdateAssetInfoTransaction
export type UpdateAssetInfoTransactionV1<LONG> = WithVersion<UpdateAssetInfoTransactionFields<LONG> & BaseTransaction<LONG, 17>, 1>;

export type UpdateAssetInfoTransactionMap<LONG = Long> = {
    1: UpdateAssetInfoTransactionV1<LONG>;
};


//------------------------------------------------------------------------------------------
//Transaction types
export type GenesisTransaction<LONG = Long> = GenesisTransactionV1<LONG>;

export type PaymentTransaction<LONG = Long> = PaymentTransactionV1<LONG>;

export type IssueTransaction<LONG = Long> =
    | IssueTransactionV1<LONG>
    | IssueTransactionV2<LONG>
    | IssueTransactionV3<LONG>;

export type TransferTransaction<LONG = Long> =
    | TransferTransactionV1<LONG>
    | TransferTransactionV2<LONG>
    | TransferTransactionV3<LONG>;

export type LeaseTransaction<LONG = Long> =
    | LeaseTransactionV1<LONG>
    | LeaseTransactionV2<LONG>
    | LeaseTransactionV3<LONG>;

export type BurnTransaction<LONG = Long> =
    | BurnTransactionV1<LONG>
    | BurnTransactionV2<LONG>
    | BurnTransactionV3<LONG>;

export type ReissueTransaction<LONG = Long> =
    | ReissueTransactionV1<LONG>
    | ReissueTransactionV2<LONG>
    | ReissueTransactionV3<LONG>;

export type CancelLeaseTransaction<LONG = Long> =
    | CancelLeaseTransactionV1<LONG>
    | CancelLeaseTransactionV2<LONG>
    | CancelLeaseTransactionV3<LONG>;

export type AliasTransaction<LONG = Long> =
    | AliasTransactionV1<LONG>
    | AliasTransactionV2<LONG>
    | AliasTransactionV3<LONG>;

export type MassTransferTransaction<LONG = Long> =
    | MassTransferTransactionV1<LONG>
    | MassTransferTransactionV2<LONG>;

export type DataTransaction<LONG = Long> =
    | DataTransactionV1<LONG>
    | DataTransactionV2<LONG>;

export type SetScriptTransaction<LONG = Long> =
    | SetScriptTransactionV1<LONG>
    | SetScriptTransactionV2<LONG>;

export type SponsorshipTransaction<LONG = Long> =
    | SponsorshipTransactionV1<LONG>
    | SponsorshipTransactionV2<LONG>;

export type ExchangeTransaction<LONG = Long> =
    | ExchangeTransactionV1<LONG>
    | ExchangeTransactionV2<LONG>
    | ExchangeTransactionV3<LONG>;

export type SetAssetScriptTransaction<LONG = Long> =
    | SetAssetScriptTransactionV1<LONG>
    | SetAssetScriptTransactionV2<LONG>;

export type InvokeScriptTransaction<LONG = Long> =
    | InvokeScriptTransactionV1<LONG>
    | InvokeScriptTransactionV2<LONG>;

export type UpdateAssetInfoTransaction<LONG = Long> = UpdateAssetInfoTransactionV1<LONG>;

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
}

type WithProofs = {
    proofs: Array<string>;
}

export type SignedTransaction<TX extends Transaction<any>> = TX &
    (TX['type'] extends keyof TWithSignatureMap
        ? TX['version'] extends TWithSignatureMap[TX['type']]
            ? WithSignature
            : WithProofs
        : WithProofs)
