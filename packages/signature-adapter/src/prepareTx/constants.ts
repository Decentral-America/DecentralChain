import { toNode as mlToNode, type TClientEntity } from '@decentralchain/money-like-to-node';
import * as dccTransactions from '@decentralchain/transactions';
import { libs, protoSerialize } from '@decentralchain/transactions';
import { type IAdapterSignMethods } from './interfaces';
import { prepare } from './prepare';
import { SIGN_TYPE } from './signType';

export { SIGN_TYPE };

const { processors } = prepare;

import { Money } from '@decentralchain/data-entities';

const { LEN, SHORT, STRING, LONG, BASE58_STRING } = libs.marshall.serializePrimitives;
const { binary } = libs.marshall;
const { txToProtoBytes, orderToProtoBytes } = protoSerialize;

// ── Runtime Bridge Types ──────────────────────────────────────────────────
// These type aliases + const bridges document the boundary between this
// package's Record<string, unknown> pipeline and the strongly-typed APIs
// in @decentralchain/transactions and @decentralchain/marshall.
// Each `as unknown as` cast is a single, auditable bridge point — zero `any`.

/** Byte serializer compatible with the TxRecord handler pipeline. */
type TByteSerializer = (data: TxRecord) => Uint8Array;

/** Transaction factory bridge — heterogeneous tx records in and out. */
type TTxBridgeFn = (r: TxRecord) => TxRecord;

/** Proof fields present on exchange order data at runtime. */
interface IExchangeOrderData {
  signature?: string;
  proofs?: string[];
  [key: string]: unknown;
}

/**
 * Transaction/order record with known field names flowing through the signing pipeline.
 * Explicit properties enable dot-notation access, satisfying both
 * `noPropertyAccessFromIndexSignature` (TS) and `useLiteralKeys` (Biome).
 */
interface TxRecord {
  timestamp?: unknown;
  price?: unknown;
  orderId?: unknown;
  senderPublicKey?: unknown;
  proofs?: unknown;
  recipient?: unknown;
  attachment?: unknown;
  amount?: unknown;
  quantity?: unknown;
  script?: unknown;
  version?: unknown;
  buyOrder?: unknown;
  sellOrder?: unknown;
  order1?: unknown;
  order2?: unknown;
  chainId?: unknown;
  transfers?: unknown;
  assetId?: unknown;
  dApp?: unknown;
  [key: string]: unknown;
}

// Proto serialization bridges
const protoTxBytes = txToProtoBytes as unknown as TByteSerializer;
const protoOrderBytes = orderToProtoBytes as unknown as TByteSerializer;

// Transaction factory bridges
const txOrder = dccTransactions.order as unknown as TTxBridgeFn;
const txTransfer = dccTransactions.transfer as unknown as TTxBridgeFn;
const txIssue = dccTransactions.issue as unknown as TTxBridgeFn;
const txReissue = dccTransactions.reissue as unknown as TTxBridgeFn;
const txBurn = dccTransactions.burn as unknown as TTxBridgeFn;
const txExchange = dccTransactions.exchange as unknown as TTxBridgeFn;
const txLease = dccTransactions.lease as unknown as TTxBridgeFn;
const txCancelLease = dccTransactions.cancelLease as unknown as TTxBridgeFn;
const txAlias = dccTransactions.alias as unknown as TTxBridgeFn;
const txMassTransfer = dccTransactions.massTransfer as unknown as TTxBridgeFn;
const txData = dccTransactions.data as unknown as TTxBridgeFn;
const txSetScript = dccTransactions.setScript as unknown as TTxBridgeFn;
const txSponsorship = dccTransactions.sponsorship as unknown as TTxBridgeFn;
const txSetAssetScript = dccTransactions.setAssetScript as unknown as TTxBridgeFn;
const txInvokeScript = dccTransactions.invokeScript as unknown as TTxBridgeFn;
const txUpdateAssetInfo = dccTransactions.updateAssetInfo as unknown as TTxBridgeFn;

const toNode = (data: TxRecord, convert?: TTxBridgeFn): TxRecord => {
  const r = mlToNode(data as unknown as TClientEntity);
  const result: TxRecord = { ...r, timestamp: new Date(r.timestamp).getTime() };
  return convert ? convert(result) : result;
};

const burnToNode = (data: TxRecord, convert?: TTxBridgeFn): TxRecord => {
  const r = mlToNode(data as unknown as TClientEntity);
  const withAmount: TxRecord = {
    ...r,
    amount: (r as { quantity?: unknown }).quantity,
  };
  withAmount.timestamp = new Date(withAmount.timestamp as number).getTime();
  return convert ? convert(withAmount) : withAmount;
};

