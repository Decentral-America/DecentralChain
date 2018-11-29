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
import {concat, range} from './libs/utils'

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

export enum DATA_FIELD_TYPE {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
  BINARY = 'binary'
}

type TSchema = TObject | TArray | TAnyOf | TDataTxField | TPrimitive;

type TObject = {
  name: string;
  type: 'object';
  schema: TSchema[];
}
export type TArray = {
  name: string;
  type: 'array';
  items: TSchema
}

type TAnyOf = {
  name: string;
  type: 'anyOf';
  discriminant: string;
  items: Map<string, TObject | TAnyOf>;
}

type TPrimitive = {
  name: string;
  type?: 'primitive';
  toBytes: (...args: any) => any;
  fromBytes: (...args: any) => any;
}

//Data tx field serializes differently. It has type AFTER key field!!!
export type TDataTxField = {
  name: string;
  type: 'dataTxField';
  items: Map<DATA_FIELD_TYPE, TSchema>;
}


export const parseHeader = (bytes: Uint8Array): { type: number, version: number } => ({
  type: P_BYTE(bytes).value,
  version: P_BYTE(bytes, 1).value
})


export namespace txFields {

  //Field constructors
  export const longField = (name: string) => ({
    name,
    toBytes: LONG,
    fromBytes: P_LONG
  });

  export const byteField = (name: string) => ({
    name,
    toBytes: BYTE,
    fromBytes: P_BYTE
  });

  export const booleanField = (name: string) => ({
    name,
    toBytes: BOOL,
    fromBytes: P_BOOLEAN
  });

  export const stringField = (name: string) => ({
    name,
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteToStringWithLength
  });

  // Primitive fields
  export const alias = {
    name: 'alias',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteNewAliasToString
  };
  export const amount = longField('amount');

  export const assetDescription = stringField('description');

  export const assetId = {
    name: 'assetId',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58
  };
  export const assetName = stringField('name');

  export const attachment = stringField('attachment');

  export const chainId = byteField('chainId');

  export const decimals = byteField('decimals');

  export const fee = longField('fee');

  export const leaseAssetId = {
    name: 'leaseAssetId',
    toBytes: OPTION(BASE58_STRING),
    fromBytes: P_OPTION(byteToBase58)
  };
  export const leaseId = {
    name: 'leaseId',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58
  };
  export const optionalAssetId = {
    name: 'assetId',
    toBytes: OPTION(BASE58_STRING),
    fromBytes: P_OPTION(byteToBase58)
  };
  export const quantity = longField('quantity');

  export const reissuable = booleanField('reissuable');

  export const recipient = {
    name: 'recipient',
    toBytes: BASE58_STRING,
    fromBytes: byteToAddressOrAlias
  };
  export const script = {
    name: 'script',
    toBytes: SCRIPT,
    fromBytes: byteToScript
  };
  export const senderPublicKey = {
    name: 'senderPublicKey',
    toBytes: BASE58_STRING,
    fromBytes: byteToBase58,
  };

  export const timestamp = longField('timestamp');

  export const type = byteField('type');

  export const version = byteField('version');

  // Complex fields
  export const transfer = {
    name: 'transfer',
    type: 'object',
    schema: [
      recipient,
      amount
    ]
  };

  export const transfers = {
    name: 'transfers',
    type: 'array',
    items: transfer
  };

  export const dataTxField: TDataTxField = {
    name: 'dataTxField',
    type: 'dataTxField',
    items: new Map<DATA_FIELD_TYPE, TSchema>([
      [DATA_FIELD_TYPE.INTEGER, longField('value')],
      [DATA_FIELD_TYPE.BOOLEAN, booleanField('value')],
      [DATA_FIELD_TYPE.STRING, stringField('value')],
      [DATA_FIELD_TYPE.BINARY, stringField('value')]
    ])
  };

  export const data: TArray = {
    name: 'data',
    type: 'array',
    items: dataTxField
  };
}
// const txFields = {
//
// }

const proofsSchema: IFieldProcessor<any>[] = [];

const aliasSchemaV2 = {
  name: 'aliasSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.alias,
    txFields.timestamp,
    txFields.fee
  ]
};

const burnSchemaV2 = {
  name: 'burnSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.quantity,
    txFields.fee,
    txFields.timestamp
  ]
};

const cancelLeaseSchemaV2 = {
  name: 'cancelLeaseSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.fee,
    txFields.timestamp,
    txFields.leaseId
  ]
};

const dataSchemaV1 = {
  name: 'dataSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.data,
    txFields.timestamp,
    txFields.fee
  ]
};

const issueSchemaV2 = {
  name: 'issueSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
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
  ]
};

const leaseSchemaV2 = {
  name: 'issueSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.leaseAssetId,
    txFields.senderPublicKey,
    txFields.recipient,
    txFields.amount,
    txFields.fee,
    txFields.timestamp
  ]
};

const massTransferSchemaV1 = {
  name: 'massTransferSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.optionalAssetId,
    txFields.transfers,
    txFields.timestamp,
    txFields.fee,
    txFields.attachment
  ]
};

const reissueSchemaV2 = {
  name: 'reissueSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.quantity,
    txFields.reissuable,
    txFields.fee,
    txFields.timestamp,
  ]
};

