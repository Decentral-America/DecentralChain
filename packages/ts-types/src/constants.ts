// ── Transaction Type IDs ────────────────────────────────────────────────────
export const GENESIS_TYPE = 1 as const;
export const PAYMENT_TYPE = 2 as const;
export const ISSUE_TYPE = 3 as const;
export const TRANSFER_TYPE = 4 as const;
export const REISSUE_TYPE = 5 as const;
export const BURN_TYPE = 6 as const;
export const EXCHANGE_TYPE = 7 as const;
export const LEASE_TYPE = 8 as const;
export const CANCEL_LEASE_TYPE = 9 as const;
export const ALIAS_TYPE = 10 as const;
export const MASS_TRANSFER_TYPE = 11 as const;
export const DATA_TYPE = 12 as const;
export const SET_SCRIPT_TYPE = 13 as const;
export const SPONSORSHIP_TYPE = 14 as const;
export const SET_ASSET_SCRIPT_TYPE = 15 as const;
export const INVOKE_SCRIPT_TYPE = 16 as const;
export const UPDATE_ASSET_INFO_TYPE = 17 as const;
export const ETHEREUM = 18 as const;
export const COMMIT_TO_GENERATION_TYPE = 19 as const;

// ── Data Field Type IDs ─────────────────────────────────────────────────────
export const INTEGER_DATA_TYPE = 'integer' as const;
export const BOOLEAN_DATA_TYPE = 'boolean' as const;
export const STRING_DATA_TYPE = 'string' as const;
export const BINARY_DATA_TYPE = 'binary' as const;

// ── Lookup Objects ──────────────────────────────────────────────────────────
export const TRANSACTION_TYPE = {
  ALIAS: ALIAS_TYPE,
  BURN: BURN_TYPE,
  CANCEL_LEASE: CANCEL_LEASE_TYPE,
  COMMIT_TO_GENERATION: COMMIT_TO_GENERATION_TYPE,
  DATA: DATA_TYPE,
  ETHEREUM: ETHEREUM,
  EXCHANGE: EXCHANGE_TYPE,
  GENESIS: GENESIS_TYPE,
  INVOKE_SCRIPT: INVOKE_SCRIPT_TYPE,
  ISSUE: ISSUE_TYPE,
  LEASE: LEASE_TYPE,
  MASS_TRANSFER: MASS_TRANSFER_TYPE,
  PAYMENT: PAYMENT_TYPE,
  REISSUE: REISSUE_TYPE,
  SET_ASSET_SCRIPT: SET_ASSET_SCRIPT_TYPE,
  SET_SCRIPT: SET_SCRIPT_TYPE,
  SPONSORSHIP: SPONSORSHIP_TYPE,
  TRANSFER: TRANSFER_TYPE,
  UPDATE_ASSET_INFO: UPDATE_ASSET_INFO_TYPE,
} as const;

export const DATA_FIELD_TYPE = {
  BINARY: BINARY_DATA_TYPE,
  BOOLEAN: BOOLEAN_DATA_TYPE,
  INTEGER: INTEGER_DATA_TYPE,
  STRING: STRING_DATA_TYPE,
} as const;

// ── Derived Types ───────────────────────────────────────────────────────────
export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
export type DataFieldType = (typeof DATA_FIELD_TYPE)[keyof typeof DATA_FIELD_TYPE];
