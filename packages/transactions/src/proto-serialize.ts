import { binary, schemas } from '@decentralchain/marshall';
import {
  type Amount,
  AmountSchema,
  type AssetPair,
  create,
  type DataEntry,
  DataEntrySchema,
  fromBinary,
  type Order,
  Order_PriceMode,
  Order_Side,
  OrderSchema,
  type Recipient,
  RecipientSchema,
  type SignedTransaction,
  SignedTransactionSchema,
  type Transaction,
  TransactionSchema,
  toBinary,
} from '@decentralchain/protobuf-serialization';
import {
  address,
  base16Decode,
  base16Encode,
  base58Decode,
  base58Encode,
  base64Decode,
  base64Encode,
  blake2b,
  concat,
  keccak,
} from '@decentralchain/ts-lib-crypto';
import {
  type AliasTransaction,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type DataTransaction,
  type DataTransactionEntry,
  type ExchangeTransaction,
  type ExchangeTransactionOrder,
  type GenesisTransaction,
  type InvokeScriptTransaction,
  type IssueTransaction,
  type LeaseTransaction,
  type MassTransferItem,
  type MassTransferTransaction,
  type ReissueTransaction,
  type SetAssetScriptTransaction,
  type SetScriptTransaction,
  type SignedIExchangeTransactionOrder,
  type SponsorshipTransaction,
  TRANSACTION_TYPE,
  type TransactionType,
  type TransferTransaction,
  type UpdateAssetInfoTransaction,
} from '@decentralchain/ts-types';
import { base64Prefix, chainIdFromRecipient } from './generic';
import { type TTransaction, type TTx, type WithChainId } from './transactions';

const invokeScriptCallSchema = {
  ...schemas.txFields.functionCall[1],
};

const recipientFromProto = (recipient: Recipient, chainId: number): string => {
  if (recipient.recipient.case === 'alias') {
    return `alias:${String.fromCharCode(chainId)}:${recipient.recipient.value}`;
  }

  const rawAddress = concat([1], [chainId], recipient.recipient.value as Uint8Array);
  const checkSum = keccak(blake2b(rawAddress)).slice(0, 4);

  return base58Encode(concat(rawAddress, checkSum));
};

function convertNumber(n: bigint) {
  return n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)
    ? n.toString()
    : Number(n);
}

export function txToProtoBytes(obj: TTransaction): Uint8Array {
  return toBinary(TransactionSchema, txToProto(obj));
}

export function signedTxToProtoBytes(obj: TTx): Uint8Array {
  return toBinary(SignedTransactionSchema, signedTxToProto(obj));
}

export function protoBytesToSignedTx(bytes: Uint8Array): TTx {
  const txData = fromBinary(SignedTransactionSchema, bytes);
  if (txData.transaction.case !== 'wavesTransaction' || !txData.transaction.value) {
    throw new Error('Unsupported signed transaction format');
  }
  const tx: TTransaction = protoTxDataToTx(txData.transaction.value);

  const signedTx: TTx = {
    ...tx,
    proofs: (txData.proofs || []).map(uint8Array2proof),
  };

  return signedTx;
}

export function protoBytesToTx(bytes: Uint8Array): TTransaction {
  const t = fromBinary(TransactionSchema, bytes);
  const res = protoTxDataToTx(t);

  return res;
}

/** Mutable record for building a TTransaction from protobuf fields. */
interface ProtoTxFields {
  version: unknown;
  type: unknown;
  senderPublicKey: unknown;
  timestamp: unknown;
  fee: unknown;
  feeAssetId?: unknown;
  chainId?: unknown;
  sender?: unknown;
  name?: unknown;
  description?: unknown;
  quantity?: unknown;
  decimals?: unknown;
  reissuable?: unknown;
  script?: unknown;
  amount?: unknown;
  recipient?: unknown;
  attachment?: unknown;
  assetId?: unknown;
  price?: unknown;
  buyMatcherFee?: unknown;
  sellMatcherFee?: unknown;
  order1?: unknown;
  order2?: unknown;
  leaseId?: unknown;
  alias?: unknown;
  transfers?: unknown;
  data?: unknown;
  minSponsoredAssetFee?: unknown;
  dApp?: unknown;
  call?: unknown;
  payment?: unknown;
  [key: string]: unknown;
}

