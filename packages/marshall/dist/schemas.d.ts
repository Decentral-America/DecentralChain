import { TObject, TSchema, TObjectField } from './schemaTypes';
export declare enum TRANSACTION_TYPE {
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
    INVOKE_SCRIPT = 16
}
export declare namespace txFields {
    const longField: (name: string) => [string | string[], TSchema];
    const byteField: (name: string) => [string | string[], TSchema];
    const booleanField: (name: string) => [string | string[], TSchema];
    const stringField: (name: string) => [string | string[], TSchema];
    const base58field32: (name: string) => [string | string[], TSchema];
    const base58Option32: (name: string) => [string | string[], TSchema];
    const base64field: (name: string) => [string | string[], TSchema];
    const byteConstant: (byte: number) => [string | string[], TSchema];
    const alias: TObjectField;
    const amount: [string | string[], TSchema];
    const assetDescription: [string | string[], TSchema];
    const assetId: [string | string[], TSchema];
    const assetName: [string | string[], TSchema];
    const attachment: TObjectField;
    const chainId: [string | string[], TSchema];
    const decimals: [string | string[], TSchema];
    const fee: [string | string[], TSchema];
    const leaseAssetId: [string | string[], TSchema];
    const leaseId: [string | string[], TSchema];
    const optionalAssetId: [string | string[], TSchema];
    const quantity: [string | string[], TSchema];
    const reissuable: [string | string[], TSchema];
    const recipient: TObjectField;
    const script: TObjectField;
    const senderPublicKey: [string | string[], TSchema];
    const signature: TObjectField;
    const timestamp: [string | string[], TSchema];
    const type: [string | string[], TSchema];
    const version: [string | string[], TSchema];
    const proofs: TObjectField;
    const transfers: TObjectField;
    const data: TObjectField;
    const functionCall: TObjectField;
    const payment: TObject;
    const payments: TObjectField;
}
export declare const orderSchemaV0: TObject;
export declare const orderSchemaV2: TSchema;
export declare const aliasSchemaV2: TSchema;
export declare const burnSchemaV2: TSchema;
export declare const cancelLeaseSchemaV2: TSchema;
export declare const invokeScriptSchemaV1: TSchema;
export declare const dataSchemaV1: TSchema;
export declare const proofsSchemaV0: TSchema;
export declare const proofsSchemaV1: TSchema;
export declare const exchangeSchemaV0: TSchema;
export declare const exchangeSchemaV2: TSchema;
export declare const issueSchemaV2: TSchema;
export declare const leaseSchemaV2: TSchema;
export declare const massTransferSchemaV1: TSchema;
export declare const reissueSchemaV2: TSchema;
export declare const setAssetScriptSchemaV1: TSchema;
export declare const setScriptSchemaV1: TSchema;
export declare const sponsorshipSchemaV1: TSchema;
export declare const transferSchemaV2: TSchema;
/**
 * Maps transaction types to schemas object. Schemas are written by keys. 0 - no version, n - version n
 */
export declare const schemasByTypeMap: {
    [TRANSACTION_TYPE.GENESIS]: {};
    [TRANSACTION_TYPE.PAYMENT]: {};
    [TRANSACTION_TYPE.ISSUE]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.TRANSFER]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.REISSUE]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.BURN]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.EXCHANGE]: {
        0: TObject;
        2: TObject;
    };
    [TRANSACTION_TYPE.LEASE]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.CANCEL_LEASE]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.ALIAS]: {
        2: TObject;
    };
    [TRANSACTION_TYPE.MASS_TRANSFER]: {
        1: TObject;
    };
    [TRANSACTION_TYPE.DATA]: {
        1: TObject;
    };
    [TRANSACTION_TYPE.SET_SCRIPT]: {
        1: TObject;
    };
    [TRANSACTION_TYPE.SPONSORSHIP]: {
        1: TObject;
    };
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
        1: TObject;
    };
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: {
        1: TObject;
    };
};
export declare function getTransactionSchema(type: TRANSACTION_TYPE, version?: number): TSchema;
