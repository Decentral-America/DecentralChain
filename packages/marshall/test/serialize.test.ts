import { LONG, SHORT, BYTE, BYTES, STRING, INT, BOOL, OPTION, COUNT, LEN, BASE58_STRING, BASE64_STRING, one, zero } from '../src/serializePrimitives'

const string = 'TestString'
const bytes = [84, 101, 115, 116, 83, 116, 114, 105, 110, 103]
const base58 = '5k1XmKDYbpxqAN'
const base64 = 'VGVzdFN0cmluZw=='

describe('Basic serialization', ()=> {
  it('LONG', () => {
    expect(LONG('1')).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1]))
    expect(LONG(1)).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1]))
    expect(LONG('18446744073709551615')).toEqual(Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255]))
    expect(()=>LONG(18446744073709551615)).toThrow('is too big to be precisely represented')
  })

  it('BYTE', () => {
    expect(BYTE(1)).toEqual(Uint8Array.from([1]))
  })

  it('BYTES', () => {
    expect(BYTES([34, 192])).toEqual(Uint8Array.from([34, 192]))
  })

  it('STRING', () => {
    expect(STRING(string)).toEqual(Uint8Array.from(bytes))
  })

  it('INT', () => {
    expect(INT(1)).toEqual(Uint8Array.from([0, 0, 0, 1]))
    expect(INT(65535)).toEqual(Uint8Array.from([0, 0, 255, 255]))
    expect(INT(2**32 -1 )).toEqual(Uint8Array.from([255, 255, 255, 255]))
  })

  it('SHORT', () => {
    expect(SHORT(1)).toEqual(Uint8Array.from([0, 1]))
    expect(SHORT(2**16-1)).toEqual(Uint8Array.from([255, 255]))
    expect(SHORT(2**16)).toEqual(Uint8Array.from([0, 0]))
  })

  it('BOOL', () => {
    expect(BOOL(false)).toEqual(zero)
    expect(BOOL(true)).toEqual(one)
  })

  it('OPTION', () => {
    expect(OPTION(BOOL)(null)).toEqual(Uint8Array.from([0]))
    expect(OPTION(BOOL)(false)).toEqual(Uint8Array.from([1, 0]))
  })

  it('COUNT', () => {
    expect(COUNT(BYTE)((x: boolean) => BOOL(x))([true, false, true])).toEqual(Uint8Array.from([3, 1, 0, 1]))
  })

  it('LEN', () => {
    expect(LEN(BYTE)(BYTES)([1, 2, 3, 4])).toEqual(Uint8Array.from([4, 1, 2, 3, 4]))
  })

  it('BASE58_STRING', () => {
    expect(BASE58_STRING(base58)).toEqual(Uint8Array.from(bytes))
  })

  it('BASE64_STRING', () => {
    expect(BASE64_STRING(base64)).toEqual(Uint8Array.from(bytes))
  })
})

