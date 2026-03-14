const encoder = new TextEncoder();

export function utf8Encode(input: string) {
  return encoder.encode(input);
}

const decoder = new TextDecoder();

export function utf8Decode(input: Uint8Array) {
  return decoder.decode(input);
}
