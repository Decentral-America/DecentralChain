import { Money } from '@decentralchain/data-entities';
import { toNode as mlToNode, type TClientEntity } from '@decentralchain/money-like-to-node';
import { libs, protoSerialize, type TTransaction, validators } from '@decentralchain/transactions';
import { type ExchangeTransactionOrder } from '@decentralchain/ts-types';
import { type IAdapterSignMethods } from './interfaces';
import { prepare } from './prepare';
import { SIGN_TYPE } from './signType';

export { SIGN_TYPE };

const { processors } = prepare;

const { LEN, SHORT, STRING, LONG, BASE58_STRING } = libs.marshall.serializePrimitives;
const { binary } = libs.marshall;
const { txToProtoBytes, orderToProtoBytes } = protoSerialize;

// ── Proto serializer wrappers ────────────────────────────────────────────────
// txToProtoBytes / orderToProtoBytes accept strongly-typed transaction objects.
// These thin wrappers accept plain `object` so the dispatch table can use a
// uniform `(data: object) => Uint8Array` signature throughout. The single cast
// inside each wrapper is the only bridge to the proto API — zero `as unknown`.

const protoTxBytes = (data: object): Uint8Array => txToProtoBytes(data as TTransaction);
const protoOrderBytes = (data: object): Uint8Array =>
  orderToProtoBytes(data as ExchangeTransactionOrder);

/** Single typed bridge from the pipeline's generic record to mlToNode's TClientEntity union. */
const toClientNode = (d: IPipelineData) => mlToNode(d as object as TClientEntity);

/** Proof fields present on exchange order data at runtime. */
interface IExchangeOrderData {
  signature?: string;
  proofs?: string[];
  [key: string]: unknown;
}

/** Typed view of the mlToNode exchange result for version normalisation and order patching. */
interface IExchangeNodeTx extends Record<string, unknown> {
  version: number | string;
  order1?: IExchangeOrderData;
  order2?: IExchangeOrderData;
}

/**
 * Pipeline data record flowing through per-SIGN_TYPE toNode handlers.
 * Explicit properties allow dot-notation access despite the index signature,
 * satisfying `noPropertyAccessFromIndexSignature`. All fields are `unknown`
 * to preserve type safety at the boundary — handlers cast as needed.
 */
interface IPipelineData {
  amount?: unknown;
  assetId?: unknown;
  attachment?: unknown;
  buyOrder?: unknown;
  chainId?: unknown;
  dApp?: unknown;
  id?: unknown;
  orderId?: unknown;
  order1?: unknown;
  order2?: unknown;
  price?: unknown;
  proofs?: unknown;
  quantity?: unknown;
  recipient?: unknown;
  script?: unknown;
  sellOrder?: unknown;
  senderPublicKey?: unknown;
  timestamp?: unknown;
  transfers?: unknown;
  version?: unknown;
  [key: string]: unknown;
}

const processScript = (srcScript: string | null) => {
  const scriptText = (srcScript ?? '').replace('base64:', '');
  return scriptText ? `base64:${scriptText}` : null;
};

// ── Node-format pipeline ──────────────────────────────────────────────────────
// Each toNode() handler in SIGN_TYPES converts the generic pipeline data into a
// validated, node-compatible transaction record by following three steps:
//   1. Pre-process: resolve Money objects, attachments, recipients, etc.
//   2. Convert: call mlToNode() to normalise Money → string amounts, DCC → null.
//   3. Validate: call the appropriate transaction validator as a defence-in-depth
//      check before bytes are computed.
//
// The `as object as TClientEntity` cast in `toClientNode()` bridges IPipelineData
// to mlToNode's typed union. At runtime, each handler's data IS the correct
// TClientEntity sub-type for its SIGN_TYPE (enforced by the dispatch table key).

export const TRANSACTION_TYPE_NUMBER = {
  BURN: 6,
  CANCEL_LEASING: 9,
  CREATE_ALIAS: 10,
  DATA: 12,
  ETHEREUM_TX: 18,
  EXCHANGE: 7,
  ISSUE: 3,
  LEASE: 8,
  MASS_TRANSFER: 11,
  REISSUE: 5,
  SCRIPT_INVOCATION: 16,
  SEND_OLD: 2,
  SET_ASSET_SCRIPT: 15,
  SET_SCRIPT: 13,
  SPONSORSHIP: 14,
  TRANSFER: 4,
  UPDATE_ASSET_INFO: 17,
} as const;
export type TRANSACTION_TYPE_NUMBER =
  (typeof TRANSACTION_TYPE_NUMBER)[keyof typeof TRANSACTION_TYPE_NUMBER];

export interface ITypesMap {
  getBytes: Record<number, (data: object) => Uint8Array>;
  adapter: keyof IAdapterSignMethods;
  toNode?: (data: IPipelineData, networkByte: number) => Record<string, unknown>;
}

