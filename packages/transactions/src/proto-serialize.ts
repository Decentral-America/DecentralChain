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
import { binary, schemas } from '@decentralchain/marshall';
import {
  AliasTransaction,
  BurnTransaction,
  CancelLeaseTransaction,
  DataTransaction,
  DataTransactionEntry,
  ExchangeTransactionOrder,
  InvokeScriptTransaction,
  IssueTransaction,
  LeaseTransaction,
  MassTransferItem,
  MassTransferTransaction,
  ReissueTransaction,
  SetAssetScriptTransaction,
  SetScriptTransaction,
  SignedIExchangeTransactionOrder,
  SponsorshipTransaction,
  TRANSACTION_TYPE,
  TransactionType,
  TransferTransaction,
  UpdateAssetInfoTransaction,
  GenesisTransaction,
} from '@decentralchain/ts-types';
import { base64Prefix, chainIdFromRecipient } from './generic';
import Long from 'long';
import { TTx, TTransaction, WithChainId } from './transactions';

const invokeScriptCallSchema = {
  ...schemas.txFields.functionCall[1],
};

const recipientFromProto = (recipient: dccProto.waves.IRecipient, chainId: number): string => {
  if (recipient.alias) {
    return `alias:${String.fromCharCode(chainId)}:${recipient.alias}`;
  }

  const rawAddress = concat([1], [chainId], recipient!.publicKeyHash!);
  const checkSum = keccak(blake2b(rawAddress)).slice(0, 4);

  return base58Encode(concat(rawAddress, checkSum));
};

