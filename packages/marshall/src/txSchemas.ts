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
  STRING, TSerializer
} from './serializePrimitives';
import {
  byteNewAliasToString, byteToAddressOrAlias,
  byteToBase58, P_BOOLEAN, byteToData,
  byteToScript,
  byteToStringWithLength, byteToTransfers,
 P_LONG, P_OPTION, P_SHORT, TParser, P_BYTE
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

export const parseHeader = (bytes: Uint8Array): { type: number, version: number } => ({
  type: P_BYTE(bytes).value,
  version: P_BYTE(bytes, 1).value
})


const createProcessor = <T, R extends IFieldProcessor<T>>(fields: R[]) => ({
  toBytes: (tx: any) => concat(
    ...fields.map(field => field.toBytes(tx[field.name]))
  ),
  fromBytes: (bytes: Uint8Array, start = 0) => {
    const allFields = headerSchema.concat(fields)
  }
})

const txFields: Record<string, IFieldProcessor<any>> = {
  alias: {
    name: 'alias',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteNewAliasToString
  },
  amount: {
    name: 'amount',
    toBytes: LONG,
    fromBytes: P_LONG
  },
  assetDescription: {
    name: 'description',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteToStringWithLength
  },
  assetId: {
    name: 'assetId',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58
  },
  assetName: {
    name: 'name',
    toBytes: LEN(SHORT)(STRING),
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
    fromBytes: P_BYTE
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
    fromBytes: P_BYTE,
  },
  fee: {
    name: 'fee',
    toBytes: LONG,
    fromBytes: P_LONG
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
    fromBytes: P_LONG
  },
  reissuable: {
    name: 'reissuable',
    toBytes: BOOL,
    fromBytes: P_BOOLEAN
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
    fromBytes: P_LONG
  },
  transfers: {
    name: 'transfers',
    toBytes: COUNT(SHORT)((x: any) => concat(BASE58_STRING(x.recipient), LONG(x.amount))),
    fromBytes: byteToTransfers
  },
  type: {
    name: 'type',
    toBytes: BYTE,
    fromBytes: P_BYTE
  },
  version: {
    name: 'version',
    toBytes: BYTE,
    fromBytes: P_BYTE
  }
}


const headerSchema: IFieldProcessor<any>[] = [
  txFields.type,
  txFields.version
];

const proofsSchema: IFieldProcessor<any>[] = [];

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
};

interface IFieldProcessor<T> {
  name: string;
  toBytes: TSerializer<T>;
  fromBytes: TParser<T>;
}

export interface ILongFactory<LONG> {
  fromString(value: string): LONG;
  toString(value: LONG): string
}

// export const serializerFromSchema = <T, R extends IFieldProcessor<T>, LONG = string | number>(bodySchema: R[], lf?: ILongFactory<LONG>) => (tx: any) => concat(
//   ...headerSchema.map(field => field.toBytes(tx[field.name])),
//   // Compiler thinks that toBytes newer equals LONG based on types
//   ...bodySchema.map(field => field.toBytes === <any>LONG && lf ? field.toBytes(lf.toString(tx[field.name]) as any) : field.toBytes(tx[field.name])),
//   ...proofsSchema.map(field => field.toBytes(tx[field.name])),
// );

export const serializerFromSchema = <T, R extends IFieldProcessor<T>, LONG = string | number>(bodySchema: R[], lf?: ILongFactory<LONG>) => (tx: any) =>{
  const allFields = headerSchema.concat(bodySchema).concat(proofsSchema);
  let result = Uint8Array.from([])
  allFields.forEach(({name, toBytes}) => {
    const value = toBytes(tx[name]);
    result = concat(result, value)
  })
  return result
};

export const parserFromSchema = <T, R extends IFieldProcessor<T>, LONG = string>(bodySchema: R, lf?: ILongFactory<LONG>) => (bytes: Uint8Array) => {
  const allFields = headerSchema.concat(bodySchema).concat(proofsSchema);
  let cursor = 0;
  let result: any = {};

  allFields.forEach(({name, fromBytes}) => {
    const {value, shift} = fromBytes(bytes, cursor);
    cursor += shift;
    if (value !== undefined) {
      if (value instanceof Long) {
        result[name] = lf ? lf.fromString(value.toString()) : value.toString()
      } else {
        result[name] = value
      }
    }
  });

  return result
};