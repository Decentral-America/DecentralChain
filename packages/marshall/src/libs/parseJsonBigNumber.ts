/**
 * Safe JSON parse/stringify for BigNumber values.
 * Prevents precision loss for numbers longer than 15 digits by keeping them as strings.
 *
 * Originally based on parse-json-bignumber (MIT license).
 * Inlined to remove external dependency on third-party npm scope.
 */

// @ts-nocheck — inlined third-party library, original JS code not strict-TS compatible

interface Options {
  strict?: boolean
  parse?: (s: string) => any
  isInstance?: (v: any) => boolean
  stringify?: (v: any) => string
}

const create = function (options?: Options) {
  'use strict'

  const _options = {
    strict: false,
  }

  if (options !== undefined && options !== null) {
    if (options.strict === true) {
      _options.strict = true
    }
  }

  let at: number // The index of the current character
  let ch: string // The current character

  const escapee: Record<string, string> = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  }

  let text: string

  const error = function (m: string): never {
    throw {
      name: 'SyntaxError',
      message: m,
      at: at,
      text: text,
    }
  }

  const next = function (c?: string): string {
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'")
    }
    ch = text.charAt(at)
    at += 1
    return ch
  }

  const number = function (): any {
    let num: number
    let string = ''

    if (ch === '-') {
      string = '-'
      next('-')
    }
    while (ch >= '0' && ch <= '9') {
      string += ch
      next()
    }
    if (ch === '.') {
      string += '.'
      while (next() && ch >= '0' && ch <= '9') {
        string += ch
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch
      next()
      if (ch === '-' || ch === '+') {
        string += ch
        next()
      }
      while (ch >= '0' && ch <= '9') {
        string += ch
        next()
      }
    }

    num = +string

    if (options && options.parse) {
      return options.parse(string)
    }

    if (!isFinite(num)) {
      error('Bad number')
    } else {
      if (string.length > 15) {
        return string
      } else {
        return num
      }
    }
  }

  const string = function (): any {
    let hex: number
    let i: number
    let str = ''
    let uffff: number

    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next()
          return str
        }
        if (ch === '\\') {
          next()
          if (ch === 'u') {
            uffff = 0
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16)
              if (!isFinite(hex)) {
                break
              }
              uffff = uffff * 16 + hex
            }
            str += String.fromCharCode(uffff)
          } else if (typeof escapee[ch] === 'string') {
            str += escapee[ch]
          } else {
            break
          }
        } else {
          str += ch
        }
      }
    }

    error('Bad string')
  }

  const white = function (): void {
    while (ch && ch <= ' ') {
      next()
    }
  }

  const word = function (): any {
    switch (ch) {
      case 't':
        next('t')
        next('r')
        next('u')
        next('e')
        return true
      case 'f':
        next('f')
        next('a')
        next('l')
        next('s')
        next('e')
        return false
      case 'n':
        next('n')
        next('u')
        next('l')
        next('l')
        return null
    }
    error("Unexpected '" + ch + "'")
  }

  let value: () => any // Place holder for the value function.

  const array = function (): any[] {
    const arr: any[] = []

    if (ch === '[') {
      next('[')
      white()
      if (ch === ']') {
        next(']')
        return arr // empty array
      }
      while (ch) {
        arr.push(value())
        white()
        if (ch === ']') {
          next(']')
          return arr
        }
        next(',')
        white()
      }
    }

    error('Bad array')
  }

  const object = function (): any {
    let key: string
    const obj: Record<string, any> = {}

    if (ch === '{') {
      next('{')
      white()
      if (ch === '}') {
        next('}')
        return obj // empty object
      }
      while (ch) {
        key = string()
        white()
        next(':')
        if (_options.strict === true && Object.hasOwnProperty.call(obj, key)) {
          error('Duplicate key "' + key + '"')
        }
        obj[key] = value()
        white()
        if (ch === '}') {
          next('}')
          return obj
        }
        next(',')
        white()
      }
    }

    error('Bad object')
  }

  value = function (): any {
    white()
    switch (ch) {
      case '{':
        return object()
      case '[':
        return array()
      case '"':
        return string()
      case '-':
        return number()
      default:
        return ch >= '0' && ch <= '9' ? number() : word()
    }
  }

  const rx_escapable =
    /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

  let gap: string
  let indent: string

  const meta: Record<string, string> = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\',
  }

  let rep: any

  function quote(s: string): string {
    rx_escapable.lastIndex = 0
    return rx_escapable.test(s)
      ? '"' +
          s.replace(rx_escapable, function (a) {
            const c = meta[a]
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
          }) +
          '"'
      : '"' + s + '"'
  }

  function str(key: string | number, holder: any): string | undefined {
    let i: number
    let k: string
    let v: string | undefined
    let length: number
    const mind = gap
    let partial: string[]
    let val = holder[key]

    const isBigNumber = options && options.isInstance && options.isInstance(val)

    // Check for NaN and Infinity
    if (isBigNumber && !val.isFinite()) {
      val = null
    }

    // If the value has a toJSON method, call it to obtain a replacement value.
    if (isBigNumber) {
      val = options!.stringify!(val)
    } else if (val && typeof val === 'object' && typeof val.toJSON === 'function') {
      val = val.toJSON(key)
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
      val = rep.call(holder, key, val)
    }

    // What happens next depends on the value's type.
    switch (typeof val) {
      case 'string':
        if (isBigNumber) {
          return val
        } else {
          return quote(val)
        }

      case 'number':
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(val) ? String(val) : 'null'

      case 'boolean':
        return String(val)

      case 'object':
        // typeof null is "object", so watch out for that case.
        if (!val) {
          return 'null'
        }

        // Make an array to hold the partial results of stringifying this object value.
        gap += indent
        partial = []

        // Is the value an array?
        if (Object.prototype.toString.apply(val) === '[object Array]') {
          length = val.length
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, val) || 'null'
          }

          v =
            partial.length === 0
              ? '[]'
              : gap
              ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
              : '[' + partial.join(',') + ']'
          gap = mind
          return v
        }

        // If the replacer is an array, use it to select the members to be stringified.
        if (rep && typeof rep === 'object') {
          length = rep.length
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i]
              v = str(k, val)
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v)
              }
            }
          }
        } else {
          // Otherwise, iterate through all of the keys in the object.
          for (k in val) {
            if (Object.prototype.hasOwnProperty.call(val, k)) {
              v = str(k, val)
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v)
              }
            }
          }
        }

        v =
          partial.length === 0
            ? '{}'
            : gap
            ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
            : '{' + partial.join(',') + '}'
        gap = mind
        return v
    }

    return undefined
  }

  const stringify = function (val: any, replacer?: any, space?: number | string): string {
    let i: number
    gap = ''
    indent = ''

    if (typeof space === 'number') {
      for (i = 0; i < space; i += 1) {
        indent += ' '
      }
    } else if (typeof space === 'string') {
      indent = space
    }

    rep = replacer
    if (
      replacer &&
      typeof replacer !== 'function' &&
      (typeof replacer !== 'object' || typeof replacer.length !== 'number')
    ) {
      throw new Error('JSON.stringify')
    }

    return (
      str('', {
        '': val,
      }) || ''
    )
  }

  const parse = function (source: string, reviver?: (key: string, value: any) => any): any {
    let result: any

    text = source + ''
    at = 0
    ch = ' '
    result = value()
    white()
    if (ch) {
      error('Syntax error')
    }

    return typeof reviver === 'function'
      ? (function walk(holder: any, key: string): any {
          let k: string
          let v: any
          const val = holder[key]
          if (val && typeof val === 'object') {
            Object.keys(val).forEach(function (k) {
              v = walk(val, k)
              if (v !== undefined) {
                val[k] = v
              } else {
                delete val[k]
              }
            })
          }
          return reviver.call(holder, key, val)
        })({'': result}, '')
      : result
  }

  return {parse, stringify}
}

export = create
