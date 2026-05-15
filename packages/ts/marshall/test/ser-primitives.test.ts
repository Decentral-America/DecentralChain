import { byteToAddressOrAlias, P_BOOLEAN, P_BYTE, P_INT, P_SHORT } from '../src/parsePrimitives';
import {
  ADDRESS_OR_ALIAS,
  ALIAS,
  BASE58_STRING,
  BASE64_STRING,
  BOOL,
  BYTE,
  BYTES,
  COUNT,
  empty,
  INT,
  LEN,
  LONG,
  OPTION,
  one,
  SHORT,
  STRING,
  zero,
} from '../src/serializePrimitives';

const string = 'TestString';
const bytes = [84, 101, 115, 116, 83, 116, 114, 105, 110, 103];
const base58 = '5k1XmKDYbpxqAN';
const base64 = 'VGVzdFN0cmluZw==';

describe('Basic serialization', () => {
  it('LONG', () => {
    expect(LONG('1')).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1]));
    expect(LONG(1)).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1]));
    expect(LONG('18446744073709551615')).toEqual(
      Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255]),
    );
    // biome-ignore lint/correctness/noPrecisionLoss: intentional — testing that oversized numbers are rejected
    expect(() => LONG(18446744073709551615)).toThrow('is too big to be precisely represented');
  });

  it('BYTE', () => {
    expect(BYTE(1)).toEqual(Uint8Array.from([1]));
  });

  it('BYTES', () => {
    expect(BYTES([34, 192])).toEqual(Uint8Array.from([34, 192]));
  });

  it('STRING', () => {
    expect(STRING(string)).toEqual(Uint8Array.from(bytes));
  });

  it('INT', () => {
    expect(INT(1)).toEqual(Uint8Array.from([0, 0, 0, 1]));
    expect(INT(65535)).toEqual(Uint8Array.from([0, 0, 255, 255]));
    expect(INT(2 ** 32 - 1)).toEqual(Uint8Array.from([255, 255, 255, 255]));
  });

  it('SHORT', () => {
    expect(SHORT(1)).toEqual(Uint8Array.from([0, 1]));
    expect(SHORT(2 ** 16 - 1)).toEqual(Uint8Array.from([255, 255]));
    expect(() => SHORT(2 ** 16)).toThrow('SHORT value out of range');
    expect(() => SHORT(-1)).toThrow('SHORT value out of range');
  });

  it('BOOL', () => {
    expect(BOOL(false)).toEqual(zero);
    expect(BOOL(true)).toEqual(one);
  });

  it('OPTION', () => {
    expect(OPTION(BOOL)(null)).toEqual(Uint8Array.from([0]));
    expect(OPTION(BOOL)(false)).toEqual(Uint8Array.from([1, 0]));
  });

  it('COUNT', () => {
    expect(COUNT(BYTE)((x: boolean) => BOOL(x))([true, false, true])).toEqual(
      Uint8Array.from([3, 1, 0, 1]),
    );
  });

  it('LEN', () => {
    expect(LEN(BYTE)(BYTES)([1, 2, 3, 4])).toEqual(Uint8Array.from([4, 1, 2, 3, 4]));
  });

  it('BASE58_STRING', () => {
    expect(BASE58_STRING(base58)).toEqual(Uint8Array.from(bytes));
  });

  it('BASE64_STRING', () => {
    expect(BASE64_STRING(base64)).toEqual(Uint8Array.from(bytes));
  });

  it('ALIAS', () => {
    const alias = 'alias:W:example';
    expect(byteToAddressOrAlias(ADDRESS_OR_ALIAS(alias)).value).toEqual(alias);
  });

  it('STRING with null/undefined returns empty', () => {
    expect(STRING(null)).toEqual(empty);
    expect(STRING(undefined)).toEqual(empty);
    expect(STRING('')).toEqual(empty);
  });

  it('ALIAS throws on invalid network byte', () => {
    expect(() => ALIAS('alias:WW:test')).toThrow('Invalid network byte in alias');
  });

  it('ALIAS throws on empty alias body', () => {
    expect(() => ALIAS('alias:W:')).toThrow('Invalid alias body');
  });
});

