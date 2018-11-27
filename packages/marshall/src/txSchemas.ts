import * as Long from 'long';
import {
  BASE58_STRING,
  BASE64_STRING,
  BOOL,
  BYTE,
  BYTES, COUNT,
  LEN,
  LONG,
  OPTION, SCRIPT,
  SHORT,
  STRING
} from './serializePrimitives';
import {
  byteNewAliasToString, byteToAddressOrAlias,
  byteToBase58, byteToBoolean, byteToData,
  byteToLong,
  byteToNumber, byteToScript,
  byteToStringWithLength, byteToTransfers,
  getNumberFromBytes, P_OPTION
} from './parsePrimitives'
import {concat} from './libs/utils'

//Todo: import this enum from ts-types package
export enum TRANSACTION_TYPE {
  GENESIS = 1,
  PAYMENT = 2,
  ISSUE = 3,
  TRANSFER = 4,
  REISSUE = 5,
  BURN = 6,
  EXCHANGE = 7,
  LEASE = 8,
  CANCEL_LEASE = 9,
  ALIAS = 10,
  MASS_TRANSFER = 11,
  DATA = 12,
  SET_SCRIPT = 13,
  SPONSORSHIP = 14,
  SET_ASSET_SCRIPT = 15,
}

const typeMap: any = {
  integer: ['integer', 0, LONG],
  number: ['integer', 0, LONG],
  boolean: ['boolean', 1, BYTE],
  string: ['string', 3, LEN(SHORT)(STRING)],
  binary: ['binary', 2, (s: string) => LEN(SHORT)(BASE64_STRING)(s.slice(7))], // Slice base64: part
  _: ['binary', 2, LEN(SHORT)(BYTES)],
}

const parseHeader = (bytes: Uint8Array): { type: number, version: number } => ({
  type: getNumberFromBytes(bytes, 1),
  version: getNumberFromBytes(bytes, 1, 1)
})

const txFields = {
  alias: {
    name: 'alias',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteNewAliasToString
  },
  amount: {
    name: 'amount',
    toBytes: LONG,
    fromBytes: byteToLong(8)
  },
  assetDescription: {
    name: 'description',
    tyBytes: LEN(SHORT)(STRING),
    fromBytes: byteToStringWithLength
  },
  assetId: {
    name: 'assetId',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58
  },
  assetName: {
    name: 'name',
    tyBytes: LEN(SHORT)(STRING),
    fromBytes: byteToStringWithLength
  },
  attachment: {
    name: 'attachment',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteToStringWithLength
  },
  chainId: {
    name: 'chainId',
    toBytes: BYTE,
    fromBytes: byteToNumber(1)
  },
  data: {
    name: 'data',
    //Todo: Rewrite,using only node data types
    toBytes: COUNT(SHORT)((x: any) => concat(LEN(SHORT)(STRING)(x.key), [typeMap[x.type][1]], typeMap[x.type][2](x.value))),
    fromBytes: byteToData
  },
  decimals: {
    name: 'decimals',
    toBytes: BYTE,
    fromBytes: byteToNumber(1),
  },
  fee: {
    name: 'fee',
    toBytes: LONG,
    fromBytes: byteToLong(8)
  },
  leaseAssetId: {
    name: 'leaseAssetId',
    toBytes: OPTION(BASE58_STRING),
    fromBytes: P_OPTION(byteToBase58)
  },
  leaseId: {
    name: 'leaseId',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58
  },
  optionalAssetId: {
    name: 'assetId',
    toBytes: OPTION(BASE58_STRING),
    fromBytes: P_OPTION(byteToBase58)
  },
  quantity: {
    name: 'quantity',
    toBytes: LONG,
    fromBytes: byteToLong(8)
  },
  reissuable: {
    name: 'reissuable',
    toBytes: BOOL,
    fromBytes: byteToBoolean
  },
  recipient: {
    name: 'recipient',
    toBytes: BASE58_STRING,
    fromBytes: byteToAddressOrAlias
  },
  script: {
    name: 'script',
    toBytes: SCRIPT,
    fromBytes: byteToScript
  },
  senderPublicKey: {
    name: 'senderPublicKey',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58,
  },
  timestamp: {
    name: 'timestamp',
    toBytes: LONG,
    fromBytes: byteToNumber(8)
  },
  transfers: {
    name: 'transfers',
    toBytes: COUNT(SHORT)((x: any) => concat(BASE58_STRING(x.recipient), LONG(x.amount))),
    fromBytes: byteToTransfers
  },
  type: {
    name: 'type',
    toBytes: BYTE,
    fromBytes: byteToNumber
  },
  version: {
    name: 'version',
    toBytes: BYTE,
    fromBytes: byteToNumber
  }
}

