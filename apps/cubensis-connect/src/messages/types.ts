import {
  type AssetDecimals,
  type DataTransactionEntry,
  type DataTransactionEntryBinary,
  type DataTransactionEntryBoolean,
  type DataTransactionEntryInteger,
  type DataTransactionEntryString,
  type InvokeScriptCallArgument,
  type InvokeScriptPayment,
  type LeaseTransactionFromNode,
  type TRANSACTION_TYPE,
} from '@decentralchain/ts-types';
import { type PreferencesAccount } from 'preferences/types';

interface MessageInputAuth {
  data: string;
  host?: string | undefined;
  icon?: string | undefined;
  name?: string | undefined;
  referrer?: string | undefined;
  successPath?: string | undefined;
}

export interface MessageInputCancelOrder {
  amountAsset: string;
  data: {
    id: string;
    senderPublicKey?: string | undefined;
    timestamp?: number | undefined;
  };
  priceAsset: string;
}

export type MessageInputCustomData = { publicKey?: string | undefined } & (
  | { version: 1; binary: string }
  | {
      version: 2;
      data: Array<
        | DataTransactionEntryBinary
        | DataTransactionEntryBoolean
        | DataTransactionEntryInteger<string | number>
        | DataTransactionEntryString
      >;
    }
);

export interface MoneyLike {
  amount?: number | string | undefined;
  assetId: string | null;
  coins?: number | string | undefined;
  tokens?: number | string | undefined;
}

export interface MessageInputOrder {
  data: {
    amount: MoneyLike;
    chainId?: number | undefined;
    eip712Signature?: string | undefined;
    expiration: number;
    matcherFee: MoneyLike;
    matcherPublicKey?: string | undefined;
    orderType: 'buy' | 'sell';
    price: MoneyLike;
    priceMode?: 'assetDecimals' | 'fixedDecimals' | undefined;
    proofs?: string[] | undefined;
    senderPublicKey?: string | undefined;
    timestamp?: number | undefined;
    version?: 1 | 2 | 3 | 4 | undefined;
  };
}

interface MessageInputTxCommon {
  chainId?: number | undefined;
  fee?: MoneyLike | undefined;
  initialFee?: MoneyLike | undefined;
  proofs?: string[] | undefined;
  senderPublicKey?: string | undefined;
  timestamp?: number | undefined;
}

export interface MessageInputTxIssue {
  type: typeof TRANSACTION_TYPE.ISSUE;
  data: MessageInputTxCommon & {
    description: string;
    name: string;
    precision: AssetDecimals;
    quantity: string | number;
    reissuable: boolean;
    script?: string | undefined;
    version?: 2 | 3 | undefined;
  };
}

export interface MessageInputTxTransfer {
  type: typeof TRANSACTION_TYPE.TRANSFER;
  data: MessageInputTxCommon & {
    amount: MoneyLike;
    attachment?: string | number[] | undefined;
    recipient: string;
    version?: 2 | 3 | undefined;
  };
}

export interface MessageInputTxReissue {
  type: typeof TRANSACTION_TYPE.REISSUE;
  data: MessageInputTxCommon & {
    reissuable: boolean;
    version?: 2 | 3 | undefined;
  } & (
      | { amount: MoneyLike; assetId?: string | undefined }
      | { amount: string | number; assetId: string }
      | { quantity: MoneyLike; assetId?: string | undefined }
      | { quantity: string | number; assetId: string }
    );
}

export interface MessageInputTxBurn {
  type: typeof TRANSACTION_TYPE.BURN;
  data: MessageInputTxCommon & {
    assetId: string;
    version?: 2 | 3 | undefined;
  } & ({ amount: MoneyLike | string | number } | { quantity: MoneyLike | string | number });
}

export interface MessageInputTxLease {
  type: typeof TRANSACTION_TYPE.LEASE;
  data: MessageInputTxCommon & {
    amount: MoneyLike | string | number;
    recipient: string;
    version?: 2 | 3 | undefined;
  };
}

export interface MessageInputTxCancelLease {
  type: typeof TRANSACTION_TYPE.CANCEL_LEASE;
  data: MessageInputTxCommon & {
    leaseId: string;
    version?: 2 | 3 | undefined;
  };
}

export interface MessageInputTxAlias {
  type: typeof TRANSACTION_TYPE.ALIAS;
  data: MessageInputTxCommon & {
    alias: string;
    version?: 2 | 3 | undefined;
  };
}

