import { base58Decode, verifyAddress } from '@decentralchain/ts-lib-crypto';
import { TRANSACTION_TYPE, type TransactionType } from '@decentralchain/ts-types';
import { type SignerOptions } from './types/index.js';

// ── Protocol Constants ───────────────────────────────────────────

/**
 * Maximum safe integer for blockchain Long values (signed 64-bit).
 * JavaScript's Number.MAX_SAFE_INTEGER (2^53-1) is the practical ceiling
 * for numeric values; string amounts can represent up to Long.MAX_VALUE.
 */
// biome-ignore lint/security/noSecrets: int64 boundary constant, not a secret
const MAX_SAFE_LONG = '9223372036854775807'; // 2^63 - 1

const TX_DEFAULTS = {
  ALIAS: {
    // biome-ignore lint/security/noSecrets: valid alias character set, not a secret
    AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz',
    MAX_ALIAS_LENGTH: 30,
    MIN_ALIAS_LENGTH: 4,
  },
  MAX_ATTACHMENT: 140,
} as const;

const ASSETS = {
  DESCRIPTION_MAX_BYTES: 1000,
  NAME_MAX_BYTES: 16,
  NAME_MIN_BYTES: 4,
} as const;

// ── Primitive Validators ─────────────────────────────────────────

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const validatePipe =
  (...args: Array<(value: unknown) => boolean>) =>
  (value: unknown): boolean => {
    for (const cb of args) {
      if (!cb(value)) return false;
    }
    return true;
  };

const isRequired = (required: boolean) => (value: unknown) => !required || value != null;

const isString = (value: unknown): value is string =>
  typeof value === 'string' || value instanceof String;

const isNumber = (value: unknown): value is number =>
  (typeof value === 'number' || value instanceof Number) && !Number.isNaN(Number(value));

/**
 * Validates that a value is number-like (can be coerced to a finite number).
 * Accepts 0 as valid. Rejects NaN, Infinity, -Infinity, null, undefined.
 */
const isNumberLike = (value: unknown): boolean => {
  if (value == null) return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && (!!value || value === 0 || value === '0');
};

const isBoolean = (value: unknown): value is boolean =>
  value != null && (typeof value === 'boolean' || value instanceof Boolean);

/**
 * Validates that a value is a positive number-like amount suitable for blockchain transactions.
 * Rejects: negative, zero, NaN, Infinity, values exceeding Long.MAX_VALUE (2^63-1).
 * Accepts string representations for BigInt-scale amounts (e.g. "9007199254740993").
 */
const isPositiveAmount = (value: unknown): boolean => {
  if (!isNumberLike(value)) return false;
  const str = String(value).trim();
  if (str.startsWith('-') || Number(str) === 0) return false;
  if (typeof value === 'string' && /^\d+$/.test(str)) {
    if (str.length > MAX_SAFE_LONG.length) return false;
    if (str.length === MAX_SAFE_LONG.length && str > MAX_SAFE_LONG) return false;
  }
  if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) return false;
  return true;
};

/**
 * Validates that a value is a non-negative number-like amount (amount >= 0).
 * Used for fees that can legally be zero (e.g. sponsorship removal).
 */
const isNonNegativeAmount = (value: unknown): boolean => {
  if (!isNumberLike(value)) return false;
  const num = Number(value);
  if (num < 0) return false;
  const str = String(value).trim();
  if (typeof value === 'string' && /^\d+$/.test(str)) {
    if (str.length > MAX_SAFE_LONG.length) return false;
    if (str.length === MAX_SAFE_LONG.length && str > MAX_SAFE_LONG) return false;
  }
  if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) return false;
  return true;
};

const orEq =
  <T>(list: ReadonlyArray<T>) =>
  (item: unknown): boolean =>
    list.includes(item as T);

const exception = (msg: string): never => {
  throw new Error(msg);
};

const validateBySchema =
  (schema: Record<string, (value: unknown) => boolean>, _errorTpl: unknown) =>
  (tx: Record<string, unknown>): boolean => {
    for (const [key, cb] of Object.entries(schema)) {
      const value = tx?.[key];
      if (!cb(value)) {
        exception(`Validation failed for field: ${key}`);
      }
    }
    return true;
  };

/**
 * Validates an attachment field. Must be null/undefined or a string within the
 * protocol maximum of 140 bytes.
 */
