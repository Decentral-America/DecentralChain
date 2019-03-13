"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serializePrimitives_1 = require("./serializePrimitives");
const parsePrimitives_1 = require("./parsePrimitives");
const schemaTypes_1 = require("./schemaTypes");
//Todo: import this enums from ts-types package
var TRANSACTION_TYPE;
(function (TRANSACTION_TYPE) {
    TRANSACTION_TYPE[TRANSACTION_TYPE["GENESIS"] = 1] = "GENESIS";
    TRANSACTION_TYPE[TRANSACTION_TYPE["PAYMENT"] = 2] = "PAYMENT";
    TRANSACTION_TYPE[TRANSACTION_TYPE["ISSUE"] = 3] = "ISSUE";
    TRANSACTION_TYPE[TRANSACTION_TYPE["TRANSFER"] = 4] = "TRANSFER";
    TRANSACTION_TYPE[TRANSACTION_TYPE["REISSUE"] = 5] = "REISSUE";
    TRANSACTION_TYPE[TRANSACTION_TYPE["BURN"] = 6] = "BURN";
    TRANSACTION_TYPE[TRANSACTION_TYPE["EXCHANGE"] = 7] = "EXCHANGE";
    TRANSACTION_TYPE[TRANSACTION_TYPE["LEASE"] = 8] = "LEASE";
    TRANSACTION_TYPE[TRANSACTION_TYPE["CANCEL_LEASE"] = 9] = "CANCEL_LEASE";
    TRANSACTION_TYPE[TRANSACTION_TYPE["ALIAS"] = 10] = "ALIAS";
    TRANSACTION_TYPE[TRANSACTION_TYPE["MASS_TRANSFER"] = 11] = "MASS_TRANSFER";
    TRANSACTION_TYPE[TRANSACTION_TYPE["DATA"] = 12] = "DATA";
    TRANSACTION_TYPE[TRANSACTION_TYPE["SET_SCRIPT"] = 13] = "SET_SCRIPT";
    TRANSACTION_TYPE[TRANSACTION_TYPE["SPONSORSHIP"] = 14] = "SPONSORSHIP";
    TRANSACTION_TYPE[TRANSACTION_TYPE["SET_ASSET_SCRIPT"] = 15] = "SET_ASSET_SCRIPT";
    TRANSACTION_TYPE[TRANSACTION_TYPE["INVOKE_SCRIPT"] = 16] = "INVOKE_SCRIPT";
})(TRANSACTION_TYPE = exports.TRANSACTION_TYPE || (exports.TRANSACTION_TYPE = {}));
const shortConverter = {
    toBytes: serializePrimitives_1.SHORT,
    fromBytes: parsePrimitives_1.P_SHORT,
};
const intConverter = {
    toBytes: serializePrimitives_1.INT,
    fromBytes: parsePrimitives_1.P_INT,
};
var txFields;
(function (txFields) {
    //Field constructors
    txFields.longField = (name) => ([name, { toBytes: serializePrimitives_1.LONG, fromBytes: parsePrimitives_1.P_LONG }]);
    txFields.byteField = (name) => ([name, { toBytes: serializePrimitives_1.BYTE, fromBytes: parsePrimitives_1.P_BYTE }]);
    txFields.booleanField = (name) => ([name, { toBytes: serializePrimitives_1.BOOL, fromBytes: parsePrimitives_1.P_BOOLEAN }]);
    txFields.stringField = (name) => ([name, {
            toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.STRING),
            fromBytes: parsePrimitives_1.P_STRING_VAR(parsePrimitives_1.P_SHORT),
        }]);
    txFields.base58field32 = (name) => ([name, {
            toBytes: serializePrimitives_1.BASE58_STRING,
            fromBytes: parsePrimitives_1.P_BASE58_FIXED(32),
        }]);
    txFields.base58Option32 = (name) => ([name, {
            toBytes: serializePrimitives_1.OPTION(serializePrimitives_1.BASE58_STRING),
            fromBytes: parsePrimitives_1.P_OPTION(parsePrimitives_1.P_BASE58_FIXED(32)),
        }]);
    txFields.base64field = (name) => ([name, {
            toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.BASE64_STRING),
            fromBytes: parsePrimitives_1.P_BASE64(parsePrimitives_1.P_SHORT),
        }]);
    txFields.byteConstant = (byte) => (['noname', {
            toBytes: () => Uint8Array.from([byte]),
            fromBytes: () => ({ value: undefined, shift: 1 }),
        }]);
    // Primitive fields
    txFields.alias = ['alias', {
            toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.STRING),
            fromBytes: parsePrimitives_1.byteNewAliasToString,
        }];
    txFields.amount = txFields.longField('amount');
    txFields.assetDescription = txFields.stringField('description');
    txFields.assetId = txFields.base58field32('assetId');
    txFields.assetName = txFields.stringField('name');
    txFields.attachment = ['attachment', {
            toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.BASE58_STRING),
            fromBytes: parsePrimitives_1.P_BASE58_VAR(parsePrimitives_1.P_SHORT),
        }];
    txFields.chainId = txFields.byteField('chainId');
    txFields.decimals = txFields.byteField('decimals');
    txFields.fee = txFields.longField('fee');
    txFields.leaseAssetId = txFields.base58Option32('leaseAssetId');
    txFields.leaseId = txFields.base58field32('leaseId');
    txFields.optionalAssetId = txFields.base58Option32('assetId');
    txFields.quantity = txFields.longField('quantity');
    txFields.reissuable = txFields.booleanField('reissuable');
    txFields.recipient = ['recipient', {
            toBytes: serializePrimitives_1.BASE58_STRING,
            fromBytes: parsePrimitives_1.byteToAddressOrAlias,
        }];
    txFields.script = ['script', {
            toBytes: serializePrimitives_1.SCRIPT,
            fromBytes: parsePrimitives_1.byteToScript,
        }];
    txFields.senderPublicKey = txFields.base58field32('senderPublicKey');
    txFields.signature = ['signature', {
            toBytes: serializePrimitives_1.BASE58_STRING,
            fromBytes: parsePrimitives_1.P_BASE58_FIXED(64),
        }];
    txFields.timestamp = txFields.longField('timestamp');
    txFields.type = txFields.byteField('type');
    txFields.version = txFields.byteField('version');
    // Complex fields
    txFields.proofs = ['proofs', {
            type: 'array',
            items: {
                toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.BASE58_STRING),
                fromBytes: parsePrimitives_1.P_BASE58_VAR(parsePrimitives_1.P_SHORT),
            },
        }];
    const transfer = {
        type: 'object',
        schema: [
            txFields.recipient,
            txFields.amount,
        ],
    };
    txFields.transfers = ['transfers', {
            type: 'array',
            items: transfer,
        }];
    const dataTxItem = {
        type: 'dataTxField',
        items: new Map([
            [schemaTypes_1.DATA_FIELD_TYPE.INTEGER, { toBytes: serializePrimitives_1.LONG, fromBytes: parsePrimitives_1.P_LONG }],
            [schemaTypes_1.DATA_FIELD_TYPE.BOOLEAN, { toBytes: serializePrimitives_1.BOOL, fromBytes: parsePrimitives_1.P_BOOLEAN }],
            [schemaTypes_1.DATA_FIELD_TYPE.BINARY, { toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.BASE64_STRING), fromBytes: parsePrimitives_1.P_BASE64(parsePrimitives_1.P_SHORT) }],
            [schemaTypes_1.DATA_FIELD_TYPE.STRING, { toBytes: serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.STRING), fromBytes: parsePrimitives_1.P_STRING_VAR(parsePrimitives_1.P_SHORT) }],
        ]),
    };
    txFields.data = ['data', {
            type: 'array',
            items: dataTxItem,
        }];
    const functionArgument = schemaTypes_1.anyOf([
        [0, { toBytes: serializePrimitives_1.LONG, fromBytes: parsePrimitives_1.P_LONG }, 'integer'],
        [1, { toBytes: serializePrimitives_1.LEN(serializePrimitives_1.INT)(serializePrimitives_1.BASE64_STRING), fromBytes: parsePrimitives_1.P_BASE64(parsePrimitives_1.P_INT) }, 'binary'],
        [2, { toBytes: serializePrimitives_1.LEN(serializePrimitives_1.INT)(serializePrimitives_1.STRING), fromBytes: parsePrimitives_1.P_STRING_VAR(parsePrimitives_1.P_INT) }, 'string'],
        [6, { toBytes: () => Uint8Array.from([]), fromBytes: () => ({ value: true, shift: 0 }) }, 'true'],
        [7, { toBytes: () => Uint8Array.from([]), fromBytes: () => ({ value: true, shift: 0 }) }, 'false'],
    ], { valueField: 'value' });
    txFields.functionCall = ['call', {
            type: 'object',
            schema: [
                // special bytes to indicate function call. Used in Serde serializer
                txFields.byteConstant(9),
                txFields.byteConstant(1),
                ['function', {
                        toBytes: serializePrimitives_1.LEN(serializePrimitives_1.INT)(serializePrimitives_1.STRING),
                        fromBytes: parsePrimitives_1.P_STRING_VAR(parsePrimitives_1.P_INT),
                    }],
                ['args', {
                        type: 'array',
                        toBytes: serializePrimitives_1.INT,
                        fromBytes: parsePrimitives_1.P_INT,
                        items: functionArgument,
                    }],
            ],
        }];
    txFields.payment = {
        type: 'object',
        schema: [
            txFields.byteConstant(0),
            ['assetId', {
                    toBytes: (assetId) => Uint8Array.from([assetId ? 43 : 9]),
                    fromBytes: () => ({ value: undefined, shift: 1 }),
                }],
            txFields.amount,
            ['assetId', {
                    toBytes: serializePrimitives_1.OPTION(serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.BASE58_STRING)),
                    fromBytes: parsePrimitives_1.P_OPTION(parsePrimitives_1.P_BASE58_VAR(parsePrimitives_1.P_SHORT)),
                }],
        ],
    };
    txFields.payments = ['payment', {
            type: 'array',
            items: txFields.payment,
        }];
})(txFields = exports.txFields || (exports.txFields = {}));
exports.orderSchemaV0 = {
    type: 'object',
    schema: [
        txFields.senderPublicKey,
        txFields.base58field32('matcherPublicKey'),
        ['assetPair', {
                type: 'object',
                schema: [
                    txFields.base58Option32('amountAsset'),
                    txFields.base58Option32('priceAsset'),
                ],
            }],
        ['orderType', {
                toBytes: (type) => serializePrimitives_1.BYTE(type === 'sell' ? 1 : 0),
                fromBytes: (bytes, start = 0) => parsePrimitives_1.P_BYTE(bytes, start).value === 1 ?
                    { value: 'sell', shift: 1 } :
                    { value: 'buy', shift: 1 },
            }],
        txFields.longField('price'),
        txFields.longField('amount'),
        txFields.timestamp,
        txFields.longField('expiration'),
        txFields.longField('matcherFee'),
    ],
};
exports.orderSchemaV2 = {
    type: 'object',
    schema: [
        txFields.version,
        ...exports.orderSchemaV0.schema,
    ],
};
exports.aliasSchemaV2 = {
    type: 'object',
    schema: [
        txFields.type,
        txFields.version,
        txFields.senderPublicKey,
        [['alias', 'chainId'], {
                type: 'object',
                withLength: shortConverter,
                schema: [
                    txFields.byteConstant(2),
                    txFields.chainId,
                    txFields.alias,
                ],
            }],
        txFields.fee,
        txFields.timestamp,
    ],
};
exports.burnSchemaV2 = {
    type: 'object',
    schema: [
        txFields.type,
        txFields.version,
        txFields.chainId,
        txFields.senderPublicKey,
        txFields.assetId,
        txFields.quantity,
        txFields.fee,
        txFields.timestamp,
    ],
};
exports.cancelLeaseSchemaV2 = {
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
exports.invokeScriptSchemaV1 = {
    type: 'object',
    schema: [
        txFields.type,
        txFields.version,
        txFields.chainId,
        txFields.senderPublicKey,
        ['contractAddress', {
                toBytes: serializePrimitives_1.BASE58_STRING,
                fromBytes: parsePrimitives_1.P_BASE58_FIXED(26),
            }],
        txFields.functionCall,
        txFields.payments,
        txFields.fee,
        ['feeAssetId', txFields.optionalAssetId[1]],
        txFields.timestamp,
    ],
};
exports.dataSchemaV1 = {
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
exports.proofsSchemaV0 = {
    type: 'object',
    schema: [
        ['signature', {
                toBytes: serializePrimitives_1.BASE58_STRING,
                fromBytes: parsePrimitives_1.P_BASE58_FIXED(64),
            }],
    ],
};
exports.proofsSchemaV1 = {
    type: 'object',
    schema: [
        txFields.byteConstant(1),
        txFields.proofs,
    ],
};
exports.exchangeSchemaV0 = {
    type: 'object',
    schema: [
        txFields.type,
        ['order1', {
                type: 'object',
                withLength: intConverter,
                schema: [...exports.orderSchemaV0.schema, txFields.signature],
            }],
        ['order2', {
                type: 'object',
                withLength: intConverter,
                schema: [...exports.orderSchemaV0.schema, txFields.signature],
            }],
        txFields.longField('price'),
        txFields.longField('amount'),
        txFields.longField('buyMatcherFee'),
        txFields.longField('sellMatcherFee'),
        txFields.longField('fee'),
        txFields.longField('timestamp'),
    ],
};
const anyOrder = schemaTypes_1.anyOf([
    [1, { type: 'object', withLength: intConverter, schema: [txFields.byteConstant(1), ...exports.orderSchemaV0.schema, ...exports.proofsSchemaV0.schema] }],
    [2, { type: 'object', withLength: intConverter, schema: [...exports.orderSchemaV2.schema, ...exports.proofsSchemaV1.schema] }],
], { discriminatorField: 'version', discriminatorBytePos: 4 });
exports.exchangeSchemaV2 = {
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
exports.issueSchemaV2 = {
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
exports.leaseSchemaV2 = {
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
exports.massTransferSchemaV1 = {
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
exports.reissueSchemaV2 = {
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
exports.setAssetScriptSchemaV1 = {
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
exports.setScriptSchemaV1 = {
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
exports.sponsorshipSchemaV1 = {
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
exports.transferSchemaV2 = {
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
 * Maps transaction types to schemas object. Schemas are written by keys. 0 - no version, n - version n
 */
exports.schemasByTypeMap = {
    [TRANSACTION_TYPE.GENESIS]: {},
    [TRANSACTION_TYPE.PAYMENT]: {},
    [TRANSACTION_TYPE.ISSUE]: {
        2: exports.issueSchemaV2,
    },
    [TRANSACTION_TYPE.TRANSFER]: {
        2: exports.transferSchemaV2,
    },
    [TRANSACTION_TYPE.REISSUE]: {
        2: exports.reissueSchemaV2,
    },
    [TRANSACTION_TYPE.BURN]: {
        2: exports.burnSchemaV2,
    },
    [TRANSACTION_TYPE.EXCHANGE]: {
        0: exports.exchangeSchemaV0,
        2: exports.exchangeSchemaV2,
    },
    [TRANSACTION_TYPE.LEASE]: {
        2: exports.leaseSchemaV2,
    },
    [TRANSACTION_TYPE.CANCEL_LEASE]: {
        2: exports.cancelLeaseSchemaV2,
    },
    [TRANSACTION_TYPE.ALIAS]: {
        2: exports.aliasSchemaV2,
    },
    [TRANSACTION_TYPE.MASS_TRANSFER]: {
        1: exports.massTransferSchemaV1,
    },
    [TRANSACTION_TYPE.DATA]: {
        1: exports.dataSchemaV1,
    },
    [TRANSACTION_TYPE.SET_SCRIPT]: {
        1: exports.setScriptSchemaV1,
    },
    [TRANSACTION_TYPE.SPONSORSHIP]: {
        1: exports.sponsorshipSchemaV1,
    },
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
        1: exports.setAssetScriptSchemaV1,
    },
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: {
        1: exports.invokeScriptSchemaV1,
    },
};
function getTransactionSchema(type, version) {
    const schemas = exports.schemasByTypeMap[type];
    if (typeof schemas !== 'object') {
        throw new Error(`Incorrect tx type: ${type}`);
    }
    const schema = schemas[version || 0];
    if (typeof schema !== 'object') {
        throw new Error(`Incorrect tx version: ${version}`);
    }
    return schema;
}
exports.getTransactionSchema = getTransactionSchema;
//# sourceMappingURL=schemas.js.map