/**
 * @module parse-json-bignumber
 *
 * Safe JSON parser and stringifier that preserves precision for large numbers.
 * Numbers exceeding 15 significant digits are returned as strings (default mode)
 * or converted via a custom `parse` function (e.g. to BigNumber instances).
 *
 * Based on Douglas Crockford's JSON2 parser with BigNumber safe-handling extensions.
 */

/**
 * Configuration options for the JSON parser/stringifier factory.
 *
 * @typeParam T - The type used to represent large numbers (e.g. `BigNumber`).
 */
export interface IOptions<T> {
  /** When `true`, throws a `SyntaxError` on duplicate object keys. Default: `false`. */
  readonly strict?: boolean;
  /** Convert a numeric string to `T`. Called for every JSON number when provided. */
  readonly parse?: (value: string) => T;
  /** Convert a `T` value back to its numeric string representation. */
  readonly stringify?: (value: T) => string;
  /** Type guard — returns `true` when `value` is an instance of `T`. */
  readonly isInstance?: (value: unknown) => value is T;
}

/**
 * The result of calling {@link create} — a matched pair of `parse` and `stringify`
 * that safely handle large numbers.
 */
export interface JsonHandler {
  /** Parse a JSON string, preserving large-number precision. */
  readonly parse: (
    source: string,
    reviver?: (this: Record<string, unknown>, key: string, value: unknown) => unknown,
  ) => unknown;

  /** Stringify a value to JSON, preserving large-number precision. */
  readonly stringify: (
    value: unknown,
    replacer?:
      | ((this: Record<string, unknown>, key: string, value: unknown) => unknown)
      | string[]
      | null,
    space?: number | string,
  ) => string;
}

/**
 * Create a JSON parser/stringifier that safely handles large numbers.
 *
 * @typeParam T - The type used to represent large numbers. Defaults to `unknown`.
 * @param options - Optional configuration for custom number handling.
 * @returns An object with `parse` and `stringify` methods.
 *
 * @example
 * ```ts
 * // Default mode — large numbers become strings
 * const { parse, stringify } = create();
 * parse('{"amount": 9999999999999999}');
 * // => { amount: "9999999999999999" }
 * ```
 *
 * @example
 * ```ts
 * import BigNumber from 'bignumber.js';
 *
 * const { parse, stringify } = create({
 *   parse: (s) => new BigNumber(s),
 *   stringify: (bn) => bn.toFixed(),
 *   isInstance: (v): v is BigNumber => BigNumber.isBigNumber(v),
 * });
 * ```
 */
