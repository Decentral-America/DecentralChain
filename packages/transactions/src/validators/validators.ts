import {
  base58Decode,
  base64Decode,
  blake2b,
  keccak,
  stringToBytes,
} from '@decentralchain/ts-lib-crypto';

const TX_DEFAULTS = {
  MAX_ATTACHMENT: 140,
  ALIAS: {
    AVAILABLE_CHARS: '-.0123456789@_abcdefghijklmnopqrstuvwxyz',
    MAX_ALIAS_LENGTH: 30,
    MIN_ALIAS_LENGTH: 4,
  },
};

const ASSETS = {
  NAME_MIN_BYTES: 4,
  NAME_MAX_BYTES: 16,
  DESCRIPTION_MAX_BYTES: 1000,
};

export const defaultValue = (value: unknown) => () => value;

export const nope = (value: unknown) => value;

export const pipe =
  // biome-ignore lint/suspicious/noExplicitAny: Generic pipeline combinator — callbacks have heterogeneous signatures that can't be unified under unknown due to contravariance
    (...args: Array<(value: any) => any>) =>
    (value: unknown) =>
      args.reduce((acc: unknown, cb) => cb(acc), value);

export const validatePipe =
  // biome-ignore lint/suspicious/noExplicitAny: Generic pipeline combinator — callbacks have heterogeneous signatures that can't be unified under unknown due to contravariance
    (...args: Array<(value: any) => any>) =>
    (value: unknown) => {
      let isValid = true;

      for (const cb of args) {
        isValid = !!cb(value);
        if (!isValid) {
          return false;
        }
      }

      return isValid;
    };

export const prop = (key: string | number) => (value: unknown) =>
  value ? (value as Record<string | number, unknown>)[key] : undefined;

/** Unbox Number/String wrapper objects to their primitive values. */
const unbox = (value: unknown): unknown =>
  value instanceof Number || value instanceof String ? value.valueOf() : value;

/**
 * Safely convert a value to BigInt for precision-safe integer validation.
 * Returns null if the value cannot be represented as a BigInt.
 */
const toBigInt = (value: unknown): bigint | null => {
  try {
    const v = unbox(value);
    if (typeof v === 'bigint') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || !Number.isInteger(v)) return null;
      return BigInt(v);
    }
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (/^-?\d+$/.test(trimmed)) return BigInt(trimmed);
    }
    return null;
  } catch {
    return null;
  }
};

export const lte = (ref: unknown) => (value: unknown) => {
  const bigRef = toBigInt(ref);
  const bigVal = toBigInt(value);
  if (bigRef !== null && bigVal !== null) return bigRef >= bigVal;
  return Number(ref) >= Number(value);
};

export const gte = (ref: unknown) => (value: unknown) => {
  const bigRef = toBigInt(ref);
  const bigVal = toBigInt(value);
  if (bigRef !== null && bigVal !== null) return bigRef <= bigVal;
  return Number(ref) <= Number(value);
};

export const ifElse =
  // biome-ignore lint/suspicious/noExplicitAny: Generic branching combinator — condition/branch callbacks have heterogeneous signatures that can't be unified under unknown due to contravariance
    (condition: (value: any) => any, a: (value: any) => any, b: (value: any) => any) =>
    (value: unknown) =>
      condition(value) ? a(value) : b(value);

export const isEq =
  <T>(reference: T) =>
  (value: unknown) => {
    switch (true) {
      case isNumber(value) && isNumber(reference): {
        const bigVal = toBigInt(value);
        const bigRef = toBigInt(reference);
        if (bigVal !== null && bigRef !== null) return bigVal === bigRef;
        return Number(value) === Number(reference);
      }
      case isString(value) && isString(reference):
        return String(reference) === String(value);
      case isBoolean(value) && isBoolean(reference):
        return Boolean(value) === Boolean(reference);
      default:
        return reference === value;
    }
  };

export const orEq = (referencesList: Array<unknown>) => (value: unknown) =>
  referencesList.some(isEq(value));

export const isRequired = (required: boolean) => (value: unknown) => !required || value != null;