/** Typed input for orderToProto — all order fields accessed by the serializer. */
interface OrderProtoInput {
  version?: unknown;
  priceMode?: unknown;
  assetPair?: { amountAsset: string | null; priceAsset: string | null };
  chainId?: unknown;
  senderPublicKey?: unknown;
  matcherPublicKey?: unknown;
  orderType?: unknown;
  amount?: unknown;
  price?: unknown;
  timestamp?: unknown;
  expiration?: unknown;
  matcherFee?: unknown;
  matcherFeeAssetId?: unknown;
  proofs?: string[];
  eip712Signature?: unknown;
  [key: string]: unknown;
}

export function protoTxDataToTx(t: Transaction): TTransaction {
  const res: ProtoTxFields = {
    version: t.version,
    type: typeByName[t.data.case as keyof typeof typeByName] as TransactionType,
    senderPublicKey: base58Encode(t.senderPublicKey),
    timestamp: Number(t.timestamp),
    fee: convertNumber(t.fee?.amount ?? 0n),
  };

  if (t.fee && t.fee.assetId.length > 0) {
    res.feeAssetId = base58Encode(t.fee.assetId);
  } else {
    res.feeAssetId = null;
  }

  if (t.chainId !== 0) {
    res.chainId = t.chainId;
  }

  switch (t.data.case) {
    case 'issue': {
      const d = t.data.value;
      res.name = d.name;
      res.description = d.description;
      res.quantity = convertNumber(d.amount);
      res.decimals = d.decimals;
      res.reissuable = d.reissuable;
      res.script = d.script.length > 0 ? base64Prefix(base64Encode(d.script)) : null;
      break;
    }
    case 'transfer': {
      const d = t.data.value;
      res.amount = convertNumber(d.amount?.amount ?? 0n);
      res.recipient = recipientFromProto(d.recipient as Recipient, t.chainId);
      res.attachment = d.attachment.length > 0 ? base58Encode(d.attachment) : '';
      res.assetId = d.amount && d.amount.assetId.length > 0 ? base58Encode(d.amount.assetId) : null;
      break;
    }
    case 'reissue': {
      const d = t.data.value;
      res.quantity = convertNumber(d.assetAmount?.amount ?? 0n);
      res.assetId =
        d.assetAmount == null || d.assetAmount.assetId.length === 0
          ? null
          : base58Encode(d.assetAmount.assetId);
      res.reissuable = d.reissuable;
      break;
    }
    case 'burn': {
      const d = t.data.value;
      res.amount = convertNumber(d.assetAmount?.amount ?? 0n);
      res.assetId = base58Encode(d.assetAmount?.assetId as Uint8Array);
      break;
    }
    case 'exchange': {
      const d = t.data.value;
      res.amount = convertNumber(d.amount);
      res.price = convertNumber(d.price);
      res.buyMatcherFee = convertNumber(d.buyMatcherFee);
      res.sellMatcherFee = convertNumber(d.sellMatcherFee);
      res.order1 = orderFromProto(d.orders[0] as Order);
      res.order2 = orderFromProto(d.orders[1] as Order);
      break;
    }
    case 'lease': {
      const d = t.data.value;
      res.recipient = recipientFromProto(d.recipient as Recipient, t.chainId);
      res.amount = convertNumber(d.amount);
      break;
    }
    case 'leaseCancel': {
      const d = t.data.value;
      res.leaseId = base58Encode(d.leaseId);
      break;
    }
    case 'createAlias': {
      const d = t.data.value;
      res.alias = d.alias;
      break;
    }
    case 'massTransfer': {
      const d = t.data.value;
      res.assetId = d.assetId.length > 0 ? base58Encode(d.assetId) : null;
      res.attachment = d.attachment.length > 0 ? base58Encode(d.attachment) : '';

      res.transfers = d.transfers.map(({ amount, recipient }) => ({
        amount: convertNumber(amount),
        recipient: recipientFromProto(recipient as Recipient, t.chainId),
      }));
      break;
    }
    case 'dataTransaction': {
      const d = t.data.value;
      res.data = d.data.map((de) => {
        switch (de.value.case) {
          case 'binaryValue':
            return {
              key: de.key,
              type: 'binary',
              value: base64Prefix(base64Encode(de.value.value)),
            };
          case 'boolValue':
            return { key: de.key, type: 'boolean', value: de.value.value };
          case 'intValue':
            return {
              key: de.key,
              type: 'integer',
              value: convertNumber(de.value.value),
            };
          case 'stringValue':
            return { key: de.key, type: 'string', value: de.value.value };
          default:
            return { key: de.key, value: null };
        }
      });
      break;
    }
    case 'setScript': {
      const d = t.data.value;
      res.script = d.script.length > 0 ? base64Prefix(base64Encode(d.script)) : null;
      break;
    }
    case 'sponsorFee': {
      const d = t.data.value;
      res.minSponsoredAssetFee = convertNumber(d.minFee?.amount ?? 0n);
      res.assetId = base58Encode(d.minFee?.assetId as Uint8Array);
      break;
    }
    case 'setAssetScript': {
      const d = t.data.value;
      res.assetId = base58Encode(d.assetId);
      res.script = base64Prefix(base64Encode(d.script));
      break;
    }
    case 'invokeScript': {
      const d = t.data.value;
      res.dApp = recipientFromProto(d.dApp as Recipient, t.chainId);
      if (d.functionCall.length > 0) {
        res.call = binary.parserFromSchema(invokeScriptCallSchema)(d.functionCall).value;
      }
      res.payment = d.payments.map((p) => ({
        amount: convertNumber(p.amount),
        assetId: p.assetId.length > 0 ? base58Encode(p.assetId) : null,
      }));
      break;
    }
    case 'updateAssetInfo': {
      const d = t.data.value;
      res.assetId = base58Encode(d.assetId);
      res.name = d.name;
      res.description = d.description;
      break;
    }
    default:
      throw new Error(`Unsupported tx type ${t.data.case}`);
  }

  if (Object.hasOwn(res, 'chainId')) {
    res.sender = address({ publicKey: t.senderPublicKey }, t.chainId);
  } else {
    const recipient =
      res.recipient ||
      res.dApp ||
      (res.transfers as Array<{ recipient?: string }> | undefined)?.[0]?.recipient;
    if (recipient) {
      res.sender = address(
        { publicKey: t.senderPublicKey },
        chainIdFromRecipient(recipient as string),
      );
    }
  }

  return res as TTransaction;
}