const getCancelOrderBytes = (txData: object) => {
  const { orderId, id, senderPublicKey, sender } = txData as Record<string, unknown>;
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
        const pBytes = LEN(SHORT)(STRING)('DccWalletAuthentication');
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
      const input = { ...data, price: Money.fromCoins(price, priceObj.asset) };
      const result = toClientNode(input);
      validators.validate.order(result);
      return result;
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
    toNode: (data, networkByte) => {
      const input = {
        ...data,
        attachment: processors.attachment(data.attachment as string | number[] | Uint8Array),
        recipient: processors.recipient(String.fromCharCode(networkByte))(data.recipient as string),
      };
      const result = toClientNode(input);
      validators.validate.transfer(result);
      return result;
    },
  },
  [SIGN_TYPE.ISSUE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const input = {
        ...data,
        quantity: data.amount || data.quantity,
        script: processScript(data.script as string | null),
      };
      const result = toClientNode(input);
      validators.validate.issue(result);
      return result;
    },
  },
  [SIGN_TYPE.REISSUE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const input = { ...data, quantity: data.amount || data.quantity };
      const result = toClientNode(input);
      validators.validate.reissue(result);
      return result;
    },
  },
  [SIGN_TYPE.BURN]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      // mlToNode's burn entity reads 'quantity' from input and maps it to 'amount' in output.
      const input = { ...data, quantity: data.amount || data.quantity };
      const result = toClientNode(input);
      validators.validate.burn(result);
      return result;
    },
  },
  [SIGN_TYPE.UPDATE_ASSET_INFO]: {
    adapter: 'signTransaction',
    getBytes: {
      1: protoTxBytes,
    },
    toNode: (data) => {
      const result = toClientNode(data);
      validators.validate.updateAssetInfo(result);
      return result;
    },
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
      const tx = toClientNode(data) as IExchangeNodeTx;
      // Version 0 is an internal identifier for legacy exchange v1 serialization
      if (tx.version === 0 || tx.version === '0') {
        tx.version = 1;
      }
      const buyOrder = data.buyOrder as IExchangeOrderData;
      const sellOrder = data.sellOrder as IExchangeOrderData;
      const order1 = {
        ...(tx.order1 ?? {}),
        proofs: buyOrder.proofs ?? buyOrder.signature,
        signature: buyOrder.signature || buyOrder.proofs?.[0],
      };
      const order2 = {
        ...(tx.order2 ?? {}),
        proofs: sellOrder.proofs ?? sellOrder.signature,
        signature: sellOrder.signature || sellOrder.proofs?.[0],
      };
      const result = { ...tx, order1, order2 };
      validators.validate.exchange(result);
      return result;
    },
  },
  [SIGN_TYPE.LEASE]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data, networkByte) => {
      const input = {
        ...data,
        recipient: processors.recipient(String.fromCharCode(networkByte))(data.recipient as string),
      };
      const result = toClientNode(input);
      validators.validate.lease(result);
      return result;
    },
  },
  [SIGN_TYPE.CANCEL_LEASING]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const result = toClientNode(data);
      validators.validate.cancelLease(result);
      return result;
    },
  },
  [SIGN_TYPE.CREATE_ALIAS]: {
    adapter: 'signTransaction',
    getBytes: {
      2: binary.serializeTx,
      3: protoTxBytes,
    },
    toNode: (data) => {
      const result = toClientNode(data);
      validators.validate.alias(result);
      return { ...result, chainId: data.chainId };
    },
  },
  [SIGN_TYPE.MASS_TRANSFER]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data, networkByte) => {
      const transfers = data.transfers as Array<{
        amount: Money;
        name?: string;
        recipient?: string;
        [k: string]: unknown;
      }>;
      const input = {
        ...data,
        assetId: data.assetId || transfers[0]?.amount.asset.id,
        attachment: processors.attachment(data.attachment as string | number[] | Uint8Array),
        transfers: transfers.map((item) => {
          const recipient = processors.recipient(String.fromCharCode(networkByte))(
            (item.name || item.recipient) as string,
          );
          return { ...item, recipient };
        }),
      };
      const result = toClientNode(input);
      validators.validate.massTransfer(result);
      return result;
    },
  },
  [SIGN_TYPE.DATA]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => {
      const result = toClientNode(data);
      validators.validate.data(result);
      return result;
    },
  },
  [SIGN_TYPE.SET_SCRIPT]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => {
      const input = {
        ...data,
        script: processScript(data.script as string | null),
      };
      const result = toClientNode(input);
      validators.validate.setScript(result);
      return result;
    },
  },
  [SIGN_TYPE.SPONSORSHIP]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => {
      const result = toClientNode(data);
      validators.validate.sponsorship(result);
      return result;
    },
  },
  [SIGN_TYPE.SET_ASSET_SCRIPT]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data) => {
      const input = {
        ...data,
        script: processScript(data.script as string | null),
      };
      const result = toClientNode(input);
      validators.validate.setAssetScript(result);
      return result;
    },
  },
  [SIGN_TYPE.SCRIPT_INVOCATION]: {
    adapter: 'signTransaction',
    getBytes: {
      0: binary.serializeTx,
      1: binary.serializeTx,
      2: protoTxBytes,
    },
    toNode: (data, networkByte) => {
      const input = {
        ...data,
        dApp: processors.recipient(String.fromCharCode(networkByte))(data.dApp as string),
      };
      const result = toClientNode(input);
      validators.validate.invokeScript(result);
      return result;
    },
  },
  [SIGN_TYPE.ETHEREUM_TX]: {
    adapter: 'signTransaction',
    getBytes: {},
  },
};
