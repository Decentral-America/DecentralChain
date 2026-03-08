import { type DATA_FIELD_TYPE } from './constants.js';

// ── Phantom Type Utility ─────────────────────────────────────────────────────
// Brands a type with a named generic parameter that has no runtime fields.
// Used to satisfy noUnusedParameters without altering the structure or ABI.
// Pattern adopted from io-ts, zod, Effect, and fp-ts branded types.
// Uses a string-literal key instead of a unique symbol so downstream
// packages can reference Phantom<> in their own .d.ts without TS4053.
export type Phantom<K extends string, T> = { readonly __phantom__?: Readonly<Record<K, T>> };

// ── Primitive Types ─────────────────────────────────────────────────────────
export type ExchangeTransactionOrderType = 'buy' | 'sell';
export type Base64Script = string;
export type Base58Bytes = string;
export type Proofs = Array<string>;
export type Long = string | number;
export type AssetDecimals = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Base64String = string;

// ── Mixins ──────────────────────────────────────────────────────────────────
export interface WithId {
  id: string;
}

export interface WithApplicationStatus {
  applicationStatus: 'succeeded' | 'script_execution_failed';
}

export type WithApiMixin = WithId & {
  sender: string;
  height: number;
};

// ── Invoke Script Types ─────────────────────────────────────────────────────
export type InvokeScriptCall<LONG = Long> = {
  function: string;
  args: Array<InvokeScriptCallArgument<LONG>>;
};

export type InvokeScriptPayment<LONG = Long> = {
  assetId: string | null;
  amount: LONG;
};

export type InvokeScriptCallArgument<LONG = Long> =
  | InvokeScriptCallStringArgument
  | InvokeScriptCallBinaryArgument
  | InvokeScriptCallBooleanArgument
  | InvokeScriptCallIntegerArgument<LONG>
  | InvokeScriptCallListArgument<
      LONG,
      | InvokeScriptCallStringArgument
      | InvokeScriptCallBinaryArgument
      | InvokeScriptCallBooleanArgument
      | InvokeScriptCallIntegerArgument
    >;

export type InvokeScriptCallArgumentGeneric<Type, Value> = {
  type: Type;
  value: Value;
};

export type InvokeScriptCallStringArgument = InvokeScriptCallArgumentGeneric<'string', string>;
export type InvokeScriptCallBinaryArgument = InvokeScriptCallArgumentGeneric<
  'binary',
  Base64String
>;
export type InvokeScriptCallBooleanArgument = InvokeScriptCallArgumentGeneric<'boolean', boolean>;
export type InvokeScriptCallIntegerArgument<LONG = Long> = InvokeScriptCallArgumentGeneric<
  'integer',
  LONG
>;

export type InvokeScriptCallListArgument<
  LONG,
  ITEMS extends
    | InvokeScriptCallStringArgument
    | InvokeScriptCallBinaryArgument
    | InvokeScriptCallBooleanArgument
    | InvokeScriptCallIntegerArgument,
> = InvokeScriptCallArgumentGeneric<'list', Array<ITEMS>> & Phantom<'LONG', LONG>;

// ── Mass Transfer ───────────────────────────────────────────────────────────
export type MassTransferItem<LONG = Long> = {
  recipient: string;
  amount: LONG;
};

// ── Data Transaction Entries ────────────────────────────────────────────────
export type DataTransactionEntryGeneric<Type, Value> = {
  key: string;
  type: Type;
  value: Value;
};

export type DataTransactionEntryInteger<LONG> = DataTransactionEntryGeneric<
  typeof DATA_FIELD_TYPE.INTEGER,
  LONG
>;
export type DataTransactionEntryString = DataTransactionEntryGeneric<
  typeof DATA_FIELD_TYPE.STRING,
  string
>;
export type DataTransactionEntryBinary = DataTransactionEntryGeneric<
  typeof DATA_FIELD_TYPE.BINARY,
  Base64String
>;
export type DataTransactionEntryBoolean = DataTransactionEntryGeneric<
  typeof DATA_FIELD_TYPE.BOOLEAN,
  boolean