export function orderToProtoBytes(obj: ExchangeTransactionOrder): Uint8Array {
  return toBinary(OrderSchema, orderToProto(obj as unknown as OrderProtoInput));
}

export function protoBytesToOrder(bytes: Uint8Array) {
  const o = fromBinary(OrderSchema, bytes);
  return orderFromProto(o);
}

const getCommonFields = ({
  senderPublicKey,
  fee,
  timestamp,
  type,
  version,
  ...rest
}: TTransaction) => {
  const typename = nameByType[type as keyof typeof nameByType];
  let chainId: number | undefined = (rest as unknown as WithChainId).chainId;
  if (chainId == null) {
    const r = rest as unknown as {
      recipient?: unknown;
      dApp?: unknown;
      transfers?: Array<{ recipient?: string }>;
      [key: string]: unknown;
    };
    const recipient = (r.recipient ||
      r.dApp ||
      (r.transfers as Array<{ recipient?: string }> | undefined)?.[0]?.recipient) as
      | string
      | undefined;
    if (recipient) {
      chainId = chainIdFromRecipient(recipient);
    }
  }
  return {
    version,
    type,
    chainId,
    senderPublicKey: base58Decode(senderPublicKey),
    timestamp: BigInt(timestamp),
    fee: amountToProto(fee, (rest as unknown as { feeAssetId?: string | null }).feeAssetId),
    data: typename,
  };
};

const getCommonSignedFields = (tx: TTx) => {
  const fields: ReturnType<typeof getCommonFields> & { proofs?: string[] } = getCommonFields(tx);

  if (Object.hasOwn(tx, 'proofs')) {
    fields.proofs = tx.proofs;
  }

  return fields;
};