const isAttachment = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (!isString(value)) return false;
  const str = value as string;
  if (str.length > TX_DEFAULTS.MAX_ATTACHMENT) {
    const byteLength = new TextEncoder().encode(str).length;
    return byteLength <= TX_DEFAULTS.MAX_ATTACHMENT;
  }
  return true;
};

const validateChars = (chars: string) => (value: string) =>
  value.split('').every((char: string) => chars.includes(char));

const isValidAliasName = (value: unknown): boolean => {
  if (!isString(value)) return false;
  if (!validateChars(TX_DEFAULTS.ALIAS.AVAILABLE_CHARS)(value as string)) return false;
  const len = (value as string).length;
  return len >= TX_DEFAULTS.ALIAS.MIN_ALIAS_LENGTH && len <= TX_DEFAULTS.ALIAS.MAX_ALIAS_LENGTH;
};

/**
 * Validates a base64-encoded script field.
 * Must be null/undefined or a string matching `base64:<valid-base64-content>`.
 */
const isBase64 = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (!isString(value)) return false;
  const str = value as string;
  if (!str.startsWith('base64:')) return false;
  const content = str.slice(7);
  if (content.length === 0) return true;
  return /^[A-Za-z0-9+/]+=*$/.test(content);
};

const validateType: Record<string, (value: unknown) => boolean> = {
  binary: isBase64,
  boolean: isBoolean,
  integer: isNumberLike,
  string: isString,
};

const isValidDataPair = (data: { type: string; value: unknown }): boolean =>
  !!(validateType[data.type] && validateType[data.type]?.(data.value));

const isValidData = (item: unknown): boolean => {
  if (item == null) return false;
  const record = item as { key?: unknown; type: string; value: unknown };
  if (!isString(record.key) || !(record.key as string)) return false;
  return isValidDataPair(record as { type: string; value: unknown });
};

const isPublicKey = (value: unknown): boolean => {
  if (!isString(value)) return false;
  try {
    return base58Decode(value as string).length === 32;
  } catch {
    return false;
  }
};

const isValidAssetName = (value: unknown): boolean => {
  if (!isString(value)) return false;
  const len = (value as string).length;
  return len >= ASSETS.NAME_MIN_BYTES && len <= ASSETS.NAME_MAX_BYTES;
};

const isValidAssetDescription = (value: unknown): boolean => {
  if (!isString(value)) return false;
  return (value as string).length <= ASSETS.DESCRIPTION_MAX_BYTES;
};

/**
 * Validates an asset ID. Valid values:
 * - null / undefined / '' / 'DCC' → native token
 * - Base58-encoded 32-byte string → token asset ID
 */
