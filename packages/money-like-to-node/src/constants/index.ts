import { type TRANSACTION_TYPE } from '@decentralchain/ts-types';

export const TYPES: typeof TRANSACTION_TYPE = Object.freeze({
  GENESIS: 1 as const,
  PAYMENT: 2 as const,
  ISSUE: 3 as const,
  TRANSFER: 4 as const,
  REISSUE: 5 as const,
  BURN: 6 as const,
  EXCHANGE: 7 as const,
  LEASE: 8 as const,
  CANCEL_LEASE: 9 as const,
  ALIAS: 10 as const,
  MASS_TRANSFER: 11 as const,
  DATA: 12 as const,
  SET_SCRIPT: 13 as const,
  SPONSORSHIP: 14 as const,
  SET_ASSET_SCRIPT: 15 as const,
  INVOKE_SCRIPT: 16 as const,
  UPDATE_ASSET_INFO: 17 as const,
});

export const ALIAS = Object.freeze({
  AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz',
  MAX_ALIAS_LENGTH: 30,
  MIN_ALIAS_LENGTH: 4,
}) as {
  readonly AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz';
  readonly MAX_ALIAS_LENGTH: 30;
  readonly MIN_ALIAS_LENGTH: 4;
};