const processScript = (srcScript: string | null) => {
  const scriptText = (srcScript || '').replace('base64:', '');
  return scriptText ? `base64:${scriptText}` : null;
};

export enum TRANSACTION_TYPE_NUMBER {
  SEND_OLD = 2,
  ISSUE = 3,
  TRANSFER = 4,
  REISSUE = 5,
  BURN = 6,
  EXCHANGE = 7,
  LEASE = 8,
  CANCEL_LEASING = 9,
  CREATE_ALIAS = 10,
  MASS_TRANSFER = 11,
  DATA = 12,
  SET_SCRIPT = 13,
  SPONSORSHIP = 14,
  SET_ASSET_SCRIPT = 15,
  SCRIPT_INVOCATION = 16,
  UPDATE_ASSET_INFO = 17,
  ETHEREUM_TX = 18,
}

export interface ITypesMap {
  getBytes: Record<number, TByteSerializer>;
  adapter: keyof IAdapterSignMethods;
  toNode?: (data: TxRecord, networkByte: number) => TxRecord;
}

const getCancelOrderBytes = (txData: TxRecord) => {
  const { orderId, id, senderPublicKey, sender } = txData;
  const pBytes = BASE58_STRING((senderPublicKey || sender) as string);
  const orderIdBytes = BASE58_STRING((id || orderId) as string);

  return Uint8Array.from([...Array.from(pBytes), ...Array.from(orderIdBytes)]);
};

