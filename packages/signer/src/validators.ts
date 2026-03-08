import { base58Decode, verifyAddress } from '@decentralchain/ts-lib-crypto';

/**
 * Maximum safe integer for blockchain Long values (signed 64-bit).
 * JavaScript's Number.MAX_SAFE_INTEGER (2^53-1) is the practical ceiling
 * for numeric values; string amounts can represent up to Long.MAX_VALUE.
 */
const MAX_SAFE_LONG = '9223372036854775807'; // 2^63 - 1
/** Maximum transfers in a single mass-transfer tx (protocol limit). */
export const MAX_MASS_TRANSFER_COUNT = 100;

const TX_DEFAULTS = {
  MAX_ATTACHMENT: 140,
  ALIAS: {
    AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz',
    MAX_ALIAS_LENGTH: 30,
    MIN_ALIAS_LENGTH: 4,
  },
} as const;

export const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export const validatePipe =
  (...args: Array<(value: unknown) => boolean>) =>
  (value: unknown): boolean => {
    for (const cb of args) {
      if (!cb(value)) return false;
    }
    return true;
  };

export const isRequired = (required: boolean) => (value: unknown) => !required || value != null;

export const isString = (value: unknown): value is string =>
  typeof value === 'string' || value instanceof String;

export const isNumber = (value: unknown): value is number =>
  (typeof value === 'number' || value instanceof Number) && !Number.isNaN(Number(value));

/**
 * Validates that a value is number-like (can be coerced to a finite number).
 * Accepts 0 as valid. Rejects NaN, Infinity, -Infinity, null, undefined.
 */
export const isNumberLike = (value: unknown): boolean => {
  if (value == null) return false;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && (!!value || value === 0 || value === '0');
};

export const isBoolean = (value: unknown): value is boolean =>
  value != null && (typeof value === 'boolean' || value instanceof Boolean);

/**
 * Validates that a value is a positive number-like amount suitable for blockchain transactions.
 * Rejects: negative, zero, NaN, Infinity, values exceeding Long.MAX_VALUE (2^63-1).
 * Accepts string representations for BigInt-scale amounts (e.g. "9007199254740993").
 */
export const isPositiveAmount = (value: unknown): boolean => {
  if (!isNumberLike(value)) return false;
  const str = String(value).trim();
  // Reject negative / zero
  if (str.startsWith('-') || Number(str) === 0) return false;
  // For string amounts, compare against Long.MAX_VALUE to catch overflow
  if (typeof value === 'string' && /^\d+$/.test(str)) {
    if (str.length > MAX_SAFE_LONG.length) return false;
    if (str.length === MAX_SAFE_LONG.length && str > MAX_SAFE_LONG) return false;
  }
  // For numeric values, check MAX_SAFE_INTEGER
  if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) return false;
  return true;
};

/**
 * Validates that a value is a non-negative number-like amount (amount >= 0).
 * Used for fees that can legally be zero (e.g. sponsorship removal).
 */
export const isNonNegativeAmount = (value: unknown): boolean => {
  if (!isNumberLike(value)) return false;
  const num = Number(value);
  if (num < 0) return false;
  // Overflow guard
  const str = String(value).trim();
  if (typeof value === 'string' && /^\d+$/.test(str)) {
    if (str.length > MAX_SAFE_LONG.length) return false;
    if (str.length === MAX_SAFE_LONG.length && str > MAX_SAFE_LONG) return false;
  }
  if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) return false;
  return true;
};

export const orEq =
  <T>(list: T[]) =>
  (item: unknown): boolean =>
    list.includes(item as T);

export const exception = (msg: string): never => {
  throw new Error(msg);
};

export const validateBySchema =
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
export const isAttachment = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (!isString(value)) return false;
  // Protocol limit: 140 bytes. UTF-8 can be up to 4 bytes per char,
  // so a quick char-length pre-check avoids expensive encoding for obvious passes.
  const str = value as string;
  if (str.length > TX_DEFAULTS.MAX_ATTACHMENT) {
    // Exact byte count for strings that might be borderline
    const byteLength = new TextEncoder().encode(str).length;
    return byteLength <= TX_DEFAULTS.MAX_ATTACHMENT;
  }
  return true;
};