export const isString = (value: unknown) => typeof value === 'string' || value instanceof String;

export const isNumber = (value: unknown) =>
  (typeof value === 'number' || value instanceof Number) &&
  !Number.isNaN(value instanceof Number ? value.valueOf() : value);

/**
 * Check if a value represents a valid, finite number.
 * Uses string analysis for large integer strings to avoid Number() precision loss.
 */
const isFiniteNumeric = (value: unknown): boolean => {
  const v = unbox(value);
  if (typeof v === 'number') return !Number.isNaN(v) && Number.isFinite(v);
  if (typeof v === 'bigint') return true;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return false;
    if (/^-?\d+$/.test(trimmed)) return true;
    const num = Number(trimmed);
    return !Number.isNaN(num) && Number.isFinite(num);
  }
  return false;
};

/**
 * Safely check if a numeric value is strictly positive (> 0)
 * without Number() precision loss for large integer strings.
 */
const isPositiveNumeric = (value: unknown): boolean => {
  const v = unbox(value);
  if (typeof v === 'number') return Number.isFinite(v) && v > 0;
  if (typeof v === 'bigint') return v > 0n;
  const big = toBigInt(v);
  if (big !== null) return big > 0n;
  if (typeof v === 'string') {
    const num = Number(v);
    return Number.isFinite(num) && num > 0;
  }
  return false;
};

/**
 * Safely check if a numeric value is non-negative (>= 0)
 * without Number() precision loss for large integer strings.
 */
const isNonNegativeNumeric = (value: unknown): boolean => {
  const v = unbox(value);
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0;
  if (typeof v === 'bigint') return v >= 0n;
  const big = toBigInt(v);
  if (big !== null) return big >= 0n;
  if (typeof v === 'string') {
    const num = Number(v);
    return Number.isFinite(num) && num >= 0;
  }
  return false;
};

export const isNumberLike = (value: unknown) =>
  value != null && isFiniteNumeric(value) && !!(value || value === 0);

export const isNaturalNumberLike = (value: unknown) => value != null && isPositiveNumeric(value);

export const isNaturalNumberOrZeroLike = (value: unknown) =>
  value != null && isNonNegativeNumeric(value);

export const isNaturalNumberOrNullLike = (value: unknown) =>
  isPositiveNumeric(value) || value === null;

export const isBoolean = (value: unknown) =>
  value != null && (typeof value === 'boolean' || value instanceof Boolean);

export const isByteArray = (value: unknown) => {
  if (!value) {
    return false;
  }

  const bytes = new Uint8Array(value as ArrayLike<number>);
  return (
    bytes.length === (value as ArrayLike<number>).length &&
    bytes.every((val, index) => isEq(val)((value as ArrayLike<number>)[index]))
  );
};

export const isArray = (value: unknown) => Array.isArray(value);

export const bytesLength = (length: number) => (value: unknown) => {
  try {
    return Uint8Array.from(value as ArrayLike<number>).length === length;
  } catch (_e) {
    return false;
  }
};

export const isBase58 = (value: unknown) => {
  try {
    base58Decode(value as string);
  } catch (_e) {
    return false;
  }

  return true;
};

export const isBase64 = (value: unknown) => {
  try {
    value = (value as string).replace(/^base64:/, '');
    base64Decode(value as string);
  } catch (_e) {
    return false;
  }

  return true;
};

export const isValidAddress = (address: unknown, network?: number) => {
  if (typeof address !== 'string' || !isBase58(address)) {
    return false;
  }

  const addressBytes = base58Decode(address);

  if (addressBytes[0] !== 1) {
    return false;
  }

  if (network != null && addressBytes[1] !== network) {
    return false;
  }

  const key = addressBytes.slice(0, 22);
  const check = addressBytes.slice(22, 26);
  const keyHash = keccak(blake2b(key)).slice(0, 4);

  for (let i = 0; i < 4; i++) {
    if (check[i] !== keyHash[i]) {
      return false;
    }
  }

  return true;
};

const validateChars = (chars: string) => (value: string) =>
  value.split('').every((char: string) => chars.includes(char));