export const SIGN_TYPES: Record<SIGN_TYPE, ITypesMap> = {
  [SIGN_TYPE.AUTH]: {
    adapter: 'signRequest',
    getBytes: {
      1: (txData) => {
        const { host, data } = txData as { host: string; data: string };
        const pBytes = LEN(SHORT)(STRING)('DCCWalletAuthentication');
        const hostBytes = LEN(SHORT)(STRING)(host || '');
        const dataBytes = LEN(SHORT)(STRING)(data || '');

        return Uint8Array.from([
          ...Array.from(pBytes),
          ...Array.from(hostBytes),
          ...Array.from(dataBytes),
        ]);
      },
    },
  },
  [SIGN_TYPE.COINOMAT_CONFIRMATION]: {
    adapter: 'signRequest',
    getBytes: {
      1: (txData) => {
        const { timestamp, prefix } = txData as { timestamp: number; prefix: string };
        const pBytes = LEN(SHORT)(STRING)(prefix);
        const timestampBytes = LONG(timestamp);

        return Uint8Array.from([...Array.from(pBytes), ...Array.from(timestampBytes)]);
      },
    },
  },
  [SIGN_TYPE.DCC_CONFIRMATION]: {
    adapter: 'signRequest',
    getBytes: {
      1: (txData) => {
        const { timestamp, publicKey } = txData as { timestamp: number; publicKey: string };
        const pBytes = BASE58_STRING(publicKey);
        const timestampBytes = LONG(timestamp);

        return Uint8Array.from([...Array.from(pBytes), ...Array.from(timestampBytes)]);
      },
    },
  },
  [SIGN_TYPE.MATCHER_ORDERS]: {
    adapter: 'signRequest',
    getBytes: {
      1: (txData) => {
        const { timestamp, senderPublicKey } = txData as {
          timestamp: number;
          senderPublicKey: string;
        };
        const pBytes = BASE58_STRING(senderPublicKey);
        const timestampBytes = LONG(timestamp);

        return Uint8Array.from([...Array.from(pBytes), ...Array.from(timestampBytes)]);
      },
    },
  },
  [SIGN_TYPE.CREATE_ORDER]: {
    adapter: 'signOrder',
    getBytes: {
      0: binary.serializeOrder,
      1: binary.serializeOrder,
      2: binary.serializeOrder,
      3: binary.serializeOrder,
      4: protoOrderBytes,
    },
    toNode: (data) => {
      const price = processors.toOrderPrice(data);
      const priceObj = data.price as Money;
      return toNode({ ...data, price: Money.fromCoins(price, priceObj.asset) }, txOrder);
    },
  },
  [SIGN_TYPE.CANCEL_ORDER]: {
    adapter: 'signRequest',
    getBytes: {
      0: getCancelOrderBytes,
      1: getCancelOrderBytes,
    },
    toNode: (data) => ({
      orderId: data.orderId,
      sender: data.senderPublicKey,
      senderPublicKey: data.senderPublicKey,
      signature: (data.proofs as string[] | undefined)?.[0],
    }),
  },
  [SIGN_TYPE.TRANSFER]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data, networkByte: number) =>
      toNode(
        {
          ...data,
          attachment: processors.attachment(data.attachment as string | number[] | Uint8Array),
          recipient: processors.recipient(String.fromCharCode(networkByte))(
            data.recipient as string,
          ),
        },
        txTransfer,
      ),
  },
  [SIGN_TYPE.ISSUE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) =>
      toNode(
        {
          ...data,
          quantity: data.amount || data.quantity,
          script: processScript(data.script as string | null),
        },
        txIssue,
      ),
  },
  [SIGN_TYPE.REISSUE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const quantity = data.amount || data.quantity;
      return toNode({ ...data, quantity }, txReissue);
    },
  },
  [SIGN_TYPE.BURN]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const quantity = data.amount || data.quantity;
      return burnToNode({ ...data, quantity }, txBurn);
    },
  },
  [SIGN_TYPE.UPDATE_ASSET_INFO]: {
    adapter: 'signTransaction',
    getBytes: {
      1: protoTxBytes,
    },
    toNode: (data) => toNode(data, txUpdateAssetInfo),
  },
  [SIGN_TYPE.EXCHANGE]: {
    adapter: 'signTransaction',
    getBytes: {
      0: (data) => binary.serializeTx({ ...data, version: 1 }),
      1: binary.serializeTx,
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const tx = toNode(data);
      // Version 0 is an internal identifier for legacy exchange v1 serialization
      if (tx.version === 0 || tx.version === '0') {
        tx.version = 1;
      }
      const buyOrder = data.buyOrder as IExchangeOrderData;
      const sellOrder = data.sellOrder as IExchangeOrderData;
      const order1 = {
        ...(tx.order1 as TxRecord),
        proofs: buyOrder.proofs ?? buyOrder.signature,
        signature: buyOrder.signature || buyOrder.proofs?.[0],
      };
      const order2 = {
        ...(tx.order2 as TxRecord),
        proofs: sellOrder.proofs ?? sellOrder.signature,
        signature: sellOrder.signature || sellOrder.proofs?.[0],
      };
      return txExchange({ ...tx, order1, order2 });
    },
  },
  [SIGN_TYPE.LEASE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data, networkByte: number) =>
      toNode(
        {
          ...data,
          recipient: processors.recipient(String.fromCharCode(networkByte))(
            data.recipient as string,
          ),
        },
        txLease,
      ),
  },
  [SIGN_TYPE.CANCEL_LEASING]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => toNode(data, txCancelLease),
  },
  [SIGN_TYPE.CREATE_ALIAS]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => ({ ...toNode(data, txAlias), chainId: data.chainId }),
  },
  [SIGN_TYPE.MASS_TRANSFER]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data, networkByte: number) => {
      const transfers = data.transfers as Array<{
        amount: Money;
        name?: string;
        recipient?: string;
        [k: string]: unknown;
      }>;
      return toNode(
        {
          ...data,
          assetId: data.assetId || transfers[0]?.amount.asset.id,
          attachment: processors.attachment(data.attachment as string | number[] | Uint8Array),
          transfers: transfers.map((item) => {
            const recipient = processors.recipient(String.fromCharCode(networkByte))(
              (item.name || item.recipient) as string,
            );
            return { ...item, recipient };
          }),
        },
        txMassTransfer,
      );
    },
  },
  [SIGN_TYPE.DATA]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => toNode(data, txData),
  },
  [SIGN_TYPE.SET_SCRIPT]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) =>
      toNode(
        {
          ...data,
          script: processScript(data.script as string | null),
        },
        txSetScript,
      ),
  },
  [SIGN_TYPE.SPONSORSHIP]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => toNode(data, txSponsorship),
  },
  [SIGN_TYPE.SET_ASSET_SCRIPT]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) =>
      toNode(
        {
          ...data,
          script: processScript(data.script as string | null),
        },
        txSetAssetScript,
      ),
  },
  [SIGN_TYPE.SCRIPT_INVOCATION]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data, networkByte: number) =>
      toNode(
        {
          ...data,
          dApp: processors.recipient(String.fromCharCode(networkByte))(data.dApp as string),
        },
        txInvokeScript,
      ),
  },
  [SIGN_TYPE.ETHEREUM_TX]: {
    adapter: 'signTransaction',
    getBytes: {},
  },
};
