const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder();

/** Decode a UTF-8 byte array to a string. */
export function utf8ArrayToStr(array: Uint8Array): string {
  return decoder.decode(array);
}

/** Encode a string to a UTF-8 byte array. */
export function strToUtf8Array(str: string): Uint8Array {
  return encoder.encode(str);
}