const getIssueData = (t: IssueTransaction) => ({
  name: t.name,
  description: t.description === '' ? undefined : t.description,
  amount: BigInt(t.quantity),
  decimals: t.decimals === 0 ? undefined : t.decimals,
  reissuable: t.reissuable ? true : undefined,
  script: t.script == null ? new Uint8Array() : (scriptToProto(t.script) ?? new Uint8Array()),
});
const getTransferData = (t: TransferTransaction) => ({
  recipient: recipientToProto(t.recipient),
  amount: amountToProto(t.amount, t.assetId),
  attachment:
    t.attachment == null || t.attachment === '' ? new Uint8Array() : base58Decode(t.attachment),
});
const getReissueData = (t: ReissueTransaction) => ({
  assetAmount: amountToProto(t.quantity, t.assetId),
  reissuable: t.reissuable ? true : undefined,
});
const getBurnData = (t: BurnTransaction) => ({
  assetAmount: amountToProto(t.amount, t.assetId),
});
const getExchangeData = (t: ExchangeTransaction & WithChainId) => ({
  amount: BigInt(t.amount),
  price: BigInt(t.price),
  buyMatcherFee: BigInt(t.buyMatcherFee),
  sellMatcherFee: BigInt(t.sellMatcherFee),
  orders: [
    orderToProto({ chainId: t.chainId, ...t.order1 } as OrderProtoInput),
    orderToProto({ chainId: t.chainId, ...t.order2 } as OrderProtoInput),
  ],
});
const getLeaseData = (t: LeaseTransaction) => ({
  recipient: recipientToProto(t.recipient),
  amount: BigInt(t.amount),
});
const getCancelLeaseData = (t: CancelLeaseTransaction) => ({
  leaseId: base58Decode(t.leaseId),
});
const getAliasData = (t: AliasTransaction) => ({
  alias: t.alias,
});
const getMassTransferData = (t: MassTransferTransaction) => ({
  assetId: t.assetId == null ? new Uint8Array() : base58Decode(t.assetId),
  attachment:
    t.attachment == null || t.attachment === '' ? new Uint8Array() : base58Decode(t.attachment),
  transfers: t.transfers.map(massTransferItemToProto),
});
const getDataTxData = (t: DataTransaction) => ({
  data: t.data.map(dataEntryToProto),
});
const getSetScriptData = (t: SetScriptTransaction) => ({
  script: t.script == null ? new Uint8Array() : (scriptToProto(t.script) ?? new Uint8Array()),
});
const getSponsorData = (t: SponsorshipTransaction) => ({
  minFee:
    t.minSponsoredAssetFee === null
      ? amountToProto(0, t.assetId)
      : amountToProto(t.minSponsoredAssetFee, t.assetId),
});
const getSetAssetScriptData = (t: SetAssetScriptTransaction) => ({
  assetId: base58Decode(t.assetId),
  script: t.script == null ? new Uint8Array() : (scriptToProto(t.script) ?? new Uint8Array()),
});
const getInvokeData = (t: InvokeScriptTransaction) => {
  const callSchemaEntry = schemas.invokeScriptSchemaV1.schema[5];
  if (!callSchemaEntry) throw new Error('Missing invoke script call schema entry');
  return {
    dApp: recipientToProto(t.dApp),
    functionCall: binary.serializerFromSchema(callSchemaEntry[1])(t.call),
    payments:
      t.payment == null
        ? []
        : t.payment.map(({ amount, assetId }) => amountToProto(amount, assetId)),
  };
};

const getUpdateAssetInfoData = (t: UpdateAssetInfoTransaction) => {
  return {
    assetId: base58Decode(t.assetId),
    name: t.name,
    description: t.description === '' ? undefined : t.description,
  };
};

const getTxData = (
  t: Exclude<TTransaction, GenesisTransaction>,
): unknown /*dccProto.waves.ITransaction*/ => {
  let txData: unknown;

  switch (t.type) {
    case TRANSACTION_TYPE.ISSUE:
      txData = getIssueData(t);
      break;
    case TRANSACTION_TYPE.TRANSFER:
      txData = getTransferData(t);
      break;
    case TRANSACTION_TYPE.REISSUE:
      txData = getReissueData(t);
      break;
    case TRANSACTION_TYPE.BURN:
      txData = getBurnData(t);
      break;
    case TRANSACTION_TYPE.LEASE:
      txData = getLeaseData(t);
      break;
    case TRANSACTION_TYPE.CANCEL_LEASE:
      txData = getCancelLeaseData(t);
      break;
    case TRANSACTION_TYPE.ALIAS:
      txData = getAliasData(t);
      break;
    case TRANSACTION_TYPE.MASS_TRANSFER:
      txData = getMassTransferData(t);
      break;
    case TRANSACTION_TYPE.DATA:
      txData = getDataTxData(t);
      break;
    case TRANSACTION_TYPE.SET_SCRIPT:
      txData = getSetScriptData(t);
      break;
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      txData = getSetAssetScriptData(t);
      break;
    case TRANSACTION_TYPE.SPONSORSHIP:
      txData = getSponsorData(t);
      break;
    case TRANSACTION_TYPE.EXCHANGE:
      txData = getExchangeData(t);
      break;
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      txData = getInvokeData(t);
      break;
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      txData = getUpdateAssetInfoData(t);
      break;
  }

  return txData;
};