export interface MessageInputTxMassTransfer {
  type: typeof TRANSACTION_TYPE.MASS_TRANSFER;
  data: MessageInputTxCommon & {
    attachment?: string | number[] | undefined;
    totalAmount: { assetId: string | null };
    transfers: Array<{
      amount: string | number | MoneyLike;
      recipient: string;
    }>;
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxData {
  type: typeof TRANSACTION_TYPE.DATA;
  data: MessageInputTxCommon & {
    data: DataTransactionEntry[];
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxSetScript {
  type: typeof TRANSACTION_TYPE.SET_SCRIPT;
  data: MessageInputTxCommon & {
    script?: string | undefined;
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxSponsorship {
  type: typeof TRANSACTION_TYPE.SPONSORSHIP;
  data: MessageInputTxCommon & {
    minSponsoredAssetFee: MoneyLike;
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxSetAssetScript {
  type: typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT;
  data: MessageInputTxCommon & {
    assetId: string;
    script: string;
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxInvokeScript {
  type: typeof TRANSACTION_TYPE.INVOKE_SCRIPT;
  data: MessageInputTxCommon & {
    call?:
      | {
          function: string;
          args?: InvokeScriptCallArgument[] | undefined;
        }
      | undefined;
    dApp: string;
    payment?: MoneyLike[] | undefined;
    version?: 1 | 2 | undefined;
  };
}

export interface MessageInputTxUpdateAssetInfo {
  type: typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO;
  data: MessageInputTxCommon & {
    assetId: string;
    description: string;
    name: string;
    version?: 1 | undefined;
  };
}

export type MessageInputTx =
  | MessageInputTxIssue
  | MessageInputTxTransfer
  | MessageInputTxReissue
  | MessageInputTxBurn
  | MessageInputTxLease
  | MessageInputTxCancelLease
  | MessageInputTxAlias
  | MessageInputTxMassTransfer
  | MessageInputTxData
  | MessageInputTxSetScript
  | MessageInputTxSponsorship
  | MessageInputTxSetAssetScript
  | MessageInputTxInvokeScript
  | MessageInputTxUpdateAssetInfo;

interface MessageInputDccAuth {
  publicKey?: string | undefined;
  timestamp: number;
}

export type MessageInput = {
  account: PreferencesAccount;
  connectionId?: string | undefined;
  options?: { uid?: unknown } | undefined;
  origin?: string | undefined;
} & (
  | { type: 'auth'; data: MessageInputAuth }
  | {
      type: 'authOrigin';
      origin: string;
      data: { origin: string };
    }
  | {
      type: 'cancelOrder';
      broadcast: boolean;
      data: MessageInputCancelOrder;
    }
  | { type: 'customData'; data: MessageInputCustomData }
  | {
      type: 'order';
      broadcast: boolean;
      data: MessageInputOrder;
    }
  | {
      type: 'request';
      data: {
        data?: { senderPublicKey?: string | undefined; timestamp?: number | undefined } | undefined;
      };
    }
  | {
      type: 'transaction';
      broadcast: boolean;
      data: MessageInputTx & { successPath?: string | undefined };
    }
  | {
      type: 'transactionPackage';
      data: MessageInputTx[];
      title?: string | null | undefined;
    }
  | {
      type: 'dccAuth';
      data: MessageInputDccAuth;
    }
);

export type MessageInputOfType<T extends MessageInput['type']> = Extract<MessageInput, { type: T }>;

export interface MessageAuth {
  referrer?: string | undefined;
  data: MessageInputAuth & {
    host: string;
    prefix: string;
    version?: number | undefined;
  };
}

type MessageAuthSigned = Omit<MessageAuth['data'], 'data'> & {
  address: string;
  publicKey: string;
  signature: string;
};

export interface MessageCancelOrder {
  amountAsset?: string | undefined;
  data: {
    id: string;
    senderPublicKey: string;
  };
  priceAsset?: string | undefined;
  timestamp: number;
}

type MessageCustomData = MessageInputCustomData & {
  publicKey: string;
  hash: string;
};

export type MessageCustomDataSigned = MessageCustomData & {
  signature: string;
};

export interface MessageOrder {
  amount: number | string;
  assetPair: { amountAsset: string | null; priceAsset: string | null };
  chainId: number;
  eip712Signature?: string | undefined;
  expiration: number;
  id: string;
  matcherFee: string | number;
  matcherFeeAssetId: string | null;
  matcherPublicKey: string;
  orderType: 'buy' | 'sell';
  price: number | string;
  priceMode: 'assetDecimals' | 'fixedDecimals';
  proofs: string[];
  senderPublicKey: string;
  timestamp: number;
  version: 1 | 2 | 3 | 4;
}

export interface MessageRequest {
  data: {
    senderPublicKey: string;
    timestamp: number;
  };
}

interface MessageTxCommon {
  chainId: number;
  fee: number | string;
  id: string;
  initialFee: number | string;
  proofs: string[];
  senderPublicKey: string;
  timestamp: number;
}

export interface MessageTxIssue extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.ISSUE;
  decimals: AssetDecimals;
  description: string;
  name: string;
  quantity: string | number;
  reissuable: boolean;
  script: string | null;
  version: 2 | 3;
}

export interface MessageTxTransfer extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.TRANSFER;
  amount: number | string;
  assetId: string | null;
  attachment?: string | undefined;
  feeAssetId: string | null;
  initialFeeAssetId: string | null;
  recipient: string;
  version: 2 | 3;
}

export interface MessageTxReissue extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.REISSUE;
  assetId: string;
  quantity: string | number;
  reissuable: boolean;
  version: 2 | 3;
}

export interface MessageTxBurn extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.BURN;
  amount: string | number;
  assetId: string;
  version: 2 | 3;
}

export interface MessageTxLease extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.LEASE;
  amount: string | number;
  recipient: string;
  version: 2 | 3;
}

export interface MessageTxCancelLease extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.CANCEL_LEASE;
  lease: LeaseTransactionFromNode;
  leaseId: string;
  version: 2 | 3;
}

export interface MessageTxAlias extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.ALIAS;
  alias: string;
  version: 2 | 3;
}

export interface MessageTxMassTransfer extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.MASS_TRANSFER;
  assetId: string | null;
  attachment?: string | undefined;
  transfers: Array<{ amount: string | number; recipient: string }>;
  version: 1 | 2;
}

export interface MessageTxData extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.DATA;
  data: DataTransactionEntry[];
  version: 1 | 2;
}

export interface MessageTxSetScript extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.SET_SCRIPT;
  script: string | null;
  version: 1 | 2;
}

