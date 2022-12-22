export function bytesToString(input: Uint8Array) {
  return new TextDecoder().decode(input);
}

export function stringToBytes(input: string) {
  return new TextEncoder().encode(input);
}
