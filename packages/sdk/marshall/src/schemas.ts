import {
  byteNewAliasToString,
  byteToAddressOrAlias,
  byteToScript,
  P_BASE58_FIXED,
  P_BASE58_VAR,
  P_BASE64,
  P_BOOLEAN,
  P_BYTE,
  P_INT,
  P_LONG,
  P_OPTION,
  P_SHORT,
  P_STRING_VAR,
} from './parsePrimitives';
import {
  anyOf,
  DATA_FIELD_TYPE,
  type TDataTxItem,
  type TObject,
  type TObjectField,
  type TPrimitive,
  type TSchema,
} from './schemaTypes';
import { serializerFromSchema } from './serializeFromSchema';
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

export const TRANSACTION_TYPE = {
  ALIAS: 10,
  BURN: 6,
  CANCEL_LEASE: 9,
  DATA: 12,
  EXCHANGE: 7,
  GENESIS: 1,
  INVOKE_SCRIPT: 16,
  ISSUE: 3,
  LEASE: 8,
  MASS_TRANSFER: 11,
  PAYMENT: 2,
  REISSUE: 5,
  SET_ASSET_SCRIPT: 15,
  SET_SCRIPT: 13,
  SPONSORSHIP: 14,
  TRANSFER: 4,
} as const;
export type TRANSACTION_TYPE = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

const shortConverter = {
  fromBytes: P_SHORT,
  toBytes: SHORT,
};