function create<T = unknown>(options?: IOptions<T>): JsonHandler {
  'use strict';

  const _options = {
    strict: false,
  };

  if (options != null) {
    if (options.strict === true) {
      _options.strict = true;
    }
  }

  let at: number; // The index of the current character
  let ch: string; // The current character
  const escapee: Readonly<Record<string, string>> = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  };

  let text: string;

  /**
   * Return current character with widened type.
   * After `next()` mutates `ch`, TypeScript's control-flow narrowing
   * may still see the pre-mutation type. This helper breaks the narrowing.
   */
  const peek = (): string => ch;

  const error = (m: string): never => {
    const err = new SyntaxError(m);
    Object.assign(err, { at, text });
    throw err;
  };

  const next = (c?: string): string => {
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }

    ch = text.charAt(at);
    at += 1;
    return ch;
  };

  const number = (): number | string | T => {
    let numStr = '';

    if (ch === '-') {
      numStr = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9') {
      numStr += ch;
      next();
    }
    if (ch === '.') {
      numStr += '.';
      while (next() && peek() >= '0' && peek() <= '9') {
        numStr += ch;
      }
    }
    if (ch === 'e' || ch === 'E') {
      numStr += ch;
      next();
      if (peek() === '-' || peek() === '+') {
        numStr += ch;
        next();
      }
      while (ch >= '0' && ch <= '9') {
        numStr += ch;
        next();
      }
    }

    const num = +numStr;

    if (options?.parse) {
      return options.parse(numStr);
    }

    if (!isFinite(num)) {
      return error('Bad number');
    }

    if (numStr.length > 15) {
      return numStr;
    }

    return num;
  };

  const string = (): string => {
    let hex: number;
    let i: number;
    let str = '';
    let uffff: number;

    if (ch === '"') {
      while (next()) {
        if (peek() === '"') {
          next();
          return str;
        }
        if (peek() === '\\') {
          next();
          if (peek() === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            str += String.fromCharCode(uffff);
          } else {
            const escaped = escapee[ch];
            if (typeof escaped === 'string') {
              str += escaped;
            } else {
              break;
            }
          }
        } else {
          str += ch;
        }
      }
    }
    return error('Bad string');
  };

  const white = (): void => {
    while (ch && ch <= ' ') {
      next();
    }
  };

  const word = (): boolean | null => {
    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;
      default:
        return error("Unexpected '" + ch + "'");
    }
  };

  // Forward declaration — assigned after `object` and `array` are defined.
  // eslint-disable-next-line prefer-const -- must use `let` for forward reference; assigned once after dependents
  let value: () => unknown;

  const array = (): unknown[] => {
    const arr: unknown[] = [];

    if (ch === '[') {
      next('[');
      white();
      if (peek() === ']') {
        next(']');
        return arr;
      }
      while (peek()) {
        arr.push(value());
        white();
        if (peek() === ']') {
          next(']');
          return arr;
        }
        next(',');
        white();
      }
    }
    return error('Bad array');
  };

  const object = (): Record<string, unknown> => {
    let key: string;
    const obj: Record<string, unknown> = {};

    if (ch === '{') {
      next('{');
      white();
      if (peek() === '}') {
        next('}');
        return obj;
      }
      while (peek()) {
        key = string();
        white();
        next(':');
        if (_options.strict && Object.hasOwnProperty.call(obj, key)) {
          error('Duplicate key "' + key + '"');
        }
        obj[key] = value();
        white();
        if (peek() === '}') {
          next('}');
          return obj;
        }
        next(',');
        white();
      }
    }
    return error('Bad object');
  };

  value = (): unknown => {
    white();
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '-':
        return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  };

  // ── Stringify ────────────────────────────────────────────────────

  /* eslint-disable no-control-regex, no-misleading-character-class -- JSON spec requires matching these control/surrogate characters */
  const rxEscapable =
    /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  /* eslint-enable no-control-regex, no-misleading-character-class */

  let gap: string;
  let indent: string;

  const meta: Readonly<Record<string, string>> = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\',
  };

  let rep:
    | ((this: Record<string, unknown>, key: string, value: unknown) => unknown)
    | string[]
    | undefined;

  function quote(s: string): string {
    rxEscapable.lastIndex = 0;
    return rxEscapable.test(s)
      ? '"' +
          s.replace(rxEscapable, (a) => {
            const c = meta[a];
            return typeof c === 'string'
              ? c
              : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          }) +
          '"'
      : '"' + s + '"';
  }

  function str(key: string, holder: Record<string, unknown>): string | undefined {
    let i: number;
    let k: string;
    let v: string | undefined;
    let length: number;
    const mind = gap;
    let partial: string[];
    let val: unknown = holder[key];

    const isBigNumber = options?.isInstance?.(val) ?? false;

    // Check for NaN and Infinity on BigNumber-like values
    if (isBigNumber) {
      const finiteCheck = val as { isFinite?: () => boolean };
      if (typeof finiteCheck.isFinite === 'function' && !finiteCheck.isFinite()) {
        val = null;
      }
    }

    // If the value is a BigNumber, use the custom stringify
    if (isBigNumber && options?.stringify) {
      val = options.stringify(val as T);
    } else if (
      val != null &&
      typeof val === 'object' &&
      typeof (val as Record<string, unknown>)['toJSON'] === 'function'
    ) {
      val = (val as { toJSON: (key: string) => unknown }).toJSON(key);
    }

    // If we were called with a replacer function, call it
    if (typeof rep === 'function') {
      val = rep.call(holder, key, val);
    }

    // What happens next depends on the value's type.
    switch (typeof val) {
      case 'string':
        return isBigNumber ? val : quote(val);

      case 'number':
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(val) ? String(val) : 'null';

      case 'boolean':
        return String(val);

      case 'object':
        // typeof null is "object", so watch out for that case.
        if (!val) {
          return 'null';
        }

        // Make an array to hold the partial results of stringifying this object value.
        gap += indent;
        partial = [];

        // Is the value an array?
        if (Object.prototype.toString.apply(val) === '[object Array]') {
          length = (val as unknown[]).length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(String(i), val as Record<string, unknown>) ?? 'null';
          }

          v =
            partial.length === 0
              ? '[]'
              : gap
                ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.
        if (rep && typeof rep === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            const repItem = rep[i];
            if (typeof repItem === 'string') {
              k = repItem;
              v = str(k, val as Record<string, unknown>);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        } else {
          // Otherwise, iterate through all of the keys in the object.
          for (k in val as Record<string, unknown>) {
            if (Object.prototype.hasOwnProperty.call(val, k)) {
              v = str(k, val as Record<string, unknown>);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.
        v =
          partial.length === 0
            ? '{}'
            : gap
              ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
              : '{' + partial.join(',') + '}';
        gap = mind;
        return v;

      default:
        return undefined;
    }
  }

  const stringify: JsonHandler['stringify'] = (
    val: unknown,
    replacer?:
      | ((this: Record<string, unknown>, key: string, value: unknown) => unknown)
      | string[]
      | null,
    space?: number | string,
  ): string => {
    let i: number;
    gap = '';
    indent = '';

    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
      for (i = 0; i < space; i += 1) {
        indent += ' ';
      }
    } else if (typeof space === 'string') {
      indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer ?? undefined;
    if (
      replacer &&
      typeof replacer !== 'function' &&
      (typeof replacer !== 'object' || typeof replacer.length !== 'number')
    ) {
      throw new Error('JSON.stringify');
    }

    // Make a fake root object containing our value under the key of "".
    // Return the result of stringifying the value.
    return str('', { '': val }) ?? '';
  };

  const parse: JsonHandler['parse'] = (
    source: string,
    reviver?: (this: Record<string, unknown>, key: string, value: unknown) => unknown,
  ): unknown => {
    text = source;
    at = 0;
    ch = ' ';

    const result = value();
    white();
    if (ch) {
      error('Syntax error');
    }

    if (typeof reviver === 'function') {
      const walk = (holder: Record<string, unknown>, key: string): unknown => {
        const val = holder[key];
        if (val && typeof val === 'object') {
          for (const k of Object.keys(val as Record<string, unknown>)) {
            const walked = walk(val as Record<string, unknown>, k);
            if (walked !== undefined) {
              (val as Record<string, unknown>)[k] = walked;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete (val as Record<string, unknown>)[k];
            }
          }
        }
        return reviver.call(holder, key, val);
      };
      return walk({ '': result }, '');
    }

    return result;
  };

  return { parse, stringify };
}

export default create;
export { create };
