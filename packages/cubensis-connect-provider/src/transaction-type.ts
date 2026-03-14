/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * DecentralChain transaction type constants.
 * Inlined from the DecentralChain protocol specification.
 */

/** Transaction type numeric identifiers for the DecentralChain protocol. */
export const TRANSACTION_TYPE = Object.freeze({
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
  UPDATE_ASSET_INFO: 17,
} as const);

/** Union of all transaction type values. */
export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

/** Map of transaction type numbers to their names. */
export type TransactionMap = {
  [K in keyof typeof TRANSACTION_TYPE as (typeof TRANSACTION_TYPE)[K]]: K;
};