function convertNumber(n: Long) {
  const maxJsNumber = 2 ** 53 - 1;

  return n.toNumber() > maxJsNumber ? n.toString() : n.toNumber();
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

  const res: any = {
    version: t.version,
    type: typeByName[t.data! as transactionTypes] as TransactionType,
    senderPublicKey: base58Encode(t.senderPublicKey),
    timestamp: t.timestamp.toNumber(),
    fee: convertNumber(t.fee!.amount!),
    // chainId: t.chainId
  };

  if (t.fee!.hasOwnProperty('assetId')) {
    res.feeAssetId = base58Encode(t.fee!.assetId!);
  } else {
    res.feeAssetId = null;
  }

  if (t.hasOwnProperty('chainId')) {
    res.chainId = t.chainId;
  }
  switch (t.data) {
    case 'issue':
      res.name = t.issue!.name!;
      res.description = t.issue!.description!;
      res.quantity = convertNumber(t.issue!.amount!);
      res.decimals = t.issue!.decimals;
      res.reissuable = t.issue!.reissuable;
      res.script = t.issue!.hasOwnProperty('script')
        ? base64Prefix(base64Encode(t.issue!.script!))
        : null;
      break;
    case 'transfer':
      res.amount = convertNumber(t.transfer!.amount!.amount!);
      res.recipient = recipientFromProto(t.transfer!.recipient!, t.chainId);
      res.attachment = t.transfer!.hasOwnProperty('attachment')
        ? base58Encode(t.transfer!.attachment!)
        : '';
      res.assetId = t.transfer!.amount!.hasOwnProperty('assetId')
        ? base58Encode(t.transfer!.amount!.assetId!)
        : null;
      break;
    case 'reissue':
      res.quantity = convertNumber(t.reissue!.assetAmount!.amount!);
      res.assetId =
        t.reissue!.assetAmount!.assetId == null
          ? null
          : base58Encode(t.reissue!.assetAmount!.assetId);
      res.reissuable = t.reissue!.reissuable;
      break;
    case 'burn':
      res.amount = convertNumber(t.burn!.assetAmount!.amount!);
      res.assetId = base58Encode(t.burn!.assetAmount!.assetId!);
      break;
    case 'exchange':
      res.amount = convertNumber(t.exchange!.amount!);
      res.price = convertNumber(t.exchange!.price!);
      res.buyMatcherFee = convertNumber(t.exchange!.buyMatcherFee!);
      res.sellMatcherFee = convertNumber(t.exchange!.sellMatcherFee!);
      res.order1 = orderFromProto(t.exchange!.orders![0]!);
      res.order2 = orderFromProto(t.exchange!.orders![1]!);
      break;
    case 'lease':
      res.recipient = recipientFromProto(t.lease!.recipient!, t.chainId);
      res.amount = convertNumber(t.lease!.amount!);
      break;
    case 'leaseCancel':
      res.leaseId = base58Encode(t.leaseCancel!.leaseId!);
      break;
    case 'createAlias':
      res.alias = t.createAlias!.alias;
      break;
    case 'massTransfer':
      res.assetId = t.massTransfer!.hasOwnProperty('assetId')
        ? base58Encode(t.massTransfer!.assetId!)
        : null;
      res.attachment = t.massTransfer!.hasOwnProperty('attachment')
        ? base58Encode(t.massTransfer!.attachment!)
        : '';

      res.transfers = t.massTransfer!.transfers!.map(({ amount, recipient }) => ({
        amount: convertNumber(amount!),
        recipient: recipientFromProto(recipient!, t.chainId),
      }));
      break;
    case 'dataTransaction':
      res.data = t.dataTransaction!.data!.map((de) => {
        if (de.hasOwnProperty('binaryValue'))
          return {
            key: de.key,
            type: 'binary',
            value: base64Prefix(base64Encode(de.binaryValue!)),
          };
        if (de.hasOwnProperty('boolValue'))
          return { key: de.key, type: 'boolean', value: de.boolValue };
        if (de.hasOwnProperty('intValue'))
          return {
            key: de.key,
            type: 'integer',
            value: convertNumber(de.intValue!),
          };
        if (de.hasOwnProperty('stringValue'))
          return { key: de.key, type: 'string', value: de.stringValue };
        return { key: de.key, value: null };
      });
      break;
    case 'setScript':
      res.script = t.setScript!.hasOwnProperty('script')
        ? base64Prefix(base64Encode(t.setScript!.script!))
        : null;
      break;
    case 'sponsorFee':
      res.minSponsoredAssetFee = convertNumber(t.sponsorFee!.minFee!.amount!);
      res.assetId = base58Encode(t.sponsorFee!.minFee!.assetId!);
      break;
    case 'setAssetScript':
      res.assetId = base58Encode(t.setAssetScript!.assetId!);
      res.script = base64Prefix(base64Encode(t.setAssetScript!.script!));
      break;
    case 'invokeScript':
      res.dApp = recipientFromProto(t.invokeScript!.dApp!, t.chainId);
      if (t.invokeScript!.functionCall! != null) {
        res.call = binary.parserFromSchema(invokeScriptCallSchema)(
          t.invokeScript!.functionCall!,
        ).value; //todo: export function call from marshall and use it directly
      }
      res.payment = t.invokeScript!.payments!.map((p) => ({
        amount: convertNumber(p.amount!),
        assetId: p.hasOwnProperty('assetId') ? base58Encode(p.assetId!) : null,
      }));
      break;
    case 'updateAssetInfo':
      res.assetId = base58Encode(t.updateAssetInfo!.assetId!);
      res.name = t.updateAssetInfo!.name;
      res.description = t.updateAssetInfo!.description;
      break;
    default:
      throw new Error(`Unsupported tx type ${t.data}`);
  }

  if (res.hasOwnProperty('chainId')) {
    res.sender = address({ publicKey: t.senderPublicKey }, t.chainId);
  } else {
    const recipient =
      res.recipient ||
      res.dApp ||
      (res.transfers && res.transfers[0] && res.transfers[0].recipient);
    if (recipient) {
      res.sender = address({ publicKey: t.senderPublicKey }, chainIdFromRecipient(recipient));
    }
  }

  return res;
}