export const txToProto = (t: Exclude<TTransaction, GenesisTransaction>): Transaction => {
  const common = getCommonFields(t);
  const txData = getTxData(t);
  const dataCase = common.data as Transaction['data']['case'];

  return create(TransactionSchema, {
    chainId: common.chainId,
    senderPublicKey: common.senderPublicKey as Uint8Array,
    fee: common.fee as Amount,
    timestamp: common.timestamp as bigint,
    version: common.version as number,
    data: { case: dataCase, value: txData } as Transaction['data'],
  });
};

export const signedTxToProto = (t: TTx): SignedTransaction => {
  const common = getCommonSignedFields(t);
  const txData = getTxData(t);
  const dataCase = common.data as Transaction['data']['case'];

  const wavesTransaction = create(TransactionSchema, {
    chainId: common.chainId,
    senderPublicKey: common.senderPublicKey as Uint8Array,
    fee: common.fee as Amount,
    timestamp: common.timestamp as bigint,
    version: common.version as number,
    data: { case: dataCase, value: txData } as Transaction['data'],
  });

  return create(SignedTransactionSchema, {
    transaction: {
      case: 'wavesTransaction',
      value: wavesTransaction,
    },
    proofs: (t.proofs || []).map(proof2Uint8Array),
  });
};

const orderToProto = (o: OrderProtoInput): Order => {
  let priceMode: Order_PriceMode | undefined;
  if (o.version === 4 && 'priceMode' in o) {
    if (o.priceMode === 0 || o.priceMode === 'default') {
      priceMode = undefined;
    } else {
      if (o.priceMode === 'assetDecimals') {
        priceMode = Order_PriceMode.ASSET_DECIMALS;
      } else {
        priceMode = Order_PriceMode.FIXED_DECIMALS;
      }
    }
  } else priceMode = undefined;

  const isNullOrDcc = (asset: string | null) => asset == null || asset.toLowerCase() === 'dcc';
  const ap = o.assetPair as { amountAsset: string | null; priceAsset: string | null };
  return create(OrderSchema, {
    chainId: o.chainId as number,
    sender: o.senderPublicKey
      ? { case: 'senderPublicKey', value: base58Decode(o.senderPublicKey as string) }
      : o.eip712Signature
        ? { case: 'eip712Signature', value: base16Decode((o.eip712Signature as string).slice(2)) }
        : { case: undefined },
    matcherPublicKey: base58Decode(o.matcherPublicKey as string),
    assetPair: {
      amountAssetId: isNullOrDcc(ap.amountAsset)
        ? new Uint8Array()
        : base58Decode(ap.amountAsset as string),
      priceAssetId: isNullOrDcc(ap.priceAsset)
        ? new Uint8Array()
        : base58Decode(ap.priceAsset as string),
    } as AssetPair,
    orderSide: o.orderType === 'buy' ? Order_Side.BUY : Order_Side.SELL,
    amount: BigInt(o.amount as string | number),
    price: BigInt(o.price as string | number),
    timestamp: BigInt(o.timestamp as string | number),
    expiration: BigInt(o.expiration as string | number),
    matcherFee: amountToProto(
      o.matcherFee as string | number,
      o.matcherFeeAssetId ? (o.matcherFeeAssetId as string) : null,
    ),
    version: o.version as number,
    proofs: (o.proofs as string[] | undefined)?.map(base58Decode) ?? [],
    priceMode: priceMode ?? Order_PriceMode.DEFAULT,
  });
};

