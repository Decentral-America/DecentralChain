/**
 * Ambient type declarations for node-forge submodule imports.
 *
 * `@types/node-forge` only declares the top-level `"node-forge"` module.
 * These declarations provide type-safe access to the individual `node-forge/lib/*`
 * submodules that this project imports directly.
 */

declare module 'node-forge/lib/cipher' {
  import type forge from 'node-forge';
  export function createCipher(
    algorithm: forge.cipher.Algorithm,
    payload: forge.util.ByteBuffer | string,
  ): forge.cipher.BlockCipher;
  export function createDecipher(
    algorithm: forge.cipher.Algorithm,
    payload: forge.util.ByteBuffer | string,
  ): forge.cipher.BlockCipher;
}

declare module 'node-forge/lib/util' {
  import type forge from 'node-forge';
  export function createBuffer(
    input?: string | ArrayBuffer | ArrayBufferView | forge.util.ByteStringBuffer,
    encoding?: string,
  ): forge.util.ByteBuffer;
  export function encode64(bytes: string, maxline?: number): string;
  export function decode64(encoded: string): string;
  export function hexToBytes(hex: string): string;
  export function bytesToHex(bytes: string): string;
}

declare module 'node-forge/lib/hmac' {
  import type forge from 'node-forge';
  export function create(): forge.hmac.HMAC;
}

declare module 'node-forge/lib/md' {
  import type forge from 'node-forge';
  const md: typeof forge.md;
  export = md;
}

declare module 'node-forge/lib/md5' {
  import type forge from 'node-forge';
  export function create(): forge.md.md5.MessageDigest;
}

declare module 'node-forge/lib/random' {
  import type forge from 'node-forge';
  const random: typeof forge.random;
  export default random;
}

declare module 'node-forge/lib/sha256' {
  // Side-effect-only import — registers sha256 with the md namespace.
}
