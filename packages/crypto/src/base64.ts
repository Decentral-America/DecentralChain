export function base64Decode(input: string) {
  return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

export function base64Encode(input: Uint8Array) {
  return btoa(Array.from(input, b => String.fromCharCode(b)).join(''));
}