export function orderToProtoBytes(obj: ExchangeTransactionOrder): Uint8Array {
  return dccProto.waves.Order.encode(orderToProto(obj as any)).finish();
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
  const typename = nameByType[type];
  let chainId = (rest as any).chainId;
  if (chainId == null) {
    const r: any = rest;
    const recipient =
      r.recipient || r.dApp || (r.transfers && r.transfers[0] && r.transfers[0].recipient);
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
    fee: amountToProto(fee, (rest as any).feeAssetId),
    data: typename,
  };
};

const getCommonSignedFields = (tx: TTx) => {
  const fields: any = getCommonFields(tx);

  if (tx.hasOwnProperty('proofs')) {
    fields.proofs = tx.proofs;
  }

  return fields;
};

const getIssueData = (t: IssueTransaction): dccProto.waves.IIssueTransactionData => ({
  name: t.name,
  description: t.description === '' ? null : t.description,
  amount: Long.fromValue(t.quantity),
  decimals: t.decimals === 0 ? null : t.decimals,
  reissuable: t.reissuable ? true : undefined,
  script: t.script == null ? null : scriptToProto(t.script),
});
const getTransferData = (t: TransferTransaction): dccProto.waves.ITransferTransactionData => ({
  recipient: recipientToProto(t.recipient),
  amount: amountToProto(t.amount, t.assetId),
  attachment: t.attachment == null || t.attachment == '' ? undefined : base58Decode(t.attachment),
});
const getReissueData = (t: ReissueTransaction): dccProto.waves.IReissueTransactionData => ({
  assetAmount: amountToProto(t.quantity, t.assetId),
  reissuable: t.reissuable ? true : undefined,
});
const getBurnData = (t: BurnTransaction): dccProto.waves.IBurnTransactionData => ({
  assetAmount: amountToProto(t.amount, t.assetId),
});
const getExchangeData = (t: any): dccProto.waves.IExchangeTransactionData => ({
  amount: Long.fromValue(t.amount),
  price: Long.fromValue(t.price),
  buyMatcherFee: Long.fromValue(t.buyMatcherFee),
  sellMatcherFee: Long.fromValue(t.sellMatcherFee),
  orders: [
    orderToProto({ chainId: t.chainId, ...t.order1 }),
    orderToProto({ chainId: t.chainId, ...t.order2 }),
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
  attachment: t.attachment == null || t.attachment == '' ? undefined : base58Decode(t.attachment),
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
  functionCall: binary.serializerFromSchema((schemas.invokeScriptSchemaV1 as any).schema[5][1])(
    t.call,
  ),
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
): any /*dccProto.waves.ITransaction*/ => {
  let txData;

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
    [common.data]: txData,
  };
};

export const signedTxToProto = (t: TTx): dccProto.waves.ISignedTransaction => {
  const common = getCommonSignedFields(t);
  const txData = getTxData(t);

  return {
    wavesTransaction: {
      ...common,
      [common.data]: txData,
    },
    proofs: (t.proofs || []).map(proof2Uint8Array),
  };
};

const orderToProto = (o: any): dccProto.waves.IOrder => {
  let priceMode;
  if (o.version === 4 && 'priceMode' in o) {
    if (o.priceMode === 0 || o.priceMode === 'default') {
      priceMode = undefined;
    } else {
      o.priceMode === 'assetDecimals'
        ? (priceMode = dccProto.waves.Order.PriceMode.ASSET_DECIMALS)
        : (priceMode = dccProto.waves.Order.PriceMode.FIXED_DECIMALS);
    }
  } else priceMode = undefined;

  const isNullOrDcc = (asset: string | null) => asset == null || asset.toLowerCase() == 'dcc';
  return {
    chainId: o.chainId,
    senderPublicKey: o.senderPublicKey ? base58Decode(o.senderPublicKey) : null,
    matcherPublicKey: base58Decode(o.matcherPublicKey),
    assetPair: {
      amountAssetId: isNullOrDcc(o.assetPair.amountAsset)
        ? null
        : base58Decode(o.assetPair.amountAsset),
      priceAssetId: isNullOrDcc(o.assetPair.priceAsset)
        ? null
        : base58Decode(o.assetPair.priceAsset),
    },
    orderSide: o.orderType === 'buy' ? undefined : dccProto.waves.Order.Side.SELL,
    amount: Long.fromValue(o.amount),
    price: Long.fromValue(o.price),
    timestamp: Long.fromValue(o.timestamp),
    expiration: Long.fromValue(o.expiration),
    matcherFee: amountToProto(o.matcherFee, o.matcherFeeAssetId ? o.matcherFeeAssetId : null),
    version: o.version,
    proofs: o.proofs?.map(base58Decode),
    eip712Signature: o.eip712Signature ? base16Decode(o.eip712Signature.slice(2)) : undefined,
    priceMode: priceMode,
  };
};

const orderFromProto = (
  po: dccProto.waves.IOrder,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder> & WithChainId => {
  let priceMode;
  if (po.version === 4 && po.priceMode != null) {
    po.priceMode === 1 ? (priceMode = 'fixedDecimals') : (priceMode = 'assetDecimals');
  }

  return {
    version: po.version! as 1 | 2 | 3 | 4,
    senderPublicKey: base58Encode(po.senderPublicKey!),
    matcherPublicKey: base58Encode(po.matcherPublicKey!),
    assetPair: {
      amountAsset:
        po!.assetPair!.amountAssetId == null ? null : base58Encode(po!.assetPair!.amountAssetId),
      priceAsset:
        po!.assetPair!.priceAssetId == null ? null : base58Encode(po!.assetPair!.priceAssetId),
    },
    // @ts-ignore
    chainId: po.chainId,
    orderType: po.orderSide === dccProto.waves.Order.Side.BUY ? 'buy' : 'sell',
    amount: convertNumber(po.amount!),
    price: convertNumber(po.price!),
    timestamp: po.timestamp!.toNumber(),
    expiration: po.expiration!.toNumber(),
    matcherFee: convertNumber(po.matcherFee!.amount!),
    matcherFeeAssetId: po.matcherFee!.assetId == null ? null : base58Encode(po.matcherFee!.assetId),
    // @ts-ignore
    priceMode: priceMode,
    eip712Signature: po.eip712Signature?.length
      ? `0x${base16Encode(po.eip712Signature)}`
      : undefined,
  };
};

const recipientToProto = (r: string): dccProto.waves.IRecipient => ({
  alias: r.startsWith('alias') ? r.slice(8) : undefined,
  publicKeyHash: !r.startsWith('alias') ? base58Decode(r).slice(2, -4) : undefined,
});
const amountToProto = (a: string | number, assetId?: string | null): dccProto.waves.IAmount => ({
  amount: a == 0 ? null : Long.fromValue(a),
  assetId: assetId == null ? null : base58Decode(assetId),
});
const massTransferItemToProto = (
  mti: MassTransferItem,
): dccProto.waves.MassTransferTransactionData.ITransfer => ({
  recipient: recipientToProto(mti.recipient),
  amount: mti.amount == 0 ? null : Long.fromValue(mti.amount),
});
export const dataEntryToProto = (
  de: DataTransactionEntry,
): dccProto.waves.DataTransactionData.IDataEntry => ({
  key: de.key,
  intValue: de.type === 'integer' ? Long.fromValue(de.value) : undefined,
  boolValue: de.type === 'boolean' ? de.value : undefined,
  binaryValue:
    de.type === 'binary'
      ? base64Decode(de.value.startsWith('base64:') ? de.value.slice(7) : de.value)
      : undefined,
  stringValue: de.type === 'string' ? de.value : undefined,
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
