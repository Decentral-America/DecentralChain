import {
  ADDRESS_OR_ALIAS,
  BASE58_STRING,
  BASE64_STRING,
  BOOL,
  BYTE,
  INT,
  LEN,
  LONG,
  OPTION,
  SCRIPT,
  SHORT,
  STRING,
} from './serializePrimitives';
import {
  byteNewAliasToString,
  byteToAddressOrAlias,
  P_BOOLEAN,
  byteToScript,
  P_LONG,
  P_OPTION,
  P_BYTE,
  P_BASE58_FIXED,
  P_BASE58_VAR,
  P_SHORT,
  P_STRING_VAR,
  P_BASE64,
  P_INT,
} from './parsePrimitives';
import {
  TObject,
  TSchema,
  DATA_FIELD_TYPE,
  TDataTxItem,
  TObjectField,
  anyOf,
  TPrimitive,
} from './schemaTypes';
import { serializerFromSchema } from './serialize';

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
  INVOKE_SCRIPT = 16,
}

const shortConverter = {
  toBytes: SHORT,
  fromBytes: P_SHORT,
};

const intConverter = {
  toBytes: INT,
  fromBytes: P_INT,
};
export namespace txFields {
  //Field constructors
  export const longField = (name: string): TObjectField => [
    name,
    { toBytes: LONG, fromBytes: P_LONG },
  ];

  export const byteField = (name: string): TObjectField => [
    name,
    { toBytes: BYTE, fromBytes: P_BYTE },
  ];

  export const booleanField = (name: string): TObjectField => [
    name,
    { toBytes: BOOL, fromBytes: P_BOOLEAN },
  ];

  export const stringField = (name: string): TObjectField => [
    name,
    {
      toBytes: LEN(SHORT)(STRING),
      fromBytes: P_STRING_VAR(P_SHORT),
    },
  ];

  export const base58field32 = (name: string): TObjectField => [
    name,
    {
      toBytes: BASE58_STRING,
      fromBytes: P_BASE58_FIXED(32),
    },
  ];

  // String 'DCC' often used instead of null. That's why we should serialize it as null
  export const base58Option32 = (name: string): TObjectField => [
    name,
    {
      toBytes: (s: string) =>
        s === 'DCC' ? OPTION(BASE58_STRING)(null) : OPTION(BASE58_STRING)(s),
      fromBytes: P_OPTION(P_BASE58_FIXED(32)),
    },
  ];

  export const base64field = (name: string): TObjectField => [
    name,
    {
      toBytes: LEN(SHORT)(BASE64_STRING),
      fromBytes: P_BASE64(P_SHORT),
    },
  ];

  export const byteConstant = (byte: number): TObjectField => [
    'noname',
    {
      toBytes: () => Uint8Array.from([byte]),
      fromBytes: () => ({ value: undefined, shift: 1 }),
    },
  ];

  // Primitive fields
  export const alias: TObjectField = [
    'alias',
    {
      toBytes: LEN(SHORT)(STRING),
      fromBytes: byteNewAliasToString,
    },
  ];

  export const amount = longField('amount');

  export const assetDescription = stringField('description');

  export const assetId = base58field32('assetId');
  export const assetName = stringField('name');

  export const attachment: TObjectField = [
    'attachment',
    {
      toBytes: LEN(SHORT)(BASE58_STRING),
      fromBytes: P_BASE58_VAR(P_SHORT),
    },
  ];

  export const chainId = byteField('chainId');

  export const decimals = byteField('decimals');

  export const fee = longField('fee');

  export const leaseAssetId = base58Option32('leaseAssetId');

  export const leaseId = base58field32('leaseId');

  export const optionalAssetId = base58Option32('assetId');

  export const quantity = longField('quantity');

  export const reissuable = booleanField('reissuable');

  export const recipient: TObjectField = [
    'recipient',
    {
      toBytes: ADDRESS_OR_ALIAS,
      fromBytes: byteToAddressOrAlias,
    },
  ];

