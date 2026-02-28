import * as create from '../src/parse-json-bignumber';
import BigNumber from 'bignumber.js';


interface IOptions<T> {
    strict: boolean;
    parse: (long: string) => T;
    stringify: (long: T) => string;
    isInstance: (some: any) => some is T;
}

let options: IOptions<BigNumber> = {
    strict: false,
    parse: (long: string): BigNumber => new BigNumber(long),
    stringify: (long: BigNumber): string => long.toFixed(),
    isInstance: (some): some is BigNumber => some && (some instanceof BigNumber || BigNumber.isBigNumber(some))
};

let strictOptions: IOptions<BigNumber> = {
    strict: true,
    parse: (long: string): BigNumber => new BigNumber(long),
    stringify: (long: BigNumber): string => long.toFixed(),
    isInstance: (some): some is BigNumber => some && (some instanceof BigNumber || BigNumber.isBigNumber(some))
};

describe('lib', () => {

    // =========================================================================
    // PARSE — default mode (no options)
    // =========================================================================
    describe('parse', () => {

        let parse;
        beforeEach(() => {
            parse = create().parse;
        });

        // --- Primitives ---
        it('without big num', () => {
            const json = '{"a": 123}';
            expect(parse(json)).toEqual({a: 123});
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
            expect(parse('2e+4')).toBe(2e+4);
        });

        // --- Big number boundary (>15 digits becomes string) ---
        it('keeps 15-digit number as number', () => {
            // 15 chars exactly → stays a number
            expect(parse('123456789012345')).toBe(123456789012345);
        });

        it('converts 16-digit number to string', () => {
            // 16 chars → returned as string to preserve precision
            expect(parse('1234567890123456')).toBe('1234567890123456');
        });

        it('with big number', () => {
            const json = '{"a": 12312312312321321312312312312312321321312312312312312321321312}';
            expect(parse(json)).toEqual({a: '12312312312321321312312312312312321321312312312312312321321312'});
        });

        it('preserves MAX_SAFE_INTEGER exactly', () => {
            // 9007199254740991 is 16 digits → string
            expect(parse('9007199254740991')).toBe('9007199254740991');
        });

        it('preserves negative big number as string', () => {
            // negative sign + 16 digits = 17 chars
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
            expect(parse(json)).toEqual({a: {b: {c: 1}}});
        });

        it('parses nested arrays', () => {
            expect(parse('[[1, 2], [3, 4]]')).toEqual([[1, 2], [3, 4]]);
        });

        it('parses array with mixed types', () => {
            const json = '[1, "two", true, null, {"a": 3}]';
            expect(parse(json)).toEqual([1, "two", true, null, {a: 3}]);
        });

        it('parses object with multiple big numbers', () => {
            const json = '{"amount": 9999999999999999, "fee": 1234567890123456}';
            const result = parse(json);
            expect(result.amount).toBe('9999999999999999');
            expect(result.fee).toBe('1234567890123456');
        });

        it('parses big number inside array', () => {
            const json = '[9999999999999999]';
            expect(parse(json)).toEqual(['9999999999999999']);
        });

        it('parses deeply nested big number', () => {
            const json = '{"tx": {"inner": {"amount": 9999999999999999}}}';
            expect(parse(json)).toEqual({tx: {inner: {amount: '9999999999999999'}}});
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
            expect(parse(json)).toEqual({a: 1});
        });

        it('handles newlines and tabs in whitespace', () => {
            const json = '{\n\t"a":\t1\n}';
            expect(parse(json)).toEqual({a: 1});
        });

        // --- Reviver ---
        it('supports reviver function', () => {
            const json = '{"a": 1, "b": 2}';
            // reviver is called via .call(holder, key, value) so fn receives (key, value)
            const result = parse(json, function (key, value) {
                return typeof value === 'number' ? value * 10 : value;
            });
            expect(result).toEqual({a: 10, b: 20});
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

        let parse;
        beforeEach(() => {
            parse = create(options).parse;
        });

        it('with big number', () => {
            const json = '{"a": 12312312312321321312312312312312321321312312312312312321321312}';
            expect(parse(json)).toEqual({a: new BigNumber('12312312312321321312312312312312321321312312312312312321321312')});
        });

        it('parses small number as BigNumber too', () => {
            const json = '{"a": 42}';
            const result = parse(json);
            expect(BigNumber.isBigNumber(result.a)).toBe(true);
            expect(result.a.toNumber()).toBe(42);
        });

        it('parses negative big number', () => {
            const json = '{"a": -9999999999999999999}';
            const result = parse(json);
            expect(BigNumber.isBigNumber(result.a)).toBe(true);
            expect(result.a.toFixed()).toBe('-9999999999999999999');
        });

        it('parses float as BigNumber', () => {
            const json = '{"a": 3.14}';
            const result = parse(json);
            expect(BigNumber.isBigNumber(result.a)).toBe(true);
            expect(result.a.toNumber()).toBe(3.14);
        });

        it('parses array of big numbers', () => {
            const json = '[99999999999999999999, 88888888888888888888]';
            const result = parse(json);
            expect(BigNumber.isBigNumber(result[0])).toBe(true);
            expect(BigNumber.isBigNumber(result[1])).toBe(true);
            expect(result[0].toFixed()).toBe('99999999999999999999');
            expect(result[1].toFixed()).toBe('88888888888888888888');
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
            // last value wins
            const result = parse(json);
            expect(BigNumber.isBigNumber(result.a)).toBe(true);
            expect(result.a.toNumber()).toBe(2);
        });

        it('allows duplicate keys with default (no options)', () => {
            const parse = create().parse;
            const json = '{"a": 1, "a": 2}';
            expect(parse(json)).toEqual({a: 2});
        });
    });


    // =========================================================================
    // STRINGIFY — default mode (no options)
    // =========================================================================
    describe('stringify', () => {

        let stringify;
        beforeEach(() => {
            stringify = create().stringify;
        });

        // --- Primitives ---
        it('stringifies a number', () => {
            expect(stringify(42)).toBe('42');
        });

        it('stringifies a string', () => {
            expect(stringify("hello")).toBe('"hello"');
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
            expect(stringify({a: '"'})).toBe('{"a":"\\\""}');
        });

        it('stringifies string with newline', () => {
            expect(stringify({a: 'line1\nline2'})).toBe('{"a":"line1\\nline2"}');
        });

        it('stringifies string with tab', () => {
            expect(stringify({a: 'a\tb'})).toBe('{"a":"a\\tb"}');
        });

        it('stringifies string with backslash', () => {
            expect(stringify({a: 'a\\b'})).toBe('{"a":"a\\\\b"}');
        });

        // --- Objects with toJSON ---
        it('stringify with standard toJson', () => {
            let date = new Date();
            expect(stringify({a: date})).toBe(`{"a":"${date.toJSON()}"}`);
        });

        // --- BigNumber without options (uses native toJSON) ---
        it('with big number (small)', () => {
            const data = { a: new BigNumber(123) };
            const result = stringify(data);
            expect(result).toBe(JSON.stringify({a: data.a}));
        });

        it('with big number (large)', () => {
            const data = { a: new BigNumber('99999999999999999999999999999999999999999999999999999999.99999999999999') };
            const result = stringify(data);
            expect(result).toBe(JSON.stringify({a: data.a}));
        });

        // --- Structures ---
        it('stringifies empty object', () => {
            expect(stringify({})).toBe('{}');
        });

        it('stringifies empty array', () => {
            expect(stringify([])).toBe('[]');
        });

        it('stringifies nested objects', () => {
            expect(stringify({a: {b: 1}})).toBe('{"a":{"b":1}}');
        });

        it('stringifies nested arrays', () => {
            expect(stringify([[1, 2], [3]])).toBe('[[1,2],[3]]');
        });

        it('stringifies mixed array', () => {
            expect(stringify([1, "two", true, null])).toBe('[1,"two",true,null]');
        });

        it('stringifies object with multiple keys', () => {
            const result = stringify({a: 1, b: "x", c: true, d: null});
            expect(result).toBe('{"a":1,"b":"x","c":true,"d":null}');
        });

        // --- Non-finite numbers ---
        it('stringifies NaN as null', () => {
            expect(stringify({a: NaN})).toBe('{"a":null}');
        });

        it('stringifies Infinity as null', () => {
            expect(stringify({a: Infinity})).toBe('{"a":null}');
        });

        it('stringifies -Infinity as null', () => {
            expect(stringify({a: -Infinity})).toBe('{"a":null}');
        });

        // --- Space / indentation ---
        it('stringifies with numeric space', () => {
            const result = stringify({a: 1}, null, 2);
            expect(result).toBe('{\n  "a": 1\n}');
        });

        it('stringifies with string space', () => {
            const result = stringify({a: 1}, null, '\t');
            expect(result).toBe('{\n\t"a": 1\n}');
        });

        it('stringifies array with indentation', () => {
            const result = stringify([1, 2], null, 2);
            expect(result).toBe('[\n  1,\n  2\n]');
        });

        // --- Replacer function ---
        it('uses replacer function', () => {
            // replacer is called via .call(holder, key, value) so fn receives (key, value)
            const result = stringify({a: 1, b: 2, c: 3}, function (key, value) {
                if (key === 'b') return undefined;
                return value;
            });
            // 'b' should be excluded
            expect(JSON.parse(result)).toEqual({a: 1, c: 3});
        });

        // --- Replacer array ---
        it('uses replacer array to select keys', () => {
            const result = stringify({a: 1, b: 2, c: 3}, ['a', 'c']);
            expect(JSON.parse(result)).toEqual({a: 1, c: 3});
        });

        // --- Invalid replacer ---
        it('throws on invalid replacer', () => {
            expect(() => stringify({a: 1}, 42 as any)).toThrow();
        });
    });


    // =========================================================================
    // STRINGIFY — BigNumber mode (with options)
    // =========================================================================
    describe('stringify to big num', () => {

        let stringify;
        beforeEach(() => {
            stringify = create(options).stringify;
        });

        it('stringify with quote', () => {
            expect(stringify({a: '"'})).toBe('{"a":"\\\""}');
        });

        it('stringify with standard toJson', () => {
            let date = new Date();
            expect(stringify({a: date})).toBe(`{"a":"${date.toJSON()}"}`);
        });

        it('with small BigNumber', () => {
            const data = { a: new BigNumber(123) };
            expect(stringify(data)).toBe('{"a":123}');
        });

        it('with large BigNumber', () => {
            const data = { a: new BigNumber('9999999999999999999999999999999999.99999999999999') };
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

        it('with BigNumber NaN throws (known limitation — lib nullifies value but still calls stringify)', () => {
            const data = { a: new BigNumber(NaN) };
            // Known lib behavior: sets value=null for non-finite BigNumber,
            // but then still calls options.stringify(null) which crashes
            expect(() => stringify(data)).toThrow();
        });

        it('with BigNumber Infinity throws (known limitation)', () => {
            const data = { a: new BigNumber(Infinity) };
            expect(() => stringify(data)).toThrow();
        });

        it('with array of BigNumbers', () => {
            const data = [new BigNumber(1), new BigNumber('99999999999999999999')];
            const result = stringify(data);
            expect(result).toBe('[1,99999999999999999999]');
        });

        it('preserves BigNumber in nested object', () => {
            const data = { tx: { amount: new BigNumber('12345678901234567890') } };
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
            // big numbers become strings in default mode, so they round-trip as strings
            expect(stringify(parse(json))).toBe(json);
        });

        it('round-trips big number (BigNumber mode)', () => {
            const { parse, stringify } = create(options);
            const json = '{"amount":9999999999999999}';
            const parsed = parse(json);
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
            const json = '{"type":4,"sender":"3N1xca","recipient":"3MsX2p","amount":10000000000000000,"fee":100000,"timestamp":1609459200000}';
            const parsed = parse(json);
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
            const resultA = a.parse(json);
            const resultB = b.parse(json);

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

});
