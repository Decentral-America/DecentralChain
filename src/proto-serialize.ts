import { binary, schemas } from '@decentralchain/marshall';
import * as dccProto from '@decentralchain/protobuf-serialization';
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
import Long from 'long';
import { base64Prefix, chainIdFromRecipient } from './generic';
import { type TTransaction, type TTx, type WithChainId } from './transactions';

const invokeScriptCallSchema = {
  ...schemas.txFields.functionCall[1],
};

const recipientFromProto = (recipient: dccProto.waves.IRecipient, chainId: number): string => {
  if (recipient.alias) {
    return `alias:${String.fromCharCode(chainId)}:${recipient.alias}`;
  }

  const rawAddress = concat([1], [chainId], recipient?.publicKeyHash as Uint8Array);
  const checkSum = keccak(blake2b(rawAddress)).slice(0, 4);

  return base58Encode(concat(rawAddress, checkSum));
};

function convertNumber(n: Long) {
  const MAX_SAFE = Long.fromNumber(Number.MAX_SAFE_INTEGER);
  const MIN_SAFE = Long.fromNumber(Number.MIN_SAFE_INTEGER);

  return n.greaterThan(MAX_SAFE) || n.lessThan(MIN_SAFE) ? n.toString() : n.toNumber();
}

export function txToProtoBytes(obj: TTransaction): Uint8Array {
  return new Uint8Array(dccProto.waves.Transaction.encode(txToProto(obj)).finish());
}

export function signedTxToProtoBytes(obj: TTx): Uint8Array {
  return new Uint8Array(dccProto.waves.SignedTransaction.encode(signedTxToProto(obj)).finish());
}

export function protoBytesToSignedTx(bytes: Uint8Array): TTx {
  const txData = dccProto.waves.SignedTransaction.decode(bytes);
  const tx: TTransaction = protoTxDataToTx(
    txData.transaction as never as dccProto.waves.Transaction,
  );

  const signedTx: TTx = {
    ...tx,
    proofs: (txData.proofs || []).map(uint8Array2proof),
  };

  return signedTx;
}

export function protoBytesToTx(bytes: Uint8Array): TTransaction {
  const t = dccProto.waves.Transaction.decode(bytes);
  const res = protoTxDataToTx(t);

  return res;
}