  export const script: TObjectField = [
    'script',
    {
      toBytes: SCRIPT,
      fromBytes: byteToScript,
    },
  ];

  export const senderPublicKey = base58field32('senderPublicKey');

  export const signature: TObjectField = [
    'signature',
    {
      toBytes: BASE58_STRING,
      fromBytes: P_BASE58_FIXED(64),
    },
  ];

  export const timestamp = longField('timestamp');

  export const type = byteField('type');

  export const version = byteField('version');

  // Complex fields

  export const proofs: TObjectField = [
    'proofs',
    {
      type: 'array',
      items: {
        toBytes: LEN(SHORT)(BASE58_STRING),
        fromBytes: P_BASE58_VAR(P_SHORT),
      },
    },
  ];

  const transfer: TObject = {
    type: 'object',
    schema: [recipient, amount],
  };

  export const transfers: TObjectField = [
    'transfers',
    {
      type: 'array',
      items: transfer,
    },
  ];

  const dataTxItem: TDataTxItem = {
    type: 'dataTxField',
    items: new Map<DATA_FIELD_TYPE, TSchema>([
      [DATA_FIELD_TYPE.INTEGER, { toBytes: LONG, fromBytes: P_LONG }],
      [DATA_FIELD_TYPE.BOOLEAN, { toBytes: BOOL, fromBytes: P_BOOLEAN }],
      [
        DATA_FIELD_TYPE.BINARY,
        { toBytes: LEN(SHORT)(BASE64_STRING), fromBytes: P_BASE64(P_SHORT) },
      ],
      [DATA_FIELD_TYPE.STRING, { toBytes: LEN(SHORT)(STRING), fromBytes: P_STRING_VAR(P_SHORT) }],
    ]),
  };

  export const data: TObjectField = [
    'data',
    {
      type: 'array',
      items: dataTxItem,
    },
  ];

  const functionArgumentPrimitives: [number, TSchema, string?][] = [
    [0, { toBytes: LONG, fromBytes: P_LONG }, 'integer'],
    [1, { toBytes: LEN(INT)(BASE64_STRING), fromBytes: P_BASE64(P_INT) }, 'binary'],
    [2, { toBytes: LEN(INT)(STRING), fromBytes: P_STRING_VAR(P_INT) }, 'string'],
    [
      6,
      { toBytes: () => new Uint8Array(0), fromBytes: () => ({ value: true, shift: 0 }) },
      'boolean',
    ],
    [
      7,
      { toBytes: () => new Uint8Array(0), fromBytes: () => ({ value: false, shift: 0 }) },
      'boolean',
    ],
  ];

  const functionArgument = anyOf(
    [
      ...functionArgumentPrimitives,
      [
        11,
        {
          type: 'array',
          toBytes: INT,
          fromBytes: P_INT,
          items: anyOf(functionArgumentPrimitives, { valueField: 'value' }),
        },
        'list',
      ],
    ],
    { valueField: 'value' },
  );

  export const functionCall: TObjectField = [
    'call',
    {
      type: 'object',
      optional: true,
      schema: [
        // special bytes to indicate function call. Used in Serde serializer
        byteConstant(9),
        byteConstant(1),
        [
          'function',
          {
            toBytes: LEN(INT)(STRING),
            fromBytes: P_STRING_VAR(P_INT),
          },
        ],
        [
          'args',
          {
            type: 'array',
            toBytes: INT,
            fromBytes: P_INT,
            items: functionArgument,
          },
        ],
      ],
    },
  ];

  export const payment: TObject = {
    type: 'object',
    withLength: shortConverter,
    schema: [amount, optionalAssetId],
  };

  export const payments: TObjectField = [
    'payment',
    {
      type: 'array',
      items: payment,
    },
  ];
}