export const isValidAliasName = ifElse(
  validateChars(TX_DEFAULTS.ALIAS.AVAILABLE_CHARS),
  pipe(
    prop('length'),
    validatePipe(lte(TX_DEFAULTS.ALIAS.MAX_ALIAS_LENGTH), gte(TX_DEFAULTS.ALIAS.MIN_ALIAS_LENGTH)),
  ),
  defaultValue(false),
);

export const isValidAlias = validatePipe(
  isString,
  pipe(
    (value: string) => value.split(':'),
    ifElse(
      (value: Array<string>) => value[0] !== 'alias' || value.length !== 3,
      defaultValue(false),
      pipe(prop(2), isValidAliasName),
    ),
  ),
);

export const isHash = validatePipe(
  isRequired(true),
  isBase58,
  pipe((value: string) => base58Decode(value), bytesLength(32)),
);

export const isPublicKey = isHash;

export const isPublicKeyForEthSuppTx = ifElse(
  orEq(['', null, undefined]),
  defaultValue(true),
  pipe(
    (value: string) => base58Decode(value),
    (value: Uint8Array) => {
      try {
        return Uint8Array.from(value).length === 32 || Uint8Array.from(value).length === 64;
      } catch (_e) {
        return false;
      }
    },
  ),
);

export const isDccOrAssetId = ifElse(orEq([null, undefined, 'DCC']), defaultValue(true), isHash);

export const isAssetId = isHash;

export const isAttachment = ifElse(
  orEq([null, undefined]),
  defaultValue(true),
  ifElse(
    // if valid Data Pair
    validatePipe(isArray, (data: unknown) =>
      (data as Array<{ type: keyof typeof validateType; value: unknown }>).every(isValidDataPair),
    ),
    defaultValue(true),
    // else if valid base58 or bytearray
    pipe(
      ifElse(isBase58, base58Decode, nope),
      ifElse(
        isByteArray,
        pipe(prop('length'), lte(TX_DEFAULTS.MAX_ATTACHMENT)),
        defaultValue(false),
      ),
    ),
  ),
);

const validateType = {
  integer: isNumberLike,
  boolean: isBoolean,
  string: isString,
  binary: isBase64,
  list: isArray,
};

export const isValidDataPair = (data: { type: keyof typeof validateType; value: unknown }) =>
  !!(validateType[data.type] && validateType[data.type](data.value));

export const isValidData = validatePipe(
  isRequired(true),
  pipe(
    prop('key'),
    validatePipe(isString, (key: string) => !!key),
  ),

  isValidDataPair,
);
export const isValidDeleteRequest = validatePipe(
  isRequired(true),
  pipe(
    prop('key'),
    validatePipe(isString, (key: unknown) => !!key),
  ),
  ({ type, value }: Record<string, unknown>) => type == null && value == null,
);

export const isValidAssetName = validatePipe(
  isRequired(true),
  isString,
  pipe(
    stringToBytes,
    prop('length'),
    ifElse(gte(ASSETS.NAME_MIN_BYTES), lte(ASSETS.NAME_MAX_BYTES), defaultValue(false)),
  ),
);

export const isValidAssetDescription = validatePipe(
  isRequired(false),
  defaultValue(true),
  pipe(stringToBytes, prop('length'), lte(ASSETS.DESCRIPTION_MAX_BYTES)),
);

export const exception = (msg: string) => {
  throw new Error(msg);
};

export const isRecipient = ifElse(isValidAddress, defaultValue(true), isValidAlias);

export const validateByShema =
  (
    // biome-ignore lint/suspicious/noExplicitAny: Schema validators have heterogeneous signatures per field that can't be unified under unknown due to contravariance
    shema: Record<string, (value: any) => any>,
    errorTpl: (key: string, value?: unknown) => string,
  ) =>
  (tx: Record<string, unknown>) => {
    Object.entries(shema).forEach(([key, cb]) => {
      const value = prop(key)(tx || {});
      if (!cb(value)) {
        exception(errorTpl(key, value));
      }
    });

    return true;
  };

export const getError = (key: string, _value: unknown) => {
  return `tx "${key}" has invalid data. Check tx data.`;
};