const isAssetId = (value: unknown): boolean => {
  if (value === '' || value === null || value === undefined || value === 'DCC') return true;
  if (!isString(value)) return false;
  const str = (value as string).trim();
  if (str.length === 0) return true;
  try {
    const decoded = base58Decode(str);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

const isAlias = (value: string): boolean => value.startsWith('alias:');

/**
 * Validates a DecentralChain address using full Base58+checksum verification
 * via `@decentralchain/ts-lib-crypto`. Rejects malformed, wrong-length,
 * or invalid-checksum addresses.
 */
const isValidAddress = (value: unknown): boolean => {
  if (!isString(value)) return false;
  const str = (value as string).trim();
  if (str.length === 0) return false;
  try {
    return verifyAddress(str);
  } catch {
    return false;
  }
};

/**
 * Validates an alias recipient string. Format: `alias:<chainByte>:<name>`.
 * Chain byte must be a single printable ASCII character (network ID).
 */
const isValidAlias = (value: string): boolean => {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const chainByte = parts[1];
  const name = parts[2];
  if (
    !chainByte ||
    chainByte.length !== 1 ||
    chainByte.charCodeAt(0) < 33 ||
    chainByte.charCodeAt(0) > 126
  ) {
    return false;
  }
  return name != null ? isValidAliasName(name) : false;
};

const isRecipient = (value: unknown): boolean => {
  if (!isString(value)) return false;
  if (isAlias(value as string)) return isValidAlias(value as string);
  return isValidAddress(value);
};

const noop = (): void => {};

// ── Order Validation ─────────────────────────────────────────────

const orderScheme: Record<string, (value: unknown) => boolean> = {
  amount: isNumberLike,
  assetPair: validatePipe(
    isRequired(true),
    (v) => isAssetId((v as { amountAsset?: unknown }).amountAsset),
    (v) => isAssetId((v as { priceAsset?: unknown }).priceAsset),
  ),
  expiration: isNumberLike,
  matcherFee: isNumberLike,
  matcherPublicKey: isPublicKey,
  orderType: orEq(['sell', 'buy']),
  price: isNumberLike,
  proofs: (value) => (isArray(value) ? true : value === undefined),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  version: orEq([undefined, 1, 2, 3]),
};

const v12OrderScheme = {
  matcherFeeAssetId: (item: unknown): boolean =>
    item === undefined || item === null || item === 'DCC',
};

const v3OrderScheme = {
  matcherFeeAssetId: isAssetId,
};

const validateOrder = validateBySchema(orderScheme, noop);
const validateOrderV2 = validateBySchema(v12OrderScheme, noop);
const validateOrderV3 = validateBySchema(v3OrderScheme, noop);

const orderValidator = (value: unknown): boolean => {
  try {
    const record = value as { version?: unknown; [key: string]: unknown };
    validateOrder(record);
    if (record.version === 3) {
      validateOrderV3(record);
    } else {
      validateOrderV2(record);
    }
    return true;
  } catch {
    return false;
  }
};

// ── Transaction Validation ───────────────────────────────────────

const shouldValidate = (value: unknown): boolean => value !== undefined;

const validateOptional = (validator: (value: unknown) => boolean) => (value: unknown) =>
  shouldValidate(value) ? validator(value) : true;

type ValidatorFn = (
  scheme: Record<string, (value: unknown) => boolean>,
  method: string,
) => (args: Record<string, unknown>) => {
  isValid: boolean;
  transaction: unknown;
  method: string;
  invalidFields?: string[];
};

const validator: ValidatorFn = (scheme, method) => (transaction) => {
  const invalidFields: string[] = [];

  for (const [fieldName, validationScheme] of Object.entries(scheme)) {
    try {
      validateBySchema({ [fieldName]: validationScheme }, noop)(transaction);
    } catch {
      invalidFields.push(fieldName);
    }
  }

  return {
    invalidFields,
    isValid: invalidFields.length === 0,
    method,
    transaction,
  };
};

/**
 * Per-transaction-type allowed version numbers, aligned with
 * packages/transactions/src/validators/*. Transactions that only gained
 * protobuf support in version 2 or 3 do NOT support v1; sending a v1 tx of
 * those types would fail at the node with an invalid transaction error.
 * Keeping this map in sync with the transactions validators prevents the
 * signer from accepting a version that the transactions package rejects.
 *
 * GENESIS, PAYMENT, and ETHEREUM are not user-signable; they are omitted and
 * fall through to the [undefined, 1, 2, 3] default below.
 */
const TX_VERSION_CONSTRAINTS: Partial<Record<TransactionType, ReadonlyArray<number | undefined>>> =
  {
    [TRANSACTION_TYPE.ALIAS]: [undefined, 2, 3],
    [TRANSACTION_TYPE.BURN]: [undefined, 2, 3],
    [TRANSACTION_TYPE.CANCEL_LEASE]: [undefined, 2, 3],
    [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: [1],
    [TRANSACTION_TYPE.DATA]: [undefined, 1, 2],
    [TRANSACTION_TYPE.EXCHANGE]: [undefined, 1, 2, 3],
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: [undefined, 1, 2],
    [TRANSACTION_TYPE.ISSUE]: [undefined, 2, 3],
    [TRANSACTION_TYPE.LEASE]: [undefined, 2, 3],
    [TRANSACTION_TYPE.MASS_TRANSFER]: [undefined, 1, 2],
    [TRANSACTION_TYPE.REISSUE]: [undefined, 2, 3],
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: [undefined, 1, 2],
    [TRANSACTION_TYPE.SET_SCRIPT]: [undefined, 1, 2],
    [TRANSACTION_TYPE.SPONSORSHIP]: [undefined, 1, 2],
    [TRANSACTION_TYPE.TRANSFER]: [undefined, 2, 3],
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: [undefined, 1],
  };

const getCommonValidators = (transactionType: TransactionType) => {
  const allowedVersions: ReadonlyArray<number | undefined> = TX_VERSION_CONSTRAINTS[
    transactionType
  ] ?? [undefined, 1, 2, 3];
  return {
    fee: validateOptional(isNonNegativeAmount),
    proofs: validateOptional(isArray),
    senderPublicKey: validateOptional(isPublicKey),
    type: (value: unknown) => value === transactionType,
    version: validateOptional(orEq(allowedVersions)),
  };
};

const issueArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.ISSUE),
  chainId: validateOptional(isNumber),
  decimals: isNumber,
  description: validateOptional(isValidAssetDescription),
  name: isValidAssetName,
  quantity: isPositiveAmount,
  reissuable: validateOptional(isBoolean),
  script: validateOptional(isBase64),
};
const issueArgsValidator = validator(issueArgsScheme, 'issue');

const transferArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.TRANSFER),
  amount: isPositiveAmount,
  assetId: validateOptional(isAssetId),
  attachment: validateOptional(isAttachment),
  feeAssetId: validateOptional(isAssetId),
  recipient: isRecipient,
};
const transferArgsValidator = validator(transferArgsScheme, 'transfer');

const reissueArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.REISSUE),
  assetId: isAssetId,
  chainId: validateOptional(isNumber),
  quantity: isPositiveAmount,
  reissuable: isBoolean,
};
const reissueArgsValidator = validator(reissueArgsScheme, 'reissue');

const burnArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.BURN),
  amount: isPositiveAmount,
  assetId: isString,
  chainId: validateOptional(isNumber),
};
const burnArgsValidator = validator(burnArgsScheme, 'burn');

const leaseArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.LEASE),
  amount: isPositiveAmount,
  recipient: isRecipient,
};
const leaseArgsValidator = validator(leaseArgsScheme, 'lease');

const cancelLeaseArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.CANCEL_LEASE),
  chainId: validateOptional(isNumber),
  leaseId: isString,
};
const cancelLeaseArgsValidator = validator(cancelLeaseArgsScheme, 'cancel lease');

const aliasArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.ALIAS),
  alias: (value: unknown) => (typeof value === 'string' ? isValidAliasName(value) : false),
};
const aliasArgsValidator = validator(aliasArgsScheme, 'alias');

const massTransferArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.MASS_TRANSFER),
  assetId: validateOptional(isAssetId),
  attachment: validateOptional(isAttachment),
  transfers: validatePipe(
    isArray,
    (data) => {
      const arr = data as unknown[];
      return arr.length > 0 && arr.length <= 100;
    },
    (data) =>
      (data as Array<{ recipient?: unknown; amount?: unknown }>).every(
        (item) => item != null && isRecipient(item.recipient) && isPositiveAmount(item.amount),
      ),
  ),
};
const massTransferArgsValidator = validator(massTransferArgsScheme, 'mass transfer');

const dataArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.DATA),
  data: (data: unknown) => isArray(data) && (data as unknown[]).every((item) => isValidData(item)),
};
const dataArgsValidator = validator(dataArgsScheme, 'data');

const setScriptArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SET_SCRIPT),
  chainId: validateOptional(isNumber),
  script: isBase64,
};
const setScriptArgsValidator = validator(setScriptArgsScheme, 'set script');

const sponsorshipArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SPONSORSHIP),
  assetId: isString,
  minSponsoredAssetFee: (value: unknown) => value === null || isNonNegativeAmount(value),
};
const sponsorshipArgsValidator = validator(sponsorshipArgsScheme, 'sponsorship');

const exchangeArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.EXCHANGE),
  amount: isPositiveAmount,
  buyMatcherFee: isNonNegativeAmount,
  order1: validatePipe(isRequired(true), orderValidator),
  order2: validatePipe(isRequired(true), orderValidator),
  price: isPositiveAmount,
  sellMatcherFee: isNonNegativeAmount,
};
const exchangeArgsValidator = validator(exchangeArgsScheme, 'exchange');

const setAssetScriptArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.SET_ASSET_SCRIPT),
  assetId: isAssetId,
  chainId: validateOptional(isNumber),
  script: isBase64,
};
const setAssetScriptArgsValidator = validator(setAssetScriptArgsScheme, 'set asset script');

const invokeArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.INVOKE_SCRIPT),
  call: validateOptional(
    validatePipe(
      (v) => isString((v as { function?: unknown }).function),
      (v) => ((v as { function?: unknown }).function as string)?.length >= 0,
      (v) => isArray((v as { args?: unknown }).args),
    ),
  ),
  chainId: validateOptional(isNumber),
  dApp: isRecipient,
  feeAssetId: validateOptional(isAssetId),
  payment: validateOptional(
    validatePipe(isArray, (data) =>
      (data as Array<{ amount?: unknown; assetId?: unknown }>).every(
        (item) => isPositiveAmount(item.amount) && isAssetId(item.assetId),
      ),
    ),
  ),
};
const invokeArgsValidator = validator(invokeArgsScheme, 'invoke');

// UPDATE_ASSET_INFO: only version 1 exists in the protocol.
// Accept undefined (builder defaults to 1) or explicit 1 — reject 2/3
// to prevent submitting a non-existent tx version to the node.
const updateAssetInfoArgsScheme = {
  ...getCommonValidators(TRANSACTION_TYPE.UPDATE_ASSET_INFO),
  assetId: isString,
  chainId: validateOptional(isNumber),
  description: validateOptional(isValidAssetDescription),
  name: validateOptional(isValidAssetName),
  version: validateOptional(orEq([undefined, 1])),
};
const updateAssetInfoArgsValidator = validator(updateAssetInfoArgsScheme, 'update asset info');

// ── Public API (3 exports consumed by Signer.ts) ────────────────

export const argsValidators: Record<number, ReturnType<typeof validator>> = {
  [TRANSACTION_TYPE.ISSUE]: issueArgsValidator,
  [TRANSACTION_TYPE.TRANSFER]: transferArgsValidator,
  [TRANSACTION_TYPE.REISSUE]: reissueArgsValidator,
  [TRANSACTION_TYPE.BURN]: burnArgsValidator,
  [TRANSACTION_TYPE.LEASE]: leaseArgsValidator,
  [TRANSACTION_TYPE.CANCEL_LEASE]: cancelLeaseArgsValidator,
  [TRANSACTION_TYPE.ALIAS]: aliasArgsValidator,
  [TRANSACTION_TYPE.MASS_TRANSFER]: massTransferArgsValidator,
  [TRANSACTION_TYPE.DATA]: dataArgsValidator,
  [TRANSACTION_TYPE.SET_SCRIPT]: setScriptArgsValidator,
  [TRANSACTION_TYPE.SPONSORSHIP]: sponsorshipArgsValidator,
  [TRANSACTION_TYPE.EXCHANGE]: exchangeArgsValidator,
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: setAssetScriptArgsValidator,
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: invokeArgsValidator,
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: updateAssetInfoArgsValidator,
};

type SignerOptionsValidation = { isValid: boolean; invalidOptions: string[] };

export const validateSignerOptions = (options: Partial<SignerOptions>): SignerOptionsValidation => {
  const res: SignerOptionsValidation = {
    invalidOptions: [],
    isValid: true,
  };

  const isValidLogLevel = (level: unknown) =>
    ['verbose', 'production', 'error'].includes(String(level));

  if (!isString(options.NODE_URL)) {
    res.isValid = false;
    res.invalidOptions.push('NODE_URL');
  } else {
    try {
      const url = new URL(options.NODE_URL);
      if (!['http:', 'https:'].includes(url.protocol)) {
        res.isValid = false;
        res.invalidOptions.push('NODE_URL');
      }
    } catch {
      res.isValid = false;
      res.invalidOptions.push('NODE_URL');
    }
  }

  if (!validateOptional(isValidLogLevel)(options.LOG_LEVEL)) {
    res.isValid = false;
    res.invalidOptions.push('LOG_LEVEL');
  }

  return res;
};

export const validateProviderInterface = (
  provider: unknown,
): { isValid: boolean; invalidProperties: string[] } => {
  const isFunction = (value: unknown): boolean => typeof value === 'function';
  // Single cast: we immediately verify each field is a function before trusting it.
  const record = provider as Record<string, unknown>;

  const scheme: Record<string, (value: unknown) => boolean> = {
    connect: isFunction,
    login: isFunction,
    logout: isFunction,
    sign: isFunction,
    signMessage: isFunction,
    signOrder: isFunction,
    signTypedData: isFunction,
  };

  const invalidProperties: string[] = [];

  for (const [fieldName, fieldValidator] of Object.entries(scheme)) {
    if (!fieldValidator(record[fieldName])) {
      invalidProperties.push(fieldName);
    }
  }

  return {
    invalidProperties,
    isValid: invalidProperties.length === 0,
  };
};
