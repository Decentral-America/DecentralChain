import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it } from 'vitest';
import create, { type IOptions } from '../src/parse-json-bignumber.js';

const options: IOptions<BigNumber> = {
  strict: false,
  parse: (long: string): BigNumber => new BigNumber(long),
  stringify: (long: BigNumber): string => long.toFixed(),
  isInstance: (some: unknown): some is BigNumber =>
    some != null && (some instanceof BigNumber || BigNumber.isBigNumber(some)),
};

const strictOptions: IOptions<BigNumber> = {
  strict: true,
  parse: (long: string): BigNumber => new BigNumber(long),
  stringify: (long: BigNumber): string => long.toFixed(),
  isInstance: (some: unknown): some is BigNumber =>
    some != null && (some instanceof BigNumber || BigNumber.isBigNumber(some)),
};

describe('lib', () => {
  // =========================================================================
  // PARSE — default mode (no options)
  // =========================================================================
  describe('parse', () => {
    let parse: ReturnType<typeof create>['parse'];
    beforeEach(() => {
      parse = create().parse;
    });

    // --- Primitives ---
    it('without big num', () => {
      const json = '{"a": 123}';
      expect(parse(json)).toEqual({ a: 123 });
    });

    it('parses null', () => {
      expect(parse('null')).toBeNull();
    });

    it('parses true', () => {
      expect(parse('true')).toBe(true);
    });

    it('parses false', () => {
      expect(parse('false')).toBe(false);
    });

    it('parses a plain string', () => {
      expect(parse('"hello"')).toBe('hello');
    });

    it('parses zero', () => {
      expect(parse('0')).toBe(0);
    });

    it('parses negative number', () => {
      expect(parse('-42')).toBe(-42);
    });

    it('parses floating point number', () => {
      expect(parse('3.14')).toBe(3.14);
    });

    it('parses number with exponent', () => {
      expect(parse('1e10')).toBe(1e10);
    });

    it('parses number with negative exponent', () => {
      expect(parse('5E-3')).toBe(5e-3);
    });

    it('parses number with positive exponent sign', () => {
      expect(parse('2e+4')).toBe(2e4);
    });

    // --- Big number boundary (>15 digits becomes string) ---
    it('keeps 15-digit number as number', () => {
      expect(parse('123456789012345')).toBe(123456789012345);
    });

    it('converts 16-digit number to string', () => {
      expect(parse('1234567890123456')).toBe('1234567890123456');
    });

    it('with big number', () => {
      const json = '{"a": 12312312312321321312312312312312321321312312312312312321321312}';
      expect(parse(json)).toEqual({
        a: '12312312312321321312312312312312321321312312312312312321321312',
      });
    });

    it('preserves MAX_SAFE_INTEGER exactly', () => {
      expect(parse('9007199254740991')).toBe('9007199254740991');
    });

    it('preserves negative big number as string', () => {
      expect(parse('-1234567890123456')).toBe('-1234567890123456');
    });

    // --- Structures ---
    it('parses empty object', () => {
      expect(parse('{}')).toEqual({});
    });

    it('parses empty array', () => {
      expect(parse('[]')).toEqual([]);
    });

    it('parses nested objects', () => {
      const json = '{"a": {"b": {"c": 1}}}';
      expect(parse(json)).toEqual({ a: { b: { c: 1 } } });
    });

    it('parses nested arrays', () => {
      expect(parse('[[1, 2], [3, 4]]')).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('parses array with mixed types', () => {
      const json = '[1, "two", true, null, {"a": 3}]';
      expect(parse(json)).toEqual([1, 'two', true, null, { a: 3 }]);
    });

    it('parses object with multiple big numbers', () => {
      const json = '{"amount": 9999999999999999, "fee": 1234567890123456}';
      const result = parse(json) as Record<string, unknown>;
      expect(result.amount).toBe('9999999999999999');
      expect(result.fee).toBe('1234567890123456');
    });

    it('parses big number inside array', () => {
      const json = '[9999999999999999]';
      expect(parse(json)).toEqual(['9999999999999999']);
    });

    it('parses deeply nested big number', () => {
      const json = '{"tx": {"inner": {"amount": 9999999999999999}}}';
      expect(parse(json)).toEqual({
        tx: { inner: { amount: '9999999999999999' } },
      });
    });

    // --- String escapes ---
    it('parses string with escape sequences', () => {
      expect(parse('"line1\\nline2"')).toBe('line1\nline2');
    });

    it('parses string with tab escape', () => {
      expect(parse('"col1\\tcol2"')).toBe('col1\tcol2');
    });

    it('parses string with backslash', () => {
      expect(parse('"path\\\\to"')).toBe('path\\to');
    });

    it('parses string with forward slash escape', () => {
      expect(parse('"a\\/b"')).toBe('a/b');
    });

    it('parses string with unicode escape', () => {
      expect(parse('"\\u0041"')).toBe('A');
    });

    it('parses string with quote escape', () => {
      expect(parse('"say \\"hi\\""')).toBe('say "hi"');
    });

    // --- Whitespace tolerance ---
    it('handles extra whitespace', () => {
      const json = '  {  "a"  :  1  }  ';
      expect(parse(json)).toEqual({ a: 1 });
    });

    it('handles newlines and tabs in whitespace', () => {
      const json = '{\n\t"a":\t1\n}';
      expect(parse(json)).toEqual({ a: 1 });
    });

    // --- Reviver ---
    it('supports reviver function', () => {
      const json = '{"a": 1, "b": 2}';
      const result = parse(json, (_key, value) =>
        typeof value === 'number' ? (value as number) * 10 : value,
      );
      expect(result).toEqual({ a: 10, b: 20 });
    });

    // --- Error cases ---
    it('throws on invalid JSON', () => {
      expect(() => parse('{')).toThrow();
    });

    it('throws on trailing comma in object', () => {
      expect(() => parse('{"a": 1,}')).toThrow();
    });

    it('throws on trailing comma in array', () => {
      expect(() => parse('[1,]')).toThrow();
    });

    it('throws on trailing garbage', () => {
      expect(() => parse('123abc')).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => parse('')).toThrow();
    });

    it('throws on single quote strings', () => {
      expect(() => parse("{'a': 1}")).toThrow();
    });
  });

  // =========================================================================
  // PARSE — BigNumber mode (with options)
  // =========================================================================
  describe('parse to bigNum', () => {
    let parse: ReturnType<typeof create>['parse'];
    beforeEach(() => {
      parse = create(options).parse;
    });

    it('with big number', () => {
      const json = '{"a": 12312312312321321312312312312312321321312312312312312321321312}';
      expect(parse(json)).toEqual({
        a: new BigNumber('12312312312321321312312312312312321321312312312312312321321312'),
      });
    });

    it('parses small number as BigNumber too', () => {
      const json = '{"a": 42}';
      const result = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(result.a)).toBe(true);
      expect((result.a as BigNumber).toNumber()).toBe(42);
    });

    it('parses negative big number', () => {
      const json = '{"a": -9999999999999999999}';
      const result = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(result.a)).toBe(true);
      expect((result.a as BigNumber).toFixed()).toBe('-9999999999999999999');
    });

    it('parses float as BigNumber', () => {
      const json = '{"a": 3.14}';
      const result = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(result.a)).toBe(true);
      expect((result.a as BigNumber).toNumber()).toBe(3.14);
    });

    it('parses array of big numbers', () => {
      const json = '[99999999999999999999, 88888888888888888888]';
      const result = parse(json) as BigNumber[];
      expect(BigNumber.isBigNumber(result[0])).toBe(true);
      expect(BigNumber.isBigNumber(result[1])).toBe(true);
      expect(result[0]?.toFixed()).toBe('99999999999999999999');
      expect(result[1]?.toFixed()).toBe('88888888888888888888');
    });
  });

  // =========================================================================
  // PARSE — strict mode (duplicate key detection)
  // =========================================================================
  describe('parse strict mode', () => {
    it('throws on duplicate keys in strict mode', () => {
      const parse = create(strictOptions).parse;
      const json = '{"a": 1, "a": 2}';
      expect(() => parse(json)).toThrow();
    });

    it('allows duplicate keys in non-strict mode', () => {
      const parse = create(options).parse;
      const json = '{"a": 1, "a": 2}';
      const result = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(result.a)).toBe(true);
      expect((result.a as BigNumber).toNumber()).toBe(2);
    });

    it('allows duplicate keys with default (no options)', () => {
      const parse = create().parse;
      const json = '{"a": 1, "a": 2}';
      expect(parse(json)).toEqual({ a: 2 });
    });
  });

  // =========================================================================
  // STRINGIFY — default mode (no options)
  // =========================================================================
  describe('stringify', () => {
    let stringify: ReturnType<typeof create>['stringify'];
    beforeEach(() => {
      stringify = create().stringify;
    });

    // --- Primitives ---
    it('stringifies a number', () => {
      expect(stringify(42)).toBe('42');
    });

    it('stringifies a string', () => {
      expect(stringify('hello')).toBe('"hello"');
    });

    it('stringifies true', () => {
      expect(stringify(true)).toBe('true');
    });

    it('stringifies false', () => {
      expect(stringify(false)).toBe('false');
    });

    it('stringifies null', () => {
      expect(stringify(null)).toBe('null');
    });

    // --- Strings with special chars ---
    it('stringify with quote', () => {
      expect(stringify({ a: '"' })).toBe('{"a":"\\""}');
    });

    it('stringifies string with newline', () => {
      expect(stringify({ a: 'line1\nline2' })).toBe('{"a":"line1\\nline2"}');
    });

    it('stringifies string with tab', () => {
      expect(stringify({ a: 'a\tb' })).toBe('{"a":"a\\tb"}');
    });

    it('stringifies string with backslash', () => {
      expect(stringify({ a: 'a\\b' })).toBe('{"a":"a\\\\b"}');
    });

    // --- Objects with toJSON ---
    it('stringify with standard toJson', () => {
      const date = new Date();
      expect(stringify({ a: date })).toBe(`{"a":"${date.toJSON()}"}`);
    });

    // --- BigNumber without options (uses native toJSON) ---
    it('with big number (small)', () => {
      const data = { a: new BigNumber(123) };
      const result = stringify(data);
      expect(result).toBe(JSON.stringify({ a: data.a }));
    });

    it('with big number (large)', () => {
      const data = {
        a: new BigNumber('99999999999999999999999999999999999999999999999999999999.99999999999999'),
      };
      const result = stringify(data);
      expect(result).toBe(JSON.stringify({ a: data.a }));
    });

    // --- Structures ---
    it('stringifies empty object', () => {
      expect(stringify({})).toBe('{}');
    });

    it('stringifies empty array', () => {
      expect(stringify([])).toBe('[]');
    });

    it('stringifies nested objects', () => {
      expect(stringify({ a: { b: 1 } })).toBe('{"a":{"b":1}}');
    });

    it('stringifies nested arrays', () => {
      expect(stringify([[1, 2], [3]])).toBe('[[1,2],[3]]');
    });

    it('stringifies mixed array', () => {
      expect(stringify([1, 'two', true, null])).toBe('[1,"two",true,null]');
    });

    it('stringifies object with multiple keys', () => {
      const result = stringify({ a: 1, b: 'x', c: true, d: null });
      expect(result).toBe('{"a":1,"b":"x","c":true,"d":null}');
    });

    // --- Non-finite numbers ---
    it('stringifies NaN as null', () => {
      expect(stringify({ a: NaN })).toBe('{"a":null}');
    });

    it('stringifies Infinity as null', () => {
      expect(stringify({ a: Infinity })).toBe('{"a":null}');
    });

    it('stringifies -Infinity as null', () => {
      expect(stringify({ a: -Infinity })).toBe('{"a":null}');
    });

    // --- Space / indentation ---
    it('stringifies with numeric space', () => {
      const result = stringify({ a: 1 }, null, 2);
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('stringifies with string space', () => {
      const result = stringify({ a: 1 }, null, '\t');
      expect(result).toBe('{\n\t"a": 1\n}');
    });

    it('stringifies array with indentation', () => {
      const result = stringify([1, 2], null, 2);
      expect(result).toBe('[\n  1,\n  2\n]');
    });

    // --- Replacer function ---
    it('uses replacer function', () => {
      const result = stringify({ a: 1, b: 2, c: 3 }, (_key: string, value: unknown) => {
        if (_key === 'b') return undefined;
        return value;
      });
      expect(JSON.parse(result)).toEqual({ a: 1, c: 3 });
    });

    // --- Replacer array ---
    it('uses replacer array to select keys', () => {
      const result = stringify({ a: 1, b: 2, c: 3 }, ['a', 'c']);
      expect(JSON.parse(result)).toEqual({ a: 1, c: 3 });
    });

    // --- Invalid replacer ---
    it('throws on invalid replacer', () => {
      expect(() => stringify({ a: 1 }, 42 as any)).toThrow();
    });
  });

  // =========================================================================
  // STRINGIFY — BigNumber mode (with options)
  // =========================================================================
  describe('stringify to big num', () => {
    let stringify: ReturnType<typeof create>['stringify'];
    beforeEach(() => {
      stringify = create(options).stringify;
    });

    it('stringify with quote', () => {
      expect(stringify({ a: '"' })).toBe('{"a":"\\""}');
    });

    it('stringify with standard toJson', () => {
      const date = new Date();
      expect(stringify({ a: date })).toBe(`{"a":"${date.toJSON()}"}`);
    });

    it('with small BigNumber', () => {
      const data = { a: new BigNumber(123) };
      expect(stringify(data)).toBe('{"a":123}');
    });

    it('with large BigNumber', () => {
      const data = {
        a: new BigNumber('9999999999999999999999999999999999.99999999999999'),
      };
      const result = stringify(data);
      expect(result).toBe('{"a":9999999999999999999999999999999999.99999999999999}');
    });

    it('with negative BigNumber', () => {
      const data = { a: new BigNumber('-99999999999999999999') };
      expect(stringify(data)).toBe('{"a":-99999999999999999999}');
    });

    it('with BigNumber zero', () => {
      const data = { a: new BigNumber(0) };
      expect(stringify(data)).toBe('{"a":0}');
    });

    it('with BigNumber NaN serializes as null', () => {
      const data = { a: new BigNumber(NaN) };
      expect(stringify(data)).toBe('{"a":null}');
    });

    it('with BigNumber Infinity serializes as null', () => {
      const data = { a: new BigNumber(Infinity) };
      expect(stringify(data)).toBe('{"a":null}');
    });

    it('with array of BigNumbers', () => {
      const data = [new BigNumber(1), new BigNumber('99999999999999999999')];
      const result = stringify(data);
      expect(result).toBe('[1,99999999999999999999]');
    });

    it('preserves BigNumber in nested object', () => {
      const data = {
        tx: { amount: new BigNumber('12345678901234567890') },
      };
      const result = stringify(data);
      expect(result).toBe('{"tx":{"amount":12345678901234567890}}');
    });

    it('with indentation preserves BigNumber values', () => {
      const data = { a: new BigNumber('99999999999999999999') };
      const result = stringify(data, null, 2);
      expect(result).toBe('{\n  "a": 99999999999999999999\n}');
    });
  });

  // =========================================================================
  // ROUND-TRIP — parse → stringify → parse integrity
  // =========================================================================
  describe('round-trip integrity', () => {
    it('round-trips simple object', () => {
      const { parse, stringify } = create();
      const json = '{"a":1,"b":"hello","c":true,"d":null}';
      expect(stringify(parse(json))).toBe(json);
    });

    it('round-trips big number (default mode)', () => {
      const { parse, stringify } = create();
      const json = '{"amount":"9999999999999999"}';
      expect(stringify(parse(json))).toBe(json);
    });

    it('round-trips big number (BigNumber mode)', () => {
      const { parse, stringify } = create(options);
      const json = '{"amount":9999999999999999}';
      const parsed = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(parsed.amount)).toBe(true);
      expect(stringify(parsed)).toBe(json);
    });

    it('round-trips nested structure with big numbers', () => {
      const { parse, stringify } = create(options);
      const json = '{"tx":{"sender":"abc","amount":12345678901234567890,"fee":100000}}';
      const parsed = parse(json);
      expect(stringify(parsed)).toBe(json);
    });

    it('round-trips array of mixed types', () => {
      const { parse, stringify } = create();
      const json = '[1,"two",true,null]';
      expect(stringify(parse(json))).toBe(json);
    });

    it('round-trips complex blockchain-like transaction', () => {
      const { parse, stringify } = create(options);
      const json =
        '{"type":4,"sender":"3N1xca","recipient":"3MsX2p","amount":10000000000000000,"fee":100000,"timestamp":1609459200000}';
      const parsed = parse(json) as Record<string, any>;
      expect(BigNumber.isBigNumber(parsed.amount)).toBe(true);
      expect(BigNumber.isBigNumber(parsed.fee)).toBe(true);
      expect(BigNumber.isBigNumber(parsed.timestamp)).toBe(true);
      expect(stringify(parsed)).toBe(json);
    });
  });

  // =========================================================================
  // FACTORY — create() isolation
  // =========================================================================
  describe('factory isolation', () => {
    it('separate instances do not share state', () => {
      const a = create();
      const b = create(options);

      const json = '{"x": 9999999999999999}';
      const resultA = a.parse(json) as Record<string, unknown>;
      const resultB = b.parse(json) as Record<string, unknown>;

      // default mode: string
      expect(typeof resultA.x).toBe('string');
      // BigNumber mode: BigNumber
      expect(BigNumber.isBigNumber(resultB.x)).toBe(true);
    });

    it('create() returns both parse and stringify', () => {
      const instance = create();
      expect(typeof instance.parse).toBe('function');
      expect(typeof instance.stringify).toBe('function');
    });
  });

  // =========================================================================
  // INPUT VALIDATION — edge cases and type errors
  // =========================================================================
  describe('input validation', () => {
    it('handles whitespace-only input as error', () => {
      const { parse } = create();
      expect(() => parse('   ')).toThrow();
    });

    it('handles deeply nested structures', () => {
      const { parse } = create();
      const json = '{"a":{"b":{"c":{"d":{"e":1}}}}}';
      expect(parse(json)).toEqual({ a: { b: { c: { d: { e: 1 } } } } });
    });

    it('handles empty string values', () => {
      const { parse } = create();
      expect(parse('{"a":""}')).toEqual({ a: '' });
    });

    it('handles string with only whitespace chars', () => {
      const { parse } = create();
      expect(parse('{"a":" "}')).toEqual({ a: ' ' });
    });

    it('throws on bare decimal point (3.)', () => {
      const { parse } = create();
      expect(() => parse('3.')).toThrow();
    });

    it('throws on decimal point without trailing digits (3.e5)', () => {
      const { parse } = create();
      expect(() => parse('3.e5')).toThrow();
    });

    it('throws on malformed unicode escape (\\u00GG)', () => {
      const { parse } = create();
      expect(() => parse('"\\u00GG"')).toThrow();
    });

    it('throws on short unicode escape (\\u00)', () => {
      const { parse } = create();
      expect(() => parse('"\\u00"')).toThrow();
    });
  });

  // =========================================================================
  // STRINGIFY — BigNumber NaN/Infinity with replacer (regression)
  // =========================================================================
  describe('stringify replacer + BigNumber edge cases', () => {
    it('replacer receives null for BigNumber NaN', () => {
      const { stringify } = create(options);
      const data = { a: new BigNumber(NaN) };
      const calls: unknown[] = [];
      stringify(data, (_key: string, value: unknown) => {
        if (_key === 'a') calls.push(value);
        return value;
      });
      expect(calls[0]).toBeNull();
    });

    it('replacer can transform BigNumber Infinity null to custom value', () => {
      const { stringify } = create(options);
      const data = { a: new BigNumber(Infinity) };
      const result = stringify(data, (_key: string, value: unknown) => {
        if (value === null && _key === 'a') return 0;
        return value;
      });
      expect(result).toBe('{"a":0}');
    });
  });

  // =========================================================================
  // SECURITY — enterprise hardening tests
  // =========================================================================
  describe('security hardening', () => {
    // --- __proto__ pollution prevention (CRITICAL) ---
    describe('__proto__ key handling', () => {
      it('preserves __proto__ as own property, no prototype pollution', () => {
        const { parse } = create();
        const result = parse('{"__proto__": {"polluted": true}}') as Record<string, unknown>;
        // The parsed object must have __proto__ as an own property
        expect(Object.hasOwn(result, '__proto__')).toBe(true);
        // And the global Object.prototype must NOT be polluted
        expect(({} as any).polluted).toBeUndefined();
      });

      it('parsed objects have null prototype', () => {
        const { parse } = create();
        const result = parse('{"a": 1}') as Record<string, unknown>;
        expect(Object.getPrototypeOf(result)).toBeNull();
      });

      it('nested parsed objects also have null prototype', () => {
        const { parse } = create();
        const result = parse('{"a": {"b": 1}}') as Record<string, unknown>;
        expect(Object.getPrototypeOf(result)).toBeNull();
        expect(Object.getPrototypeOf(result.a)).toBeNull();
      });

      it('constructor key works on null-prototype object', () => {
        const { parse } = create();
        const result = parse('{"constructor": "safe"}') as Record<string, unknown>;
        expect(result.constructor).toBe('safe');
      });

      it('prototype key works on null-prototype object', () => {
        const { parse } = create();
        const result = parse('{"prototype": 123}') as Record<string, unknown>;
        expect(result.prototype).toBe(123);
      });
    });

    // --- Exponent notation big-number protection (CRITICAL) ---
    describe('exponent notation precision', () => {
      it('returns string for 1e16 (unsafe integer)', () => {
        const { parse } = create();
        expect(parse('1e16')).toBe('1e16');
      });

      it('returns string for 9.1e15 (unsafe integer)', () => {
        const { parse } = create();
        expect(parse('9.1e15')).toBe('9.1e15');
      });

      it('returns number for 1e2 (safe integer)', () => {
        const { parse } = create();
        expect(parse('1e2')).toBe(100);
      });

      it('returns number for 1e10 (safe integer)', () => {
        const { parse } = create();
        expect(parse('1e10')).toBe(1e10);
      });

      it('returns string for 1e16 in BigNumber mode too', () => {
        const { parse } = create(options);
        const result = parse('1e16');
        expect(BigNumber.isBigNumber(result)).toBe(true);
      });
    });

    // --- Leading zeros rejection (CRITICAL) ---
    describe('leading zeros', () => {
      it('rejects "01"', () => {
        const { parse } = create();
        expect(() => parse('01')).toThrow(/Leading zeros/);
      });

      it('rejects "007"', () => {
        const { parse } = create();
        expect(() => parse('007')).toThrow(/Leading zeros/);
      });

      it('rejects "00"', () => {
        const { parse } = create();
        expect(() => parse('00')).toThrow(/Leading zeros/);
      });

      it('rejects "-01"', () => {
        const { parse } = create();
        expect(() => parse('-01')).toThrow(/Leading zeros/);
      });

      it('allows "0" (single zero)', () => {
        const { parse } = create();
        expect(parse('0')).toBe(0);
      });

      it('allows "0.5" (zero before decimal)', () => {
        const { parse } = create();
        expect(parse('0.5')).toBe(0.5);
      });

      it('rejects leading zeros in BigNumber mode too', () => {
        const { parse } = create(options);
        expect(() => parse('007')).toThrow(/Leading zeros/);
      });
    });

    // --- Malformed numbers not forwarded to options.parse (CRITICAL) ---
    describe('number validation before options.parse', () => {
      it('does not call options.parse for Infinity-producing strings', () => {
        let called = false;
        const { parse } = create({
          parse: (s: string) => {
            called = true;
            return s;
          },
        });
        expect(() => parse('1e999')).toThrow(/Bad number/);
        expect(called).toBe(false);
      });
    });

    // --- Error data leak prevention (CRITICAL) ---
    describe('error context window', () => {
      it('error does not contain full source text', () => {
        const { parse } = create();
        const longJson = `{"a": ${'1'.repeat(1000)}}bad`;
        try {
          parse(longJson);
          expect.fail('should have thrown');
        } catch (e: any) {
          // err.context should be a short window, not the full source
          expect(e.context).toBeDefined();
          expect(e.context.length).toBeLessThanOrEqual(40);
          // err.text should NOT exist
          expect(e.text).toBeUndefined();
        }
      });

      it('error includes position information', () => {
        const { parse } = create();
        try {
          parse('{"a": bad}');
          expect.fail('should have thrown');
        } catch (e: any) {
          expect(e.at).toBeDefined();
          expect(typeof e.at).toBe('number');
        }
      });
    });

    // --- Recursion depth limit (HIGH) ---
    describe('nesting depth limit', () => {
      it('rejects deeply nested arrays (>512)', () => {
        const { parse } = create();
        const deep = `${'['.repeat(600)}1${']'.repeat(600)}`;
        expect(() => parse(deep)).toThrow(/Nesting too deep/);
      });

      it('rejects deeply nested objects (>512)', () => {
        const { parse } = create();
        let json = '';
        for (let i = 0; i < 600; i++) json += '{"a":';
        json += '1';
        for (let i = 0; i < 600; i++) json += '}';
        expect(() => parse(json)).toThrow(/Nesting too deep/);
      });

      it('allows nesting up to 512', () => {
        const { parse } = create();
        const deep = `${'['.repeat(512)}1${']'.repeat(512)}`;
        expect(() => parse(deep)).not.toThrow();
      });
    });

    // --- Space parameter capping (HIGH) ---
    describe('space parameter cap', () => {
      it('caps numeric space at 10', () => {
        const { stringify } = create();
        const result = stringify({ a: 1 }, null, 999999);
        const expected = stringify({ a: 1 }, null, 10);
        expect(result).toBe(expected);
      });

      it('caps string space at 10 characters', () => {
        const { stringify } = create();
        const result = stringify({ a: 1 }, null, 'x'.repeat(100));
        const expected = stringify({ a: 1 }, null, 'x'.repeat(10));
        expect(result).toBe(expected);
      });

      it('handles zero space', () => {
        const { stringify } = create();
        const result = stringify({ a: 1 }, null, 0);
        expect(result).toBe('{"a":1}');
      });

      it('handles negative space', () => {
        const { stringify } = create();
        const result = stringify({ a: 1 }, null, -5);
        expect(result).toBe('{"a":1}');
      });
    });

    // --- Circular reference detection (HIGH) ---
    describe('circular reference detection', () => {
      it('throws TypeError on circular object', () => {
        const { stringify } = create();
        const obj: any = { a: 1 };
        obj.self = obj;
        expect(() => stringify(obj)).toThrow(TypeError);
        expect(() => stringify(obj)).toThrow(/circular/i);
      });

      it('throws TypeError on circular array', () => {
        const { stringify } = create();
        const arr: any[] = [1, 2];
        arr.push(arr);
        expect(() => stringify(arr)).toThrow(TypeError);
      });

      it('throws TypeError on deeply nested circular reference', () => {
        const { stringify } = create();
        const a: any = {};
        const b: any = { a };
        a.b = b;
        expect(() => stringify(a)).toThrow(TypeError);
      });

      it('allows DAG (same object in multiple positions)', () => {
        const { stringify } = create();
        const shared = { x: 1 };
        const obj = { a: shared, b: shared };
        expect(() => stringify(obj)).not.toThrow();
        expect(stringify(obj)).toBe('{"a":{"x":1},"b":{"x":1}}');
      });

      it('allows same array in multiple positions', () => {
        const { stringify } = create();
        const shared = [1, 2];
        const obj = { a: shared, b: shared };
        expect(() => stringify(obj)).not.toThrow();
        expect(stringify(obj)).toBe('{"a":[1,2],"b":[1,2]}');
      });
    });

    // --- Negative number threshold fix (HIGH) ---
    describe('negative number significant digit counting', () => {
      it('returns -123456789012345 as number (15 sig digits, safe)', () => {
        const { parse } = create();
        expect(parse('-123456789012345')).toBe(-123456789012345);
      });

      it('returns -1234567890123456 as string (16 sig digits)', () => {
        const { parse } = create();
        expect(parse('-1234567890123456')).toBe('-1234567890123456');
      });

      it('does not count decimal point in threshold', () => {
        const { parse } = create();
        // "99999999999999.9" has 15 significant digits → safe as number
        expect(parse('99999999999999.9')).toBe(99999999999999.9);
      });
    });

    // --- Unescaped control characters (MEDIUM) ---
    describe('control character rejection', () => {
      it('rejects unescaped tab in string', () => {
        const { parse } = create();
        expect(() => parse('"hello\tworld"')).toThrow(/control character/i);
      });

      it('rejects unescaped newline in string', () => {
        const { parse } = create();
        expect(() => parse('"hello\nworld"')).toThrow(/control character/i);
      });

      it('rejects null byte in string', () => {
        const { parse } = create();
        expect(() => parse('"hello\0world"')).toThrow(/control character/i);
      });

      it('allows escaped control characters in string', () => {
        const { parse } = create();
        expect(parse('"hello\\nworld"')).toBe('hello\nworld');
        expect(parse('"hello\\tworld"')).toBe('hello\tworld');
      });
    });

    // --- stringify(undefined) behavior ---
    describe('stringify edge cases', () => {
      it('stringify(undefined) returns empty string', () => {
        const { stringify } = create();
        expect(stringify(undefined)).toBe('');
      });

      it('stringify a function returns empty string', () => {
        const { stringify } = create();
        expect(stringify(() => {})).toBe('');
      });

      it('stringifies undefined object values by omitting them', () => {
        const { stringify } = create();
        const result = stringify({ a: 1, b: undefined, c: 3 });
        expect(result).toBe('{"a":1,"c":3}');
      });
    });

    // --- Re-entrancy safety (CRITICAL) ---
    describe('re-entrancy safety', () => {
      it('parse() from within a reviver does not corrupt outer parse state', () => {
        const instance = create();
        const json = '{"a": 1, "b": 2}';
        const result = instance.parse(json, (_key, value) => {
          // Re-entrant parse inside the reviver
          if (_key === 'a') {
            return instance.parse('{"nested": 99}');
          }
          return value;
        }) as Record<string, unknown>;
        // Reviver replaced "a" with the re-entrant parse result
        expect(result.a).toEqual({ nested: 99 });
        // "b" should still be intact from the original parse
        expect(result.b).toBe(2);
      });

      it('stringify() from within a replacer does not corrupt outer stringify state', () => {
        const instance = create();
        const data = { a: 1, b: { c: 2 } };
        let innerResult = '';
        const result = instance.stringify(data, (_key, value) => {
          // Re-entrant stringify inside the replacer
          if (_key === 'a') {
            innerResult = instance.stringify({ inner: 'call' });
            return value;
          }
          return value;
        });
        expect(JSON.parse(result)).toEqual({ a: 1, b: { c: 2 } });
        expect(innerResult).toBe('{"inner":"call"}');
      });

      it('stringify() with indentation from within a replacer preserves outer indentation', () => {
        const instance = create();
        const data = { a: 1, b: 2 };
        let innerResult = '';
        const result = instance.stringify(
          data,
          (_key, value) => {
            if (_key === 'a') {
              // Inner call uses different indentation
              innerResult = instance.stringify({ x: 1 }, null, 4);
              return value;
            }
            return value;
          },
          2,
        );
        expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
        expect(innerResult).toBe('{\n    "x": 1\n}');
      });

      it('stringify() from within a BigNumber replacer preserves BigNumber handling', () => {
        const instance = create(options);
        const data = { a: new BigNumber('99999999999999999999'), b: new BigNumber(42) };
        let innerResult = '';
        const result = instance.stringify(data, (_key, value) => {
          if (_key === 'a') {
            innerResult = instance.stringify({ z: new BigNumber(100) });
          }
          return value;
        });
        expect(result).toBe('{"a":99999999999999999999,"b":42}');
        expect(innerResult).toBe('{"z":100}');
      });
    });

    // --- Replacer + BigNumber value transformation (CRITICAL) ---
    describe('replacer transforming BigNumber values', () => {
      it('replacer returning a different string quotes it (prevents invalid JSON)', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42) };
        const result = stringify(data, (_key, value) => {
          if (_key === 'a') return 'hello';
          return value;
        });
        // Must produce valid JSON — "hello" must be quoted
        expect(result).toBe('{"a":"hello"}');
        expect(() => JSON.parse(result)).not.toThrow();
      });

      it('replacer returning same string preserves raw number output', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42) };
        const result = stringify(data, (_key, value) => {
          // Return the stringified BigNumber value unchanged
          return value;
        });
        // The BigNumber should still appear as a raw number
        expect(result).toBe('{"a":42}');
      });

      it('replacer returning a number for BigNumber produces valid JSON', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42) };
        const result = stringify(data, (_key, value) => {
          if (_key === 'a') return 0;
          return value;
        });
        expect(result).toBe('{"a":0}');
        expect(() => JSON.parse(result)).not.toThrow();
      });

      it('replacer returning boolean for BigNumber produces valid JSON', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42) };
        const result = stringify(data, (_key, value) => {
          if (_key === 'a') return true;
          return value;
        });
        expect(result).toBe('{"a":true}');
        expect(() => JSON.parse(result)).not.toThrow();
      });

      it('replacer returning null for BigNumber produces valid JSON', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42) };
        const result = stringify(data, (_key, value) => {
          if (_key === 'a') return null;
          return value;
        });
        expect(result).toBe('{"a":null}');
        expect(() => JSON.parse(result)).not.toThrow();
      });

      it('replacer returning undefined for BigNumber omits the key', () => {
        const { stringify } = create(options);
        const data = { a: new BigNumber(42), b: 1 };
        const result = stringify(data, (_key, value) => {
          if (_key === 'a') return undefined;
          return value;
        });
        expect(result).toBe('{"b":1}');
      });
    });
  });
});