const setAssetScriptSchemaV1 = {
  name: 'setAssetScriptSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.fee,
    txFields.timestamp,
    txFields.script
  ]
};

const setScriptSchemaV1 = {
  name: 'setScriptSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.script,
    txFields.fee,
    txFields.timestamp
  ]
};

const transferSchemaV2 = {
  name: 'transferSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.optionalAssetId,
    {...txFields.optionalAssetId, name: 'feeAssetId'},
    txFields.timestamp,
    txFields.amount,
    txFields.fee,
    txFields.recipient,
    txFields.attachment
  ]
};

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
  array?: boolean
  schema?: IFieldProcessor<any>[]
  toBytes?: TSerializer<T>;
  fromBytes?: TParser<T>;
}


export interface ILongFactory<LONG> {
  fromString(value: string): LONG;

  toString(value: LONG): string
}


export const serializerFromSchema = <LONG = string | number>(schema: TSchema, lf?: ILongFactory<LONG>): TSerializer<any> => (obj: any) => {
  let result = Uint8Array.from([]);

  let serializer: TSerializer<any>,
    itemBytes: Uint8Array;

  if (schema.type === 'array') {
    serializer = serializerFromSchema(schema.items, lf);
    itemBytes = concat(...obj.map((item: any) => serializer((item))));
    result = concat(result, SHORT(obj.length), itemBytes);
  }
  else if (schema.type === 'object') {
    schema.schema.forEach(field => {
      serializer = serializerFromSchema(field, lf);
      itemBytes = serializer(obj[field.name]);
      result = concat(result, itemBytes);
    });
  }
  else if (schema.type === 'anyOf') {
    const type = obj[schema.discriminant];
    const typeSchema = schema.items.get(type);
    if (typeSchema == null) {
      throw new Error(`Serializer Error: Unknown anyOf type: ${schema.discriminant}.${type}`)
    }
    const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
    serializer = serializerFromSchema(typeSchema, lf);
    itemBytes = serializer(obj);
    result = concat(result, BYTE(typeCode), itemBytes);
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    result = concat(result, schema.toBytes(obj));
  }
  else if (schema.type === 'dataTxField') {
    const keyBytes = txFields.stringField('').toBytes(obj.key);
    const type = obj.type;
    const typeSchema = schema.items.get(type);
    if (typeSchema == null) {
      throw new Error(`Serializer Error: Unknown dataTxField type: ${type}`)
    }
    const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
    serializer = serializerFromSchema(typeSchema, lf);
    itemBytes = serializer(obj.value);
    result = concat(result, keyBytes, BYTE(typeCode), itemBytes)
  } else {
    throw new Error(`Serializer Error: Unknown schema type: ${schema!.type}`)
  }

  return result
};

//export const concatParsers = (parsers:TParser<any>[]) => (bytes: Uint8Array)

export const parserFromSchema = <LONG = string>(schema: TSchema, lf?: ILongFactory<LONG>): TParser<any> => (bytes: Uint8Array, start = 0) => {
  let cursor: number = start;

  if (schema.type === 'array') {
    const result: any[] = [];
    const {value: len, shift} = P_SHORT(bytes, start);
    cursor += shift;

    range(0, len).forEach(_ => {
      const parser = parserFromSchema(schema.items, lf);
      const {value, shift} = parser(bytes, cursor);
      result.push(value);
      cursor += shift;
    });

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'object') {
    const result: any = {};
    schema.schema.forEach(field => {
      const parser = parserFromSchema(field, lf);
      const {value, shift} = parser(bytes, cursor);
      cursor += shift;
      if (value !== undefined) {
        result[field.name] = value
      }
    });

    return {value: result, shift: cursor - start}
  }
  else if (schema.type === 'anyOf') {
    let {value: anyOfIndex, shift} = P_BYTE(bytes, cursor);
    cursor += shift;
    const item = Array.from(schema.items.values())[anyOfIndex];
    const parser = parserFromSchema(item, lf);
    const result = parser(bytes, cursor);
    //cursor += result.shift;
    return result
  }
  else if (schema.type === 'dataTxField') {
    const key = byteToStringWithLength(bytes, cursor);
    cursor += key.shift
    let dataType = P_BYTE(bytes, cursor);
    cursor += dataType.shift;
    const itemRecord = [...schema.items].find((_,i) => i === dataType.value);
    if (!itemRecord){
      throw new Error(`Parser Error: Unknown dataTxField type: ${dataType.value}`)
    }
    const parser = parserFromSchema(itemRecord![1], lf);
    const result = parser(bytes, cursor);
    //cursor += result.shift;
    return {
      value: {
        value:result.value,
        key: key.value,
        type: itemRecord[0]
      },
      shift: result.shift + key.shift + dataType.shift}
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    const parser = schema.fromBytes;
    let {value, shift} = parser(bytes, start);

    //Capture LONG Parser and convert strings desired instance if longFactory is present
    if (parser === P_LONG && lf) {
      value = lf.fromString(value)
    }
    return {value, shift: shift}
  } else {
    throw new Error(`Parser Error: Unknown schema type: ${schema!.type}`)
  }
};


