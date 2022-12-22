export function base16Decode(input: string) {
  return Uint8Array.from(Array.from(input.matchAll(/[0-9a-f]{2}/gi)), ([h]) =>
    parseInt(h, 16)
  );
}

export function base16Encode(input: Uint8Array) {
  return Array.from(input, b => b.toString(16).padStart(2, '0')).join('');
}