const validateChars = (chars: string) => (value: string) =>
  value.split('').every((char: string) => chars.includes(char));

export const isValidAliasName = (value: unknown): boolean => {
  if (!isString(value)) return false;
  if (!validateChars(TX_DEFAULTS.ALIAS.AVAILABLE_CHARS)(value as string)) return false;
  const len = (value as string).length;
  return len >= TX_DEFAULTS.ALIAS.MIN_ALIAS_LENGTH && len <= TX_DEFAULTS.ALIAS.MAX_ALIAS_LENGTH;
};

export const ASSETS = {
  NAME_MIN_BYTES: 4,
  NAME_MAX_BYTES: 16,
  DESCRIPTION_MAX_BYTES: 1000,
} as const;

/**
 * Validates a base64-encoded script field.
 * Must be null/undefined or a string matching `base64:<valid-base64-content>`.
 */
export const isBase64 = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (!isString(value)) return false;
  const str = value as string;
  if (!str.startsWith('base64:')) return false;
  const content = str.slice(7); // Strip 'base64:' prefix
  if (content.length === 0) return true; // Empty script (null script) is valid
  // RFC 4648 base64 character set + padding
  return /^[A-Za-z0-9+/]+=*$/.test(content);
};

const validateType: Record<string, (value: unknown) => boolean> = {
  integer: isNumberLike,
  boolean: isBoolean,
  string: isString,
  binary: isBase64,
};

export const isValidDataPair = (data: { type: string; value: unknown }): boolean =>
  !!(validateType[data.type] && validateType[data.type]?.(data.value));

export const isValidData = (item: unknown): boolean => {
  if (item == null) return false;
  const record = item as Record<string, unknown>;
  if (!isString(record.key) || !(record.key as string)) return false;
  return isValidDataPair(record as { type: string; value: unknown });
};

export const isPublicKey = (value: unknown): boolean => {
  if (!isString(value)) return false;
  try {
    return base58Decode(value as string).length === 32;
  } catch {
    return false;
  }
};

export const isValidAssetName = (value: unknown): boolean => {
  if (!isString(value)) return false;
  const len = (value as string).length;
  return len >= ASSETS.NAME_MIN_BYTES && len <= ASSETS.NAME_MAX_BYTES;
};

export const isValidAssetDescription = (value: unknown): boolean => {
  if (!isString(value)) return false;
  return (value as string).length <= ASSETS.DESCRIPTION_MAX_BYTES;
};

/**
 * Validates an asset ID. Valid values:
 * - null / undefined / '' / 'DCC' → native token
 * - Base58-encoded 32-byte string → token asset ID
 */
export const isAssetId = (value: unknown): boolean => {
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
  // parts[0] = 'alias', parts[1] = chain byte, parts[2] = name
  const chainByte = parts[1];
  const name = parts[2];
  // Chain byte must be exactly 1 printable ASCII character
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

export const isRecipient = (value: unknown): boolean => {
  if (!isString(value)) return false;
  if (isAlias(value as string)) return isValidAlias(value as string);
  return isValidAddress(value);
};

const orderScheme: Record<string, (value: unknown) => boolean> = {
  orderType: orEq(['sell', 'buy']),
  senderPublicKey: isPublicKey,
  matcherPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2, 3]),
  assetPair: validatePipe(
    isRequired(true),
    (v) => isAssetId((v as Record<string, unknown>)?.amountAsset),
    (v) => isAssetId((v as Record<string, unknown>)?.priceAsset),
  ),
  price: isNumberLike,
  amount: isNumberLike,
  matcherFee: isNumberLike,
  expiration: isNumberLike,
  timestamp: isNumber,
  proofs: (value) => (isArray(value) ? true : value === undefined),
};

const v12OrderScheme = {
  matcherFeeAssetId: (item: unknown): boolean =>
    item === undefined || item === null || item === 'DCC',
};

const v3OrderScheme = {
  matcherFeeAssetId: isAssetId,
};

export const noop = (): void => {};

const validateOrder = validateBySchema(orderScheme, noop);
const validateOrderV2 = validateBySchema(v12OrderScheme, noop);
const validateOrderV3 = validateBySchema(v3OrderScheme, noop);

export const orderValidator = (value: unknown): boolean => {
  try {
    const record = value as Record<string, unknown>;
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