export function protoTxDataToTx(t: dccProto.waves.Transaction): TTransaction {
  type transactionTypes =
    | 'genesis'
    | 'payment'
    | 'issue'
    | 'transfer'
    | 'reissue'
    | 'burn'
    | 'exchange'
    | 'lease'
    | 'leaseCancel'
    | 'createAlias'
    | 'massTransfer'
    | 'dataTransaction'
    | 'setScript'
    | 'sponsorFee'
    | 'setAssetScript'
    | 'invokeScript'
    | 'updateAssetInfo';

  const res: Record<string, unknown> = {
    version: t.version,
    type: typeByName[t.data as transactionTypes] as TransactionType,
    senderPublicKey: base58Encode(t.senderPublicKey),
    timestamp: t.timestamp.toNumber(),
    fee: convertNumber(t.fee?.amount as Long),
    // chainId: t.chainId
  };

  if (Object.hasOwn(t.fee as object, 'assetId')) {
    res.feeAssetId = base58Encode(t.fee?.assetId as Uint8Array);
  } else {
    res.feeAssetId = null;
  }

  if (Object.hasOwn(t, 'chainId')) {
    res.chainId = t.chainId;
  }
  switch (t.data) {
    case 'issue':
      res.name = t.issue?.name;
      res.description = t.issue?.description;
      res.quantity = convertNumber(t.issue?.amount as Long);
      res.decimals = t.issue?.decimals;
      res.reissuable = t.issue?.reissuable;
      res.script = Object.hasOwn(t.issue as object, 'script')
        ? base64Prefix(base64Encode(t.issue?.script as Uint8Array))
        : null;
      break;
    case 'transfer':
      res.amount = convertNumber(t.transfer?.amount?.amount as Long);
      res.recipient = recipientFromProto(
        t.transfer?.recipient as dccProto.waves.IRecipient,
        t.chainId,
      );
      res.attachment = Object.hasOwn(t.transfer as object, 'attachment')
        ? base58Encode(t.transfer?.attachment as Uint8Array)
        : '';
      res.assetId = Object.hasOwn(t.transfer?.amount as object, 'assetId')
        ? base58Encode(t.transfer?.amount?.assetId as Uint8Array)
        : null;
      break;
    case 'reissue':
      res.quantity = convertNumber(t.reissue?.assetAmount?.amount as Long);
      res.assetId =
        t.reissue?.assetAmount?.assetId == null
          ? null
          : base58Encode(t.reissue?.assetAmount?.assetId);
      res.reissuable = t.reissue?.reissuable;
      break;
    case 'burn':
      res.amount = convertNumber(t.burn?.assetAmount?.amount as Long);
      res.assetId = base58Encode(t.burn?.assetAmount?.assetId as Uint8Array);
      break;
    case 'exchange':
      res.amount = convertNumber(t.exchange?.amount as Long);
      res.price = convertNumber(t.exchange?.price as Long);
      res.buyMatcherFee = convertNumber(t.exchange?.buyMatcherFee as Long);
      res.sellMatcherFee = convertNumber(t.exchange?.sellMatcherFee as Long);
      res.order1 = orderFromProto(t.exchange?.orders?.[0] as dccProto.waves.IOrder);
      res.order2 = orderFromProto(t.exchange?.orders?.[1] as dccProto.waves.IOrder);
      break;
    case 'lease':
      res.recipient = recipientFromProto(
        t.lease?.recipient as dccProto.waves.IRecipient,
        t.chainId,
      );
      res.amount = convertNumber(t.lease?.amount as Long);
      break;
    case 'leaseCancel':
      res.leaseId = base58Encode(t.leaseCancel?.leaseId as Uint8Array);
      break;
    case 'createAlias':
      res.alias = t.createAlias?.alias;
      break;
    case 'massTransfer':
      res.assetId = Object.hasOwn(t.massTransfer as object, 'assetId')
        ? base58Encode(t.massTransfer?.assetId as Uint8Array)
        : null;
      res.attachment = Object.hasOwn(t.massTransfer as object, 'attachment')
        ? base58Encode(t.massTransfer?.attachment as Uint8Array)
        : '';

      res.transfers = t.massTransfer?.transfers?.map(({ amount, recipient }) => ({
        amount: convertNumber(amount as Long),
        recipient: recipientFromProto(recipient as dccProto.waves.IRecipient, t.chainId),
      }));
      break;
    case 'dataTransaction':
      res.data = t.dataTransaction?.data?.map((de) => {
        if (Object.hasOwn(de, 'binaryValue'))
          return {
            key: de.key,
            type: 'binary',
            value: base64Prefix(base64Encode(de.binaryValue as Uint8Array)),
          };
        if (Object.hasOwn(de, 'boolValue'))
          return { key: de.key, type: 'boolean', value: de.boolValue };
        if (Object.hasOwn(de, 'intValue'))
          return {
            key: de.key,
            type: 'integer',
            value: convertNumber(de.intValue as Long),
          };
        if (Object.hasOwn(de, 'stringValue'))
          return { key: de.key, type: 'string', value: de.stringValue };
        return { key: de.key, value: null };
      });
      break;
    case 'setScript':
      res.script = Object.hasOwn(t.setScript as object, 'script')
        ? base64Prefix(base64Encode(t.setScript?.script as Uint8Array))
        : null;
      break;
    case 'sponsorFee':
      res.minSponsoredAssetFee = convertNumber(t.sponsorFee?.minFee?.amount as Long);
      res.assetId = base58Encode(t.sponsorFee?.minFee?.assetId as Uint8Array);
      break;
    case 'setAssetScript':
      res.assetId = base58Encode(t.setAssetScript?.assetId as Uint8Array);
      res.script = base64Prefix(base64Encode(t.setAssetScript?.script as Uint8Array));
      break;
    case 'invokeScript':
      res.dApp = recipientFromProto(t.invokeScript?.dApp as dccProto.waves.IRecipient, t.chainId);
      if (t.invokeScript?.functionCall != null) {
        res.call = binary.parserFromSchema(invokeScriptCallSchema)(
          t.invokeScript?.functionCall as Uint8Array,
        ).value; // marshall exposes only parserFromSchema; no dedicated parseInvokeScriptCall exists
      }
      res.payment = t.invokeScript?.payments?.map((p) => ({
        amount: convertNumber(p.amount as Long),
        assetId: Object.hasOwn(p, 'assetId') ? base58Encode(p.assetId as Uint8Array) : null,
      }));
      break;
    case 'updateAssetInfo':
      res.assetId = base58Encode(t.updateAssetInfo?.assetId as Uint8Array);
      res.name = t.updateAssetInfo?.name;
      res.description = t.updateAssetInfo?.description;
      break;
    default:
      throw new Error(`Unsupported tx type ${t.data}`);
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
  return dccProto.waves.Order.encode(
    orderToProto(obj as unknown as Record<string, unknown>),
  ).finish();
}

export function protoBytesToOrder(bytes: Uint8Array) {
  const o = dccProto.waves.Order.decode(bytes);
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
    const r = rest as unknown as Record<string, unknown>;
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
    timestamp: Long.fromValue(timestamp),
    fee: amountToProto(
      fee,
      (rest as unknown as Record<string, unknown>).feeAssetId as string | null | undefined,
    ),
    data: typename,
  };
};