describe('Base58 validation', () => {
  it('should decode empty string to empty Uint8Array', () => {
    expect(BASE58_STRING('')).toEqual(new Uint8Array(0));
  });

  it('should decode single "1" to single zero byte (leading zero representation)', () => {
    // In Base58, '1' represents a leading 0x00 byte - critical for address checksums
    const result = BASE58_STRING('1');
    expect(result).toEqual(new Uint8Array([0]));
  });

  it('should reject invalid Base58 characters that could cause address confusion', () => {
    // These characters are excluded from Base58 to prevent visual ambiguity
    // Critical for financial addresses where typos can mean lost funds
    expect(() => BASE58_STRING('O')).toThrow('There is no character "O" in the Base58 sequence');
    expect(() => BASE58_STRING('l')).toThrow('There is no character "l" in the Base58 sequence');
    expect(() => BASE58_STRING('0')).toThrow('There is no character "0" in the Base58 sequence');
    expect(() => BASE58_STRING('I')).toThrow('There is no character "I" in the Base58 sequence');
  });

  it('should correctly handle multiple leading zeros in addresses', () => {
    // Multiple leading '1's encode multiple 0x00 bytes
    // Important for certain address formats
    const result = BASE58_STRING('111');
    expect(result).toEqual(new Uint8Array([0, 0, 0]));
  });
});

describe('LONG serialization - financial precision boundaries', () => {
  it('should handle maximum safe JavaScript integer', () => {
    const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991
    const bytes = LONG(maxSafe);
    expect(bytes.length).toBe(8);
    expect(bytes).toEqual(Uint8Array.from([0, 31, 255, 255, 255, 255, 255, 255]));
  });

  it('should handle string representation for amounts exceeding JS precision', () => {
    // Maximum DCC amount: 10 billion with 8 decimals = 1000000000_00000000
    const largeTxAmount = '1000000000000000000';
    const bytes = LONG(largeTxAmount);
    expect(bytes.length).toBe(8);
  });

  it('should reject numbers exceeding JS safe integer precision', () => {
    // Numbers > 2^53-1 lose precision as JS numbers - must use strings
    const unsafeNumber = 2 ** 53;
    expect(() => LONG(unsafeNumber)).toThrow('too big to be precisely represented');
  });

  it('should handle zero amount correctly', () => {
    expect(LONG(0)).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]));
    expect(LONG('0')).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]));
  });

  it('should handle negative amounts (for certain tx types)', () => {
    // Negative values use two's complement
    const bytes = LONG(-1);
    expect(bytes).toEqual(Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255]));
  });
});

describe('Serializer overflow protection - financial safety', () => {
  it('BYTE should reject values above 255', () => {
    expect(() => BYTE(256)).toThrow('BYTE value out of range');
  });

  it('BYTE should reject negative values', () => {
    expect(() => BYTE(-1)).toThrow('BYTE value out of range');
  });

  it('BYTE should reject non-integer values', () => {
    expect(() => BYTE(1.5)).toThrow('BYTE value out of range');
  });

  it('INT should reject values above 2^32 - 1', () => {
    expect(() => INT(4294967296)).toThrow('INT value out of range');
  });

  it('INT should reject negative values', () => {
    expect(() => INT(-1)).toThrow('INT value out of range');
  });

  it('INT should accept maximum valid value', () => {
    expect(INT(4294967295)).toEqual(Uint8Array.from([255, 255, 255, 255]));
  });

  it('SHORT should accept maximum valid value', () => {
    expect(SHORT(65535)).toEqual(Uint8Array.from([255, 255]));
  });
});

describe('Parser buffer underflow protection', () => {
  it('P_BYTE should throw on empty buffer', () => {
    expect(() => P_BYTE(new Uint8Array(0))).toThrow('buffer underflow');
  });

  it('P_SHORT should throw on truncated buffer', () => {
    expect(() => P_SHORT(new Uint8Array([1]))).toThrow('buffer underflow');
  });

  it('P_INT should throw on truncated buffer', () => {
    expect(() => P_INT(new Uint8Array([1, 2]))).toThrow('buffer underflow');
  });

  it('P_BOOLEAN should reject invalid boolean byte', () => {
    expect(() => P_BOOLEAN(new Uint8Array([2]))).toThrow('invalid boolean byte');
    expect(() => P_BOOLEAN(new Uint8Array([255]))).toThrow('invalid boolean byte');
  });

  it('P_BOOLEAN should accept valid boolean bytes', () => {
    expect(P_BOOLEAN(new Uint8Array([0])).value).toBe(false);
    expect(P_BOOLEAN(new Uint8Array([1])).value).toBe(true);
  });
});