export const orderSchemaV1: TObject = {
  type: 'object',
  schema: [
    txFields.senderPublicKey,
    txFields.base58field32('matcherPublicKey'),
    [
      'assetPair',
      {
        type: 'object',
        schema: [txFields.base58Option32('amountAsset'), txFields.base58Option32('priceAsset')],
      },
    ],
    [
      'orderType',
      {
        toBytes: (type: string) => BYTE(type === 'sell' ? 1 : 0),
        fromBytes: (bytes: Uint8Array, start = 0) =>
          P_BYTE(bytes, start).value === 1
            ? { value: 'sell', shift: 1 }
            : { value: 'buy', shift: 1 },
      },
    ],
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.timestamp,
    txFields.longField('expiration'),
    txFields.longField('matcherFee'),
  ],
};

export const orderSchemaV2: TSchema = {
  type: 'object',
  schema: [txFields.version, ...orderSchemaV1.schema],
};

// In order v3 amount and price fields are flipped
export const orderSchemaV3: TSchema = {
  type: 'object',
  schema: [...orderSchemaV2.schema, ['matcherFeeAssetId', txFields.optionalAssetId[1]]],
};

export const aliasSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    [
      ['alias', 'chainId'],
      {
        type: 'object',
        withLength: shortConverter,
        schema: [
          txFields.byteConstant(2), // Alias version
          txFields.chainId, //
          txFields.alias, // Alias text
        ],
      },
    ],
    txFields.fee,
    txFields.timestamp,
  ],
};

export const burnSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.amount,
    txFields.fee,
    txFields.timestamp,
  ],
};

export const cancelLeaseSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.fee,
    txFields.timestamp,
    txFields.leaseId,
  ],
};

export const invokeScriptSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    ['dApp', txFields.recipient[1]],
    txFields.functionCall,
    txFields.payments,
    txFields.fee,
    ['feeAssetId', txFields.optionalAssetId[1]],
    txFields.timestamp,
  ],
};

export const dataSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.data,
    txFields.timestamp,
    txFields.fee,
  ],
};

export const proofsSchemaV0: TSchema = {
  type: 'object',
  schema: [
    [
      'signature',
      {
        toBytes: BASE58_STRING,
        fromBytes: P_BASE58_FIXED(64),
      },
    ],
  ],
};

export const proofsSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.byteConstant(1), // proofs version
    txFields.proofs,
  ],
};

const orderSchemaV0WithSignature: TObject = {
  type: 'object',
  schema: [...orderSchemaV1.schema, txFields.signature],
};
//ExchangeV0 needs both orders length to be present before actual order bytes.
// That's why there are two separate rules for oder1 and order2 fields. First one serializes order and writes length.
// Seconds serializes and writes whole order. When deserialize, second rule overwrites order fields in js object
export const exchangeSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    [
      'order1',
      {
        fromBytes: () => ({ value: undefined, shift: 4 }),
        toBytes: (order: any) =>
          INT(serializerFromSchema(orderSchemaV0WithSignature)(order).length),
      },
    ],
    [
      'order2',
      {
        fromBytes: () => ({ value: undefined, shift: 4 }),
        toBytes: (order: any) =>
          INT(serializerFromSchema(orderSchemaV0WithSignature)(order).length),
      },
    ],
    ['order1', orderSchemaV0WithSignature],
    ['order2', orderSchemaV0WithSignature],
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.longField('buyMatcherFee'),
    txFields.longField('sellMatcherFee'),
    txFields.longField('fee'),
    txFields.longField('timestamp'),
  ],
};

const anyOrder = anyOf(
  [
    [
      1,
      {
        type: 'object',
        //order v1 length is serialized without orderVersion
        withLength: {
          toBytes: (x) => INT(x - 1),
          fromBytes: (x) => {
            const { value, shift } = P_INT(x);
            return { value: value + 1, shift };
          },
        } as TPrimitive,
        schema: [txFields.byteConstant(1), ...orderSchemaV1.schema, ...proofsSchemaV0.schema],
      },
    ],
    [
      2,
      {
        type: 'object',
        withLength: intConverter,
        schema: [...orderSchemaV2.schema, ...proofsSchemaV1.schema],
      },
    ],
  ],
  { discriminatorField: 'version', discriminatorBytePos: 4 },
);