const getCommonSignedFields = (tx: TTx) => {
  const fields = getCommonFields(tx) as Record<string, unknown>;

  if (Object.hasOwn(tx, 'proofs')) {
    fields.proofs = tx.proofs;
  }

  return fields;
};

const getIssueData = (t: IssueTransaction): dccProto.waves.IIssueTransactionData => ({
  name: t.name,
  description: t.description === '' ? null : t.description,
  amount: Long.fromValue(t.quantity),
  decimals: t.decimals === 0 ? null : t.decimals,
  reissuable: t.reissuable ? true : null,
  script: t.script == null ? null : scriptToProto(t.script),
});
const getTransferData = (t: TransferTransaction): dccProto.waves.ITransferTransactionData => ({
  recipient: recipientToProto(t.recipient),
  amount: amountToProto(t.amount, t.assetId),
  attachment: t.attachment == null || t.attachment === '' ? null : base58Decode(t.attachment),
});
const getReissueData = (t: ReissueTransaction): dccProto.waves.IReissueTransactionData => ({
  assetAmount: amountToProto(t.quantity, t.assetId),
  reissuable: t.reissuable ? true : null,
});
const getBurnData = (t: BurnTransaction): dccProto.waves.IBurnTransactionData => ({
  assetAmount: amountToProto(t.amount, t.assetId),
});
const getExchangeData = (
  t: ExchangeTransaction & WithChainId,
): dccProto.waves.IExchangeTransactionData => ({
  amount: Long.fromValue(t.amount),
  price: Long.fromValue(t.price),
  buyMatcherFee: Long.fromValue(t.buyMatcherFee),
  sellMatcherFee: Long.fromValue(t.sellMatcherFee),
  orders: [
    orderToProto({ chainId: t.chainId, ...t.order1 } as Record<string, unknown>),
    orderToProto({ chainId: t.chainId, ...t.order2 } as Record<string, unknown>),
  ],
});
const getLeaseData = (t: LeaseTransaction): dccProto.waves.ILeaseTransactionData => ({
  recipient: recipientToProto(t.recipient),
  amount: Long.fromValue(t.amount),
});
const getCancelLeaseData = (
  t: CancelLeaseTransaction,
): dccProto.waves.ILeaseCancelTransactionData => ({
  leaseId: base58Decode(t.leaseId),
});
const getAliasData = (t: AliasTransaction): dccProto.waves.ICreateAliasTransactionData => ({
  alias: t.alias,
});
const getMassTransferData = (
  t: MassTransferTransaction,
): dccProto.waves.IMassTransferTransactionData => ({
  assetId: t.assetId == null ? null : base58Decode(t.assetId),
  attachment: t.attachment == null || t.attachment === '' ? null : base58Decode(t.attachment),
  transfers: t.transfers.map(massTransferItemToProto),
});
const getDataTxData = (t: DataTransaction): dccProto.waves.IDataTransactionData => ({
  data: t.data.map(dataEntryToProto),
});
const getSetScriptData = (t: SetScriptTransaction): dccProto.waves.ISetScriptTransactionData => ({
  script: t.script == null ? null : scriptToProto(t.script),
});
const getSponsorData = (t: SponsorshipTransaction): dccProto.waves.ISponsorFeeTransactionData => ({
  minFee:
    t.minSponsoredAssetFee === null
      ? amountToProto(0, t.assetId)
      : amountToProto(t.minSponsoredAssetFee, t.assetId),
});
const getSetAssetScriptData = (
  t: SetAssetScriptTransaction,
): dccProto.waves.ISetAssetScriptTransactionData => ({
  assetId: base58Decode(t.assetId),
  script: t.script == null ? null : scriptToProto(t.script),
});
const getInvokeData = (
  t: InvokeScriptTransaction,
): dccProto.waves.IInvokeScriptTransactionData => ({
  dApp: recipientToProto(t.dApp),
  functionCall: binary.serializerFromSchema(schemas.invokeScriptSchemaV1.schema[5]![1])(t.call),
  payments:
    t.payment == null
      ? null
      : t.payment.map(({ amount, assetId }) => amountToProto(amount, assetId)),
});