const header = [
  txFields.type,
  txFields.version
];

const proofs = [];

const aliasSchemaV2 = [
  txFields.senderPublicKey,
  txFields.alias,
  txFields.timestamp,
  txFields.fee
];

const burnSchemaV2 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.assetId,
  txFields.quantity,
  txFields.fee,
  txFields.timestamp
];

const cancelLeaseSchemaV2 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.fee,
  txFields.timestamp,
  txFields.leaseId
];

const dataSchemaV1 = [
  txFields.senderPublicKey,
  txFields.data,
  txFields.timestamp,
  txFields.fee
];

const issueSchemaV2 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.assetName,
  txFields.assetDescription,
  txFields.quantity,
  txFields.decimals,
  txFields.reissuable,
  txFields.fee,
  txFields.timestamp,
  txFields.script
];

const leaseSchemaV2 = [
  txFields.leaseAssetId,
  txFields.senderPublicKey,
  txFields.recipient,
  txFields.amount,
  txFields.fee,
  txFields.timestamp
];

const massTransferSchemaV1 = [
  txFields.senderPublicKey,
  txFields.optionalAssetId,
  txFields.transfers,
  txFields.timestamp,
  txFields.fee,
  txFields.attachment
];

const reissueSchemaV2 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.assetId,
  txFields.quantity,
  txFields.reissuable,
  txFields.fee,
  txFields.timestamp,
];

const setAssetScriptSchemaV1 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.assetId,
  txFields.fee,
  txFields.timestamp,
  txFields.script
];

const setScriptSchemaV1 = [
  txFields.chainId,
  txFields.senderPublicKey,
  txFields.script,
  txFields.fee,
  txFields.timestamp
];

const transferSchemaV2 = [
  txFields.senderPublicKey,
  txFields.optionalAssetId,
  {...txFields.optionalAssetId, name: 'feeAssetId'},
  txFields.timestamp,
  txFields.amount,
  txFields.fee,
  txFields.recipient,
  txFields.attachment
];

const OrderSchema = []

/**
 * Maps transaction types to schemas object. Schemas are written by keys. 0 - no version, n - version n
 */
export const schemasByTypeMap = {
  [TRANSACTION_TYPE.GENESIS]: {},
  [TRANSACTION_TYPE.PAYMENT]: {},
  [TRANSACTION_TYPE.ISSUE]: {
    2: issueSchemaV2
  },
  [TRANSACTION_TYPE.TRANSFER]: {
    2: transferSchemaV2
  },
  [TRANSACTION_TYPE.REISSUE]: {
    2: reissueSchemaV2
  },
  [TRANSACTION_TYPE.BURN]: {
    2: burnSchemaV2
  },
  [TRANSACTION_TYPE.EXCHANGE]: {},
  [TRANSACTION_TYPE.LEASE]: {
    2: leaseSchemaV2
  },
  [TRANSACTION_TYPE.CANCEL_LEASE]: {
    2: cancelLeaseSchemaV2
  },
  [TRANSACTION_TYPE.ALIAS]: {
    2: aliasSchemaV2
  },
  [TRANSACTION_TYPE.MASS_TRANSFER]: {
    1: massTransferSchemaV1
  },
  [TRANSACTION_TYPE.DATA]: {
    1: dataSchemaV1
  },
  [TRANSACTION_TYPE.SET_SCRIPT]: {
    1: setScriptSchemaV1
  },
  [TRANSACTION_TYPE.SPONSORSHIP]: {},
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
    1: setAssetScriptSchemaV1
  }
}