export const exchangeSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.byteConstant(0),
    txFields.type,
    txFields.version,
    ['order1', anyOrder],
    ['order2', anyOrder],
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.longField('buyMatcherFee'),
    txFields.longField('sellMatcherFee'),
    txFields.longField('fee'),
    txFields.longField('timestamp'),
  ],
};

export const issueSchemaV2: TSchema = {
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
    txFields.script,
  ],
};

export const leaseSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.leaseAssetId,
    txFields.senderPublicKey,
    txFields.recipient,
    txFields.amount,
    txFields.fee,
    txFields.timestamp,
  ],
};

export const massTransferSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.optionalAssetId,
    txFields.transfers,
    txFields.timestamp,
    txFields.fee,
    txFields.attachment,
  ],
};

export const reissueSchemaV2: TSchema = {
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
  ],
};

export const setAssetScriptSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.fee,
    txFields.timestamp,
    txFields.script,
  ],
};

export const setScriptSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.script,
    txFields.fee,
    txFields.timestamp,
  ],
};

export const sponsorshipSchemaV1: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.longField('minSponsoredAssetFee'),
    txFields.fee,
    txFields.timestamp,
  ],
};

export const transferSchemaV2: TSchema = {
  type: 'object',
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.optionalAssetId,
    ['feeAssetId', txFields.optionalAssetId[1]],
    txFields.timestamp,
    txFields.amount,
    txFields.fee,
    txFields.recipient,
    txFields.attachment,
  ],
};

/**
 * Maps transaction types to schemas object. Schemas are written by keys. 1 equals no version or version 1
 */
export const schemasByTypeMap = {
  [TRANSACTION_TYPE.GENESIS]: {},
  [TRANSACTION_TYPE.PAYMENT]: {},
  [TRANSACTION_TYPE.ISSUE]: {
    2: issueSchemaV2,
  },
  [TRANSACTION_TYPE.TRANSFER]: {
    2: transferSchemaV2,
  },
  [TRANSACTION_TYPE.REISSUE]: {
    2: reissueSchemaV2,
  },
  [TRANSACTION_TYPE.BURN]: {
    2: burnSchemaV2,
  },
  [TRANSACTION_TYPE.EXCHANGE]: {
    1: exchangeSchemaV1,
    2: exchangeSchemaV2,
  },
  [TRANSACTION_TYPE.LEASE]: {
    2: leaseSchemaV2,
  },
  [TRANSACTION_TYPE.CANCEL_LEASE]: {
    2: cancelLeaseSchemaV2,
  },
  [TRANSACTION_TYPE.ALIAS]: {
    2: aliasSchemaV2,
  },
  [TRANSACTION_TYPE.MASS_TRANSFER]: {
    1: massTransferSchemaV1,
  },
  [TRANSACTION_TYPE.DATA]: {
    1: dataSchemaV1,
  },
  [TRANSACTION_TYPE.SET_SCRIPT]: {
    1: setScriptSchemaV1,
  },
  [TRANSACTION_TYPE.SPONSORSHIP]: {
    1: sponsorshipSchemaV1,
  },
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
    1: setAssetScriptSchemaV1,
  },
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: {
    1: invokeScriptSchemaV1,
  },
};

export const orderVersionMap: Record<number, TObject> = {
  1: orderSchemaV1,
  2: orderSchemaV2,
  3: orderSchemaV3,
};

export function getTransactionSchema(type: TRANSACTION_TYPE, version?: number): TSchema {
  const schemas = (<any>schemasByTypeMap)[type];
  if (typeof schemas !== 'object') {
    throw new Error(`Incorrect tx type: ${type}`);
  }

  const schema = schemas[version || 1];
  if (typeof schema !== 'object') {
    throw new Error(`Incorrect tx version: ${version}`);
  }

  return schema;
}