const intConverter = {
  fromBytes: P_INT,
  toBytes: INT,
};
export const txFields = (() => {
  //Field constructors
  const longField = (name: string): TObjectField => [name, { fromBytes: P_LONG, toBytes: LONG }];

  const byteField = (name: string): TObjectField => [name, { fromBytes: P_BYTE, toBytes: BYTE }];

  const booleanField = (name: string): TObjectField => [
    name,
    { fromBytes: P_BOOLEAN, toBytes: BOOL },
  ];

  const stringField = (name: string): TObjectField => [
    name,
    {
      fromBytes: P_STRING_VAR(P_SHORT),
      toBytes: LEN(SHORT)(STRING),
    },
  ];

  const base58field32 = (name: string): TObjectField => [
    name,
    {
      fromBytes: P_BASE58_FIXED(32),
      toBytes: BASE58_STRING,
    },
  ];

  // String 'DCC' often used instead of null. That's why we should serialize it as null
  const base58Option32 = (name: string): TObjectField => [
    name,
    {
      fromBytes: P_OPTION(P_BASE58_FIXED(32)),
      toBytes: (s: string) =>
        s === 'DCC' ? OPTION(BASE58_STRING)(null) : OPTION(BASE58_STRING)(s),
    },
  ];

  const base64field = (name: string): TObjectField => [
    name,
    {
      fromBytes: P_BASE64(P_SHORT),
      toBytes: LEN(SHORT)(BASE64_STRING),
    },
  ];

  const byteConstant = (byte: number): TObjectField => [
    'noname',
    {
      fromBytes: () => ({ shift: 1, value: undefined }),
      toBytes: () => Uint8Array.from([byte]),
    },
  ];

  // Primitive fields
  const alias: TObjectField = [
    'alias',
    {
      fromBytes: byteNewAliasToString,
      toBytes: LEN(SHORT)(STRING),
    },
  ];

  const amount = longField('amount');

  const assetDescription = stringField('description');

  const assetId = base58field32('assetId');
  const assetName = stringField('name');

  const attachment: TObjectField = [
    'attachment',
    {
      fromBytes: P_BASE58_VAR(P_SHORT),
      toBytes: LEN(SHORT)(BASE58_STRING),
    },
  ];

  const chainId = byteField('chainId');

  const decimals = byteField('decimals');

  const fee = longField('fee');

  const leaseAssetId = base58Option32('leaseAssetId');

  const leaseId = base58field32('leaseId');

  const optionalAssetId = base58Option32('assetId');

  const quantity = longField('quantity');

  const reissuable = booleanField('reissuable');

  const recipient: TObjectField = [
    'recipient',
    {
      fromBytes: byteToAddressOrAlias,
      toBytes: ADDRESS_OR_ALIAS,
    },
  ];

  const script: TObjectField = [
    'script',
    {
      fromBytes: byteToScript,
      toBytes: SCRIPT,
    },
  ];

  const senderPublicKey = base58field32('senderPublicKey');

  const signature: TObjectField = [
    'signature',
    {
      fromBytes: P_BASE58_FIXED(64),
      toBytes: BASE58_STRING,
    },
  ];

  const timestamp = longField('timestamp');

  const type = byteField('type');

  const version = byteField('version');

  // Complex fields

  const proofs: TObjectField = [
    'proofs',
    {
      items: {
        fromBytes: P_BASE58_VAR(P_SHORT),
        toBytes: LEN(SHORT)(BASE58_STRING),
      },
      type: 'array',
    },
  ];

  const transfer: TObject = {
    schema: [recipient, amount],
    type: 'object',
  };

  const transfers: TObjectField = [
    'transfers',
    {
      items: transfer,
      type: 'array',
    },
  ];

  const dataTxItem: TDataTxItem = {
    items: new Map<DATA_FIELD_TYPE, TSchema>([
      [DATA_FIELD_TYPE.INTEGER, { fromBytes: P_LONG, toBytes: LONG }],
      [DATA_FIELD_TYPE.BOOLEAN, { fromBytes: P_BOOLEAN, toBytes: BOOL }],
      [
        DATA_FIELD_TYPE.BINARY,
        { fromBytes: P_BASE64(P_SHORT), toBytes: LEN(SHORT)(BASE64_STRING) },
      ],
      [DATA_FIELD_TYPE.STRING, { fromBytes: P_STRING_VAR(P_SHORT), toBytes: LEN(SHORT)(STRING) }],
    ]),
    type: 'dataTxField',
  };

  const data: TObjectField = [
    'data',
    {
      items: dataTxItem,
      type: 'array',
    },
  ];

  const functionArgumentPrimitives: [number, TSchema, string?][] = [
    [0, { fromBytes: P_LONG, toBytes: LONG }, 'integer'],
    [1, { fromBytes: P_BASE64(P_INT), toBytes: LEN(INT)(BASE64_STRING) }, 'binary'],
    [2, { fromBytes: P_STRING_VAR(P_INT), toBytes: LEN(INT)(STRING) }, 'string'],
    [
      6,
      { fromBytes: () => ({ shift: 0, value: true }), toBytes: () => new Uint8Array(0) },
      'boolean',
    ],
    [
      7,
      { fromBytes: () => ({ shift: 0, value: false }), toBytes: () => new Uint8Array(0) },
      'boolean',
    ],
  ];

  const functionArgument = anyOf(
    [
      ...functionArgumentPrimitives,
      [
        11,
        {
          fromBytes: P_INT,
          items: anyOf(functionArgumentPrimitives, { valueField: 'value' }),
          toBytes: INT,
          type: 'array',
        },
        'list',
      ],
    ],
    { valueField: 'value' },
  );

  const functionCall: TObjectField = [
    'call',
    {
      optional: true,
      schema: [
        // special bytes to indicate function call. Used in Serde serializer
        byteConstant(9),
        byteConstant(1),
        [
          'function',
          {
            fromBytes: P_STRING_VAR(P_INT),
            toBytes: LEN(INT)(STRING),
          },
        ],
        [
          'args',
          {
            fromBytes: P_INT,
            items: functionArgument,
            toBytes: INT,
            type: 'array',
          },
        ],
      ],
      type: 'object',
    },
  ];

  const payment: TObject = {
    schema: [amount, optionalAssetId],
    type: 'object',
    withLength: shortConverter,
  };

  const payments: TObjectField = [
    'payment',
    {
      items: payment,
      type: 'array',
    },
  ];

  return {
    alias,
    amount,
    assetDescription,
    assetId,
    assetName,
    attachment,
    base58field32,
    base58Option32,
    base64field,
    booleanField,
    byteConstant,
    byteField,
    chainId,
    data,
    decimals,
    fee,
    functionCall,
    leaseAssetId,
    leaseId,
    longField,
    optionalAssetId,
    payment,
    payments,
    proofs,
    quantity,
    recipient,
    reissuable,
    script,
    senderPublicKey,
    signature,
    stringField,
    timestamp,
    transfers,
    type,
    version,
  };
})();

export const orderSchemaV1: TObject = {
  schema: [
    txFields.senderPublicKey,
    txFields.base58field32('matcherPublicKey'),
    [
      'assetPair',
      {
        schema: [txFields.base58Option32('amountAsset'), txFields.base58Option32('priceAsset')],
        type: 'object',
      },
    ],
    [
      'orderType',
      {
        fromBytes: (bytes: Uint8Array, start = 0) =>
          P_BYTE(bytes, start).value === 1
            ? { shift: 1, value: 'sell' }
            : { shift: 1, value: 'buy' },
        toBytes: (type: string) => BYTE(type === 'sell' ? 1 : 0),
      },
    ],
    txFields.longField('price'),
    txFields.longField('amount'),
    txFields.timestamp,
    txFields.longField('expiration'),
    txFields.longField('matcherFee'),
  ],
  type: 'object',
};

export const orderSchemaV2: TObject = {
  schema: [txFields.version, ...orderSchemaV1.schema],
  type: 'object',
};

// In order v3 amount and price fields are flipped
export const orderSchemaV3: TObject = {
  schema: [...orderSchemaV2.schema, ['matcherFeeAssetId', txFields.optionalAssetId[1]]],
  type: 'object',
};