export interface MessageTxSponsorship extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.SPONSORSHIP;
  assetId: string;
  minSponsoredAssetFee: number | string | null;
  version: 1 | 2;
}

export interface MessageTxSetAssetScript extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT;
  assetId: string;
  script: string;
  version: 1 | 2;
}

export interface MessageTxInvokeScript extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.INVOKE_SCRIPT;
  call: { function: string; args: InvokeScriptCallArgument[] } | null;
  dApp: string;
  feeAssetId: string | null;
  initialFeeAssetId: string | null;
  payment: InvokeScriptPayment[];
  version: 1 | 2;
}

export interface MessageTxUpdateAssetInfo extends MessageTxCommon {
  type: typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO;
  assetId: string;
  description: string;
  name: string;
  version: 1;
}

export type MessageTx =
  | MessageTxIssue
  | MessageTxTransfer
  | MessageTxReissue
  | MessageTxBurn
  | MessageTxLease
  | MessageTxCancelLease
  | MessageTxAlias
  | MessageTxMassTransfer
  | MessageTxData
  | MessageTxSetScript
  | MessageTxSponsorship
  | MessageTxSetAssetScript
  | MessageTxInvokeScript
  | MessageTxUpdateAssetInfo;

export enum MessageStatus {
  Failed = 'failed',
  Published = 'published',
  Rejected = 'rejected',
  RejectedForever = 'rejected_forever',
  Signed = 'signed',
  UnApproved = 'unapproved',
}

interface MessageDccAuth extends MessageInputDccAuth {
  address: string;
  hash: string;
  publicKey: string;
}

interface MessageDccAuthSigned extends MessageDccAuth {
  signature: string;
}

export type Message = {
  connectionId?: string | undefined;
  account: PreferencesAccount;
  ext_uuid: unknown;
  id: string;
  timestamp: number;
  title?: string | null | undefined;
} & (
  | {
      status:
        | typeof MessageStatus.Published
        | typeof MessageStatus.Rejected
        | typeof MessageStatus.RejectedForever
        | typeof MessageStatus.Signed
        | typeof MessageStatus.UnApproved;
    }
  | {
      err: string;
      status: typeof MessageStatus.Failed;
    }
) &
  (
    | {
        type: 'auth';
        data: MessageAuth;
        messageHash: string;
        origin?: string | undefined;
        result?: string | MessageAuthSigned | undefined;
        successPath?: string | null | undefined;
      }
    | {
        type: 'authOrigin';
        origin: string;
        result?: { approved: 'OK' } | undefined;
      }
    | {
        type: 'cancelOrder';
        amountAsset: string;
        broadcast: boolean;
        data: MessageCancelOrder;
        messageHash: string;
        origin?: string | undefined;
        priceAsset: string;
        result?: string | undefined;
      }
    | {
        type: 'customData';
        data: MessageCustomData;
        origin?: string | undefined;
        result?: MessageCustomDataSigned | undefined;
      }
    | {
        type: 'order';
        broadcast: boolean;
        data: MessageOrder;
        origin?: string | undefined;
        result?: string | undefined;
      }
    | {
        type: 'request';
        data: MessageRequest;
        messageHash: string;
        origin?: string | undefined;
        result?: string | undefined;
      }
    | {
        type: 'transaction';
        broadcast: boolean;
        data: MessageTx;
        input: MessageInputOfType<'transaction'>;
        origin?: string | undefined;
        result?: string | undefined;
        successPath?: string | null | undefined;
      }
    | {
        type: 'transactionPackage';
        data: MessageTx[];
        input: MessageInputOfType<'transactionPackage'>;
        origin?: string | undefined;
        result?: string[] | undefined;
      }
    | {
        type: 'dccAuth';
        data: MessageDccAuth;
        origin?: string | undefined;
        result?: MessageDccAuthSigned | undefined;
      }
  );

export type MessageOfType<T extends Message['type']> = Extract<Message, { type: T }>;