const getUpdateAssetInfoData = (
  t: UpdateAssetInfoTransaction,
): dccProto.waves.IUpdateAssetInfoTransactionData => {
  return {
    assetId: base58Decode(t.assetId),
    name: t.name,
    description: t.description === '' ? null : t.description,
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

export const txToProto = (
  t: Exclude<TTransaction, GenesisTransaction>,
): dccProto.waves.ITransaction => {
  const common = getCommonFields(t);
  const txData = getTxData(t);

  return {
    ...common,
    [common.data as string]: txData,
  };
};

export const signedTxToProto = (t: TTx): dccProto.waves.ISignedTransaction => {
  const common = getCommonSignedFields(t);
  const txData = getTxData(t);

  return {
    // NOTE: The protobuf schema defines this field as 'wavesTransaction' for
    // protocol compatibility. This is a protobuf wire-format name inherited
    // from the upstream protocol specification, not a branding reference.
    wavesTransaction: {
      ...common,
      [common.data as string]: txData,
    },
    proofs: (t.proofs || []).map(proof2Uint8Array),
  };
};

const orderToProto = (o: Record<string, unknown>): dccProto.waves.IOrder => {
  let priceMode: number | undefined;
  if (o.version === 4 && 'priceMode' in o) {
    if (o.priceMode === 0 || o.priceMode === 'default') {
      priceMode = undefined;
    } else {
      if (o.priceMode === 'assetDecimals') {
        priceMode = dccProto.waves.Order.PriceMode.ASSET_DECIMALS;
      } else {
        priceMode = dccProto.waves.Order.PriceMode.FIXED_DECIMALS;
      }
    }
  } else priceMode = undefined;

  const isNullOrDcc = (asset: string | null) => asset == null || asset.toLowerCase() === 'dcc';
  const ap = o.assetPair as { amountAsset: string | null; priceAsset: string | null };
  return {
    chainId: o.chainId as number,
    senderPublicKey: o.senderPublicKey ? base58Decode(o.senderPublicKey as string) : null,
    matcherPublicKey: base58Decode(o.matcherPublicKey as string),
    assetPair: {
      amountAssetId: isNullOrDcc(ap.amountAsset) ? null : base58Decode(ap.amountAsset as string),
      priceAssetId: isNullOrDcc(ap.priceAsset) ? null : base58Decode(ap.priceAsset as string),
    },
    orderSide: o.orderType === 'buy' ? null : dccProto.waves.Order.Side.SELL,
    amount: Long.fromValue(o.amount as string | number),
    price: Long.fromValue(o.price as string | number),
    timestamp: Long.fromValue(o.timestamp as string | number),
    expiration: Long.fromValue(o.expiration as string | number),
    matcherFee: amountToProto(
      o.matcherFee as string | number,
      o.matcherFeeAssetId ? (o.matcherFeeAssetId as string) : null,
    ),
    version: o.version as number,
    proofs: (o.proofs as string[] | undefined)?.map(base58Decode) ?? null,
    eip712Signature: o.eip712Signature
      ? base16Decode((o.eip712Signature as string).slice(2))
      : null,
    priceMode: priceMode ?? null,
  };
};

const orderFromProto = (
  po: dccProto.waves.IOrder,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder> & WithChainId => {
  let priceMode: string | undefined;
  if (po.version === 4 && po.priceMode != null) {
    if (po.priceMode === 1) {
      priceMode = 'fixedDecimals';
    } else {
      priceMode = 'assetDecimals';
    }
  }

  return {
    version: po.version as 1 | 2 | 3 | 4,
    senderPublicKey: base58Encode(po.senderPublicKey as Uint8Array),
    matcherPublicKey: base58Encode(po.matcherPublicKey as Uint8Array),
    assetPair: {
      amountAsset:
        po?.assetPair?.amountAssetId == null ? null : base58Encode(po?.assetPair?.amountAssetId),
      priceAsset:
        po?.assetPair?.priceAssetId == null ? null : base58Encode(po?.assetPair?.priceAssetId),
    },
    // @ts-expect-error
    chainId: po.chainId,
    orderType: po.orderSide === dccProto.waves.Order.Side.BUY ? 'buy' : 'sell',
    amount: convertNumber(po.amount as Long),
    price: convertNumber(po.price as Long),
    timestamp: po.timestamp?.toNumber() ?? 0,
    expiration: po.expiration?.toNumber() ?? 0,
    matcherFee: convertNumber(po.matcherFee?.amount as Long),
    matcherFeeAssetId:
      po.matcherFee?.assetId == null ? null : base58Encode(po.matcherFee?.assetId as Uint8Array),
    // @ts-expect-error
    priceMode: priceMode,
    eip712Signature: po.eip712Signature?.length
      ? `0x${base16Encode(po.eip712Signature)}`
      : undefined,
  };
};

const recipientToProto = (r: string): dccProto.waves.IRecipient => ({
  alias: r.startsWith('alias') ? r.slice(8) : null,
  publicKeyHash: !r.startsWith('alias') ? base58Decode(r).slice(2, -4) : null,
});
const amountToProto = (a: string | number, assetId?: string | null): dccProto.waves.IAmount => ({
  amount: a === 0 ? null : Long.fromValue(a),
  assetId: assetId == null ? null : base58Decode(assetId),
});
const massTransferItemToProto = (
  mti: MassTransferItem,
): dccProto.waves.MassTransferTransactionData.ITransfer => ({
  recipient: recipientToProto(mti.recipient),
  amount: mti.amount === 0 ? null : Long.fromValue(mti.amount),
});
export const dataEntryToProto = (de: DataTransactionEntry): dccProto.waves.IDataEntry => ({
  key: de.key,
  intValue: de.type === 'integer' ? Long.fromValue(de.value) : null,
  boolValue: de.type === 'boolean' ? de.value : null,
  binaryValue:
    de.type === 'binary'
      ? base64Decode(de.value.startsWith('base64:') ? de.value.slice(7) : de.value)
      : null,
  stringValue: de.type === 'string' ? de.value : null,
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