export const aliasSchemaV2: TObject = {
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    [
      ['alias', 'chainId'],
      {
        schema: [
          txFields.byteConstant(2), // Alias version
          txFields.chainId, //
          txFields.alias, // Alias text
        ],
        type: 'object',
        withLength: shortConverter,
      },
    ],
    txFields.fee,
    txFields.timestamp,
  ],
  type: 'object',
};

export const burnSchemaV2: TObject = {
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
  type: 'object',
};

export const cancelLeaseSchemaV2: TObject = {
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.fee,
    txFields.timestamp,
    txFields.leaseId,
  ],
  type: 'object',
};

export const invokeScriptSchemaV1: TObject = {
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
  type: 'object',
};

export const dataSchemaV1: TObject = {
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.data,
    txFields.timestamp,
    txFields.fee,
  ],
  type: 'object',
};

export const proofsSchemaV0: TObject = {
  schema: [
    [
      'signature',
      {
        fromBytes: P_BASE58_FIXED(64),
        toBytes: BASE58_STRING,
      },
    ],
  ],
  type: 'object',
};

export const proofsSchemaV1: TObject = {
  schema: [
    txFields.byteConstant(1), // proofs version
    txFields.proofs,
  ],
  type: 'object',
};

const orderSchemaV0WithSignature: TObject = {
  schema: [...orderSchemaV1.schema, txFields.signature],
  type: 'object',
};
//ExchangeV0 needs both orders length to be present before actual order bytes.
// That's why there are two separate rules for oder1 and order2 fields. First one serializes order and writes length.
// Seconds serializes and writes whole order. When deserialize, second rule overwrites order fields in js object
export const exchangeSchemaV1: TObject = {
  schema: [
    txFields.type,
    [
      'order1',
      {
        fromBytes: () => ({ shift: 4, value: undefined }),
        toBytes: (order: Record<string, unknown>) =>
          INT(serializerFromSchema(orderSchemaV0WithSignature)(order).length),
      },
    ],
    [
      'order2',
      {
        fromBytes: () => ({ shift: 4, value: undefined }),
        toBytes: (order: Record<string, unknown>) =>
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
  type: 'object',
};

const anyOrder = anyOf(
  [
    [
      1,
      {
        schema: [txFields.byteConstant(1), ...orderSchemaV1.schema, ...proofsSchemaV0.schema],
        type: 'object',
        //order v1 length is serialized without orderVersion
        withLength: {
          fromBytes: (x) => {
            const { value, shift } = P_INT(x);
            return { shift, value: value + 1 };
          },
          toBytes: (x) => INT(x - 1),
        } as TPrimitive,
      },
    ],
    [
      2,
      {
        schema: [...orderSchemaV2.schema, ...proofsSchemaV1.schema],
        type: 'object',
        withLength: intConverter,
      },
    ],
    [
      3,
      {
        schema: [...orderSchemaV3.schema, ...proofsSchemaV1.schema],
        type: 'object',
        withLength: intConverter,
      },
    ],
  ],
  { discriminatorBytePos: 4, discriminatorField: 'version' },
);

export const exchangeSchemaV2: TObject = {
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
  type: 'object',
};

export const issueSchemaV2: TObject = {
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
  type: 'object',
};

export const leaseSchemaV2: TObject = {
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
  type: 'object',
};

export const massTransferSchemaV1: TObject = {
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
  type: 'object',
};

export const reissueSchemaV2: TObject = {
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
  type: 'object',
};

export const setAssetScriptSchemaV1: TObject = {
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
  type: 'object',
};

export const setScriptSchemaV1: TObject = {
  schema: [
    txFields.type,
    txFields.version,
    txFields.chainId,
    txFields.senderPublicKey,
    txFields.script,
    txFields.fee,
    txFields.timestamp,
  ],
  type: 'object',
};

export const sponsorshipSchemaV1: TObject = {
  schema: [
    txFields.type,
    txFields.version,
    txFields.senderPublicKey,
    txFields.assetId,
    txFields.longField('minSponsoredAssetFee'),
    txFields.fee,
    txFields.timestamp,
  ],
  type: 'object',
};

export const transferSchemaV2: TObject = {
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
  type: 'object',
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
  const schemas = (schemasByTypeMap as Record<number, Record<number, TSchema>>)[type];
  if (typeof schemas !== 'object') {
    throw new Error(`Incorrect tx type: ${type}`);
  }

  // biome-ignore lint/nursery/useNullishCoalescing: version 0 is semantically invalid for tx schemas; || correctly treats both 0 and null/undefined as "unspecified" and defaults to version 1
  const schema = schemas[version || 1];
  if (typeof schema !== 'object') {
    throw new Error(`Incorrect tx version: ${version}`);
  }

  return schema;
}
