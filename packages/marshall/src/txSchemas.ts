import {
  BASE58_STRING, BASE64_STRING,
  BOOL,
  BYTE, INT,
  LEN,
  LONG,
  OPTION, SCRIPT,
  SHORT,
  STRING
} from './serializePrimitives';
import {
  byteNewAliasToString, byteToAddressOrAlias, P_BOOLEAN,
  byteToScript,
  P_LONG, P_OPTION, P_BYTE, P_BASE58_FIXED, P_BASE58_VAR, P_SHORT, P_STRING_VAR, P_BASE64, P_INT
} from './parsePrimitives'

//Todo: import this enums from ts-types package
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
  CONTRACT_INVOCATION = 16
}

export enum DATA_FIELD_TYPE {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
  BINARY = 'binary'
}

export type TSchema = TObject | TArray | TAnyOf | TDataTxField | TPrimitive;

export type TObject = {
  name: string;
  type: 'object';
  //For some reason object sometimes are needed to be serialized with length. Like WTF?
  withLength?: boolean;
  schema: TSchema[];
}
export type TArray = {
  name: string;
  type: 'array';
  items: TSchema;
}

export type TAnyOf = {
  name: string;
  type: 'anyOf';
  discriminant: string;
  items: Map<string, TSchema>;
}

export type TPrimitive = {
  name: string;
  type?: 'primitive';
  toBytes: (...args: any) => any;
  fromBytes: (bytes: Uint8Array, start?: number) => any;
}

//Data tx field serializes differently. It has type AFTER key field!!!
export type TDataTxField = {
  name: string;
  type: 'dataTxField';
  items: Map<DATA_FIELD_TYPE, TSchema>;
}


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
    fromBytes: P_STRING_VAR(P_SHORT)
  });

  export const base58field32 = (name: string) => ({
    name,
    toBytes: BASE58_STRING,
    fromBytes: P_BASE58_FIXED(32)
  });

  export const base58Option32 = (name: string) => ({
    name,
    toBytes: OPTION(BASE58_STRING),
    fromBytes: P_OPTION(P_BASE58_FIXED(32))
  });

  export const base64field = (name: string) => ({
    name,
    toBytes: LEN(SHORT)(BASE64_STRING),
    fromBytes: P_BASE64(P_SHORT)
  })

  // Primitive fields
  export const alias = {
    name: 'alias',
    toBytes: LEN(SHORT)(STRING),
    fromBytes: byteNewAliasToString
  };
  export const amount = longField('amount');

  export const assetDescription = stringField('description');

  export const assetId = base58field32('assetId');
  export const assetName = stringField('name');

  export const attachment = {
    name: 'attachment',
    toBytes: LEN(SHORT)(BASE58_STRING),
    fromBytes: P_BASE58_VAR(P_SHORT)
  }

  export const chainId = byteField('chainId');

  export const decimals = byteField('decimals');

  export const fee = longField('fee');

  export const leaseAssetId = base58Option32('leaseAssetId');

  export const leaseId = base58field32('leaseId');

  export const optionalAssetId = base58Option32('assetId');

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
  export const senderPublicKey = base58field32('senderPublicKey');

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
      [DATA_FIELD_TYPE.BINARY, base64field('value')]
    ])
  };

  export const functionArgField: TAnyOf = {
    name: 'functionArgField',
    type: 'anyOf',
    discriminant: 'type',
    items: new Map<string, TSchema>([
      ['long', longField('value')],
      ['bytes', {name: '', toBytes: LEN(INT)(BASE64_STRING), fromBytes: P_BASE64(P_INT)}],
      ['string', {name: '', toBytes: LEN(INT)(STRING), fromBytes: P_STRING_VAR(P_INT)}],
      [(Symbol('placeholder')) as any, {} as any],
      [(Symbol('placeholder')) as any, {} as any],
      [(Symbol('placeholder')) as any, {} as any],
      ['true', {name:'true', toBytes: ()=>Uint8Array.from([]), fromBytes: ()=>({value:true, shift:0})}],
      ['false', {name:'false', toBytes: ()=>Uint8Array.from([]), fromBytes: ()=>({value:true, shift:0})}],
    ])
  };

  export const data: TArray = {
    name: 'data',
    type: 'array',
    items: dataTxField
  };

  export const functionCall: TObject = {
    name: 'function',
    type: 'object',
    schema: [
      {
        name: 'name',
        toBytes: LEN(SHORT)(STRING),
        fromBytes: P_STRING_VAR(P_SHORT)
      },
      functionArgField
    ]
  }
}

export const orderSchemaV0: TObject = {
  name: 'orderSchemaV0',
  type: 'object',
  schema: [
    txFields.senderPublicKey,
    {...txFields.senderPublicKey, name: 'matcherPublicKey'},
    {
      name: 'assetPair',
      type: 'object',
      schema: [
        txFields.base58Option32('amountAsset'),
        txFields.base58Option32('priceAsset')
      ]
    },
    {
      name: 'orderType',
      toBytes: (type: string) => BYTE(type === 'sell' ? 1 : 0),
      fromBytes: (bytes: Uint8Array, start = 0) => P_BYTE(bytes, start).value === 1 ?
        {value: 'sell', shift: 1} :
        {value: 'buy', shift: 1}
    },
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.timestamp,
    txFields.longField('expiration'),
    txFields.longField('matcherFee')
  ]
};

const aliasSchemaV2 = {
  name: 'aliasSchemaV2',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.alias,
    txFields.fee,
    txFields.timestamp
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

const contractInvocationSchemaV1 = {
  name: 'contractInvocationSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    {
      name: 'contractAddress',
      toBytes: BASE58_STRING,
      fromBytes: P_BASE58_FIXED(26),
    },
    txFields.functionCall,
    txFields.fee,
    txFields.timestamp,
  ]
}


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

const exchangeSchemaV0 = {
  name: 'exchangeSchemaV0',
  type: 'object',
  schema: [
    txFields.type,
    {...orderSchemaV0, name: 'order1', withLength: true},
    {...orderSchemaV0, name: 'order2', withLength: true},
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.longField('buyMatcherFee'),
    txFields.longField('sellMatcherFee'),
    txFields.longField('fee'),
    txFields.longField('timestamp'),
  ]
}

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

const sponsorshipSchemaV1 = {
  name: 'sponsorshipSchemaV1',
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.assetId,
    txFields.longField('minSponsoredAssetFee'),
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
  [TRANSACTION_TYPE.EXCHANGE]: {
    0: exchangeSchemaV0
  },
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
  [TRANSACTION_TYPE.SPONSORSHIP]: {
    1: sponsorshipSchemaV1
  },
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
    1: setAssetScriptSchemaV1
  },
  [TRANSACTION_TYPE.CONTRACT_INVOCATION]: {
    1: contractInvocationSchemaV1
  }
};


export interface ILongFactory<LONG> {
  fromString(value: string): LONG;

  toString?: (value: LONG) => string
}




