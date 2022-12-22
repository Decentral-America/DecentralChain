export function sha256(data: Uint8Array) {
  return crypto.subtle.digest('SHA-256', data);
}