const orderFromProto = (
  po: Order,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder> & WithChainId => {
  let priceMode: string | undefined;
  if (po.version === 4 && po.priceMode != null) {
    if (po.priceMode === Order_PriceMode.FIXED_DECIMALS) {
      priceMode = 'fixedDecimals';
    } else {
      priceMode = 'assetDecimals';
    }
  }

  return {
    version: po.version as 1 | 2 | 3 | 4,
    senderPublicKey:
      po.sender.case === 'senderPublicKey'
        ? base58Encode(po.sender.value)
        : base58Encode(new Uint8Array()),
    matcherPublicKey: base58Encode(po.matcherPublicKey),
    assetPair: {
      amountAsset:
        po.assetPair?.amountAssetId == null || po.assetPair.amountAssetId.length === 0
          ? null
          : base58Encode(po.assetPair.amountAssetId),
      priceAsset:
        po.assetPair?.priceAssetId == null || po.assetPair.priceAssetId.length === 0
          ? null
          : base58Encode(po.assetPair.priceAssetId),
    },
    chainId: po.chainId,
    orderType: po.orderSide === Order_Side.BUY ? 'buy' : 'sell',
    amount: convertNumber(po.amount),
    price: convertNumber(po.price),
    timestamp: Number(po.timestamp),
    expiration: Number(po.expiration),
    matcherFee: convertNumber(po.matcherFee?.amount ?? 0n),
    matcherFeeAssetId:
      po.matcherFee?.assetId == null || po.matcherFee.assetId.length === 0
        ? null
        : base58Encode(po.matcherFee.assetId),
    // @ts-expect-error
    priceMode: priceMode,
    eip712Signature:
      po.sender.case === 'eip712Signature' && po.sender.value.length
        ? `0x${base16Encode(po.sender.value)}`
        : undefined,
  };
};

const recipientToProto = (r: string): Recipient =>
  create(RecipientSchema, {
    recipient: r.startsWith('alias')
      ? { case: 'alias', value: r.slice(8) }
      : { case: 'publicKeyHash', value: base58Decode(r).slice(2, -4) },
  });
const amountToProto = (a: string | number, assetId?: string | null): Amount =>
  create(AmountSchema, {
    amount: a === 0 ? 0n : BigInt(a),
    assetId: assetId == null ? new Uint8Array() : base58Decode(assetId),
  });
const massTransferItemToProto = (mti: MassTransferItem) => ({
  recipient: recipientToProto(mti.recipient),
  amount: mti.amount === 0 ? 0n : BigInt(mti.amount),
});
export const dataEntryToProto = (de: DataTransactionEntry): DataEntry =>
  create(DataEntrySchema, {
    key: de.key,
    value:
      de.type === 'integer'
        ? { case: 'intValue', value: BigInt(de.value) }
        : de.type === 'boolean'
          ? { case: 'boolValue', value: de.value }
          : de.type === 'binary'
            ? {
                case: 'binaryValue',
                value: base64Decode(de.value.startsWith('base64:') ? de.value.slice(7) : de.value),
              }
            : de.type === 'string'
              ? { case: 'stringValue', value: de.value }
              : { case: undefined },
  });
export const scriptToProto = (s: string): Uint8Array | null => {
  return s ? base64Decode(s.toString().startsWith('base64:') ? s.slice(7) : s) : null;
};

const nameByType = {
  1: 'genesis' as const,
  2: 'payment' as const,
  3: 'issue' as const,
  4: 'transfer' as const,
  5: 'reissue' as const,
  6: 'burn' as const,
  7: 'exchange' as const,
  8: 'lease' as const,
  9: 'leaseCancel' as const,
  10: 'createAlias' as const,
  11: 'massTransfer' as const,
  12: 'dataTransaction' as const,
  13: 'setScript' as const,
  14: 'sponsorFee' as const,
  15: 'setAssetScript' as const,
  16: 'invokeScript' as const,
  17: 'updateAssetInfo' as const,
};
const typeByName = {
  genesis: 1 as const,
  payment: 2 as const,
  issue: 3 as const,
  transfer: 4 as const,
  reissue: 5 as const,
  burn: 6 as const,
  exchange: 7 as const,
  lease: 8 as const,
  leaseCancel: 9 as const,
  createAlias: 10 as const,
  massTransfer: 11 as const,
  dataTransaction: 12 as const,
  setScript: 13 as const,
  sponsorFee: 14 as const,
  setAssetScript: 15 as const,
  invokeScript: 16 as const,
  updateAssetInfo: 17 as const,
};

const proof2Uint8Array = (proof: string): Uint8Array => {
  return base58Decode(proof);
};

const uint8Array2proof = (proofBytes: Uint8Array): string => {
  return base58Encode(proofBytes);
};
