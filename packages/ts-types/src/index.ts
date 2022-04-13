export * from '../transactions';
export * from './parts';

export const GENESIS_TYPE = 1 as 1;
export const PAYMENT_TYPE = 2 as 2;
export const ISSUE_TYPE = 3 as 3;
export const TRANSFER_TYPE = 4 as 4;
export const REISSUE_TYPE = 5 as 5;
export const BURN_TYPE = 6 as 6;
export const EXCHANGE_TYPE = 7 as 7;
export const LEASE_TYPE = 8 as 8;
export const CANCEL_LEASE_TYPE = 9 as 9;
export const ALIAS_TYPE = 10 as 10;
export const MASS_TRANSFER_TYPE = 11 as 11;
export const DATA_TYPE = 12 as 12;
export const SET_SCRIPT_TYPE = 13 as 13;
export const SPONSORSHIP_TYPE = 14 as 14;
export const SET_ASSET_SCRIPT_TYPE = 15 as 15;
export const INVOKE_SCRIPT_TYPE = 16 as 16;
export const UPDATE_ASSET_INFO_TYPE = 17 as 17;
export const ETHEREUM = 18 as 18;

export const INTEGER_DATA_TYPE = 'integer' as 'integer';
export const BOOLEAN_DATA_TYPE = 'boolean' as 'boolean';
export const STRING_DATA_TYPE = 'string' as 'string';
export const BINARY_DATA_TYPE = 'binary' as 'binary';

export const TRANSACTION_TYPE = {
    GENESIS: GENESIS_TYPE,
    PAYMENT: PAYMENT_TYPE,
    ISSUE: ISSUE_TYPE,
    TRANSFER: TRANSFER_TYPE,
    REISSUE: REISSUE_TYPE,
    BURN: BURN_TYPE,
    EXCHANGE: EXCHANGE_TYPE,
    LEASE: LEASE_TYPE,
    CANCEL_LEASE: CANCEL_LEASE_TYPE,
    ALIAS: ALIAS_TYPE,
    MASS_TRANSFER: MASS_TRANSFER_TYPE,
    DATA: DATA_TYPE,
    SET_SCRIPT: SET_SCRIPT_TYPE,
    SPONSORSHIP: SPONSORSHIP_TYPE,
    SET_ASSET_SCRIPT: SET_ASSET_SCRIPT_TYPE,
    INVOKE_SCRIPT: INVOKE_SCRIPT_TYPE,
    UPDATE_ASSET_INFO: UPDATE_ASSET_INFO_TYPE,
    ETHEREUM: ETHEREUM,
};

export const DATA_FIELD_TYPE = {
    INTEGER: INTEGER_DATA_TYPE,
    BOOLEAN: BOOLEAN_DATA_TYPE,
    STRING: STRING_DATA_TYPE,
    BINARY: BINARY_DATA_TYPE,
};

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];
export type DataFiledType = typeof DATA_FIELD_TYPE[keyof typeof DATA_FIELD_TYPE];