>;

export type DataTransactionEntry<LONG = Long> =
  | DataTransactionEntryInteger<LONG>
  | DataTransactionEntryString
  | DataTransactionEntryBinary
  | DataTransactionEntryBoolean
  | DataTransactionDeleteRequest;

export type DataTransactionDeleteRequest = {
  type: null;
  value: null | undefined;
  key: string;
};

// ── Exchange Order Types ────────────────────────────────────────────────────
export type WithVersion<Target extends Record<string, unknown>, Version extends number> = Target & {
  version: Version;
};

export type ExchangeTransactionOrderData<LONG> = {
  version: number;
  orderType: ExchangeTransactionOrderType;
  assetPair: {
    amountAsset: string | null;
    priceAsset: string | null;
  };
  price: LONG;
  amount: LONG;
  timestamp: number;
  expiration: number;
  matcherFee: LONG;
  matcherPublicKey: string;
  senderPublicKey: string;
};

type ExchangeOrderWithCustomFee<Long> = ExchangeTransactionOrderData<Long> & {
  matcherFeeAssetId: string | null;
};

export type ExchangeTransactionOrderV1<LONG = Long> = WithVersion<
  ExchangeTransactionOrderData<LONG>,
  1
>;
export type ExchangeTransactionOrderV2<LONG = Long> = WithVersion<
  ExchangeTransactionOrderData<LONG>,
  2
>;
export type ExchangeTransactionOrderV3<LONG = Long> = WithVersion<
  ExchangeOrderWithCustomFee<LONG>,
  3
>;
export type ExchangeTransactionOrderV4<LONG = Long> = WithVersion<
  Omit<ExchangeOrderWithCustomFee<LONG>, 'senderPublicKey'> & {
    priceMode: 'fixedDecimals' | 'assetDecimals';
    eip712Signature?: string;
    senderPublicKey?: string;
    attachment?: Base64String | null;
  },
  4
>;

export type ExchangeTransactionOrder<LONG = Long> =
  | ExchangeTransactionOrderV1<LONG>
  | ExchangeTransactionOrderV2<LONG>
  | ExchangeTransactionOrderV3<LONG>
  | ExchangeTransactionOrderV4<LONG>;

export type SignedIExchangeTransactionOrder<ORDER extends ExchangeTransactionOrder<unknown>> =
  ORDER &
    (ORDER extends { version: 1 }
      ? {
          signature: string;
        }
      : {
          proofs: Array<string>;
        });

export type ExchangeTransactionOrderMap<LONG = Long> = {
  1: ExchangeTransactionOrderV1<LONG>;
  2: ExchangeTransactionOrderV2<LONG>;
  3: ExchangeTransactionOrderV3<LONG>;
  4: ExchangeTransactionOrderV4<LONG>;
};

// ── State Changes ───────────────────────────────────────────────────────────
export type TStateChanges = {
  data: Array<DataTransactionEntry>;
  transfers: Array<{
    address: string;
    amount: Long;
    asset: string | null;
  }>;
  issues: Array<{
    assetId: string;
    name: string;
    description: string;
    quantity: Long;
    decimals: AssetDecimals;
    isReissuable: boolean;
    compiledScript: null | string;
    nonce: Long;
  }>;
  reissues: Array<{
    assetId: string;
    isReissuable: boolean;
    quantity: Long;
  }>;
  burns: Array<{
    assetId: string;
    quantity: Long;
  }>;
  sponsorFees: Array<{
    assetId: string;
    minSponsoredAssetFee: Long;
  }>;
  leases: Array<{
    leaseId: string;
    recipient: string;
    amount: Long;
  }>;
  leaseCancels: Array<{ leaseId: string }>;
  invokes: Array<{
    dApp: string;
    call: {
      function: string;
      args: Array<{ type: string; value: string }>;
    };
    payment: Array<InvokeScriptPayment>;
    stateChanges: TStateChanges;
  }>;
  error?: {
    code: number;
    text: string;
  };
};
