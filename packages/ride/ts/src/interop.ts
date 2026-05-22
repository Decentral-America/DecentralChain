import { createPublicKey, createVerify } from 'node:crypto';
import * as crypto from '@decentralchain/ts-lib-crypto';
import {
  rsaVerify as _rsaVerify,
  type RSADigestAlgorithm,
} from '@decentralchain/ts-lib-crypto/rsa';

// ---------------------------------------------------------------------------
// Global type declarations for the Scala.js @JSGlobalScope bridge.
// The RIDE evaluator (compiled via Scala.js) resolves crypto primitives and
// HTTP by reading these from the global scope at runtime.
// ---------------------------------------------------------------------------
declare global {
  var base58Encode: (bytes: ArrayBuffer) => string;
  var base58Decode: (data: string) => ArrayBuffer;
  var base64Encode: (bytes: ArrayBuffer) => string;
  var base64Decode: (data: string) => ArrayBuffer;
  var keccak256: (bytes: ArrayBuffer) => ArrayBuffer;
  var sha256: (bytes: ArrayBuffer) => ArrayBuffer;
  var blake2b256: (bytes: ArrayBuffer) => ArrayBuffer;
  var curve25519verify: (msg: ArrayBuffer, sig: ArrayBuffer, key: ArrayBuffer) => boolean;
  var merkleVerify: (
    rootHash: ArrayBuffer,
    merkleProof: ArrayBuffer,
    leafData: ArrayBuffer,
  ) => boolean;
  var rsaVerify: (
    digest: { toString(): string },
    msg: ArrayBuffer,
    sig: ArrayBuffer,
    key: ArrayBuffer,
  ) => boolean;
  var httpGet: (data: {
    url?: string;
    [key: string]: unknown;
  }) => Promise<{ body: string; status: number; [key: string]: unknown }>;
}

globalThis.base58Encode = (bytes: ArrayBuffer): string =>
  crypto.base58Encode(new Uint8Array(bytes));
globalThis.base58Decode = (data: string): ArrayBuffer =>
  (crypto.base58Decode(data) as Uint8Array).buffer as ArrayBuffer;
globalThis.base64Encode = (bytes: ArrayBuffer): string =>
  crypto.base64Encode(new Uint8Array(bytes));
globalThis.base64Decode = (data: string): ArrayBuffer =>
  crypto.base64Decode(data) as unknown as ArrayBuffer;
globalThis.keccak256 = (bytes: ArrayBuffer): ArrayBuffer =>
  Uint8Array.from(crypto.keccak(new Uint8Array(bytes))).buffer as ArrayBuffer;
globalThis.sha256 = (bytes: ArrayBuffer): ArrayBuffer =>
  (crypto.sha256(new Uint8Array(bytes)) as Uint8Array).buffer as ArrayBuffer;
globalThis.blake2b256 = (bytes: ArrayBuffer): ArrayBuffer =>
  (crypto.blake2b(new Uint8Array(bytes)) as Uint8Array).buffer as ArrayBuffer;
globalThis.curve25519verify = (msg: ArrayBuffer, sig: ArrayBuffer, key: ArrayBuffer): boolean =>
  crypto.verifySignature(new Uint8Array(key), new Uint8Array(msg), new Uint8Array(sig));
globalThis.merkleVerify = (
  rootHash: ArrayBuffer,
  merkleProof: ArrayBuffer,
  leafData: ArrayBuffer,
): boolean =>
  crypto.merkleVerify(
    new Uint8Array(rootHash),
    new Uint8Array(merkleProof),
    new Uint8Array(leafData),
  );
globalThis.rsaVerify = (
  digest: { toString(): string },
  msg: ArrayBuffer,
  sig: ArrayBuffer,
  key: ArrayBuffer,
): boolean => {
  const algStr = digest.toString();

  // MD5 and SHA1 are handled directly with node:crypto.
  // ts-lib-crypto intentionally excludes cryptographically-broken digests as a
  // production security policy, but the RIDE REPL must evaluate all valid RIDE
  // scripts including legacy contracts that use these algorithms on-chain.
  if (algStr === 'MD5' || algStr === 'SHA1') {
    try {
      const pubKey = (() => {
        try {
          return createPublicKey({ format: 'der', key: Buffer.from(key), type: 'spki' });
        } catch {
          return createPublicKey({ format: 'der', key: Buffer.from(key), type: 'pkcs1' });
        }
      })();
      const verifier = createVerify(algStr);
      verifier.update(Buffer.from(msg));
      return verifier.verify({ key: pubKey, padding: 1 /* RSA_PKCS1_PADDING */ }, Buffer.from(sig));
    } catch {
      return false;
    }
  }

  // All other algorithms: delegate to ts-lib-crypto with SHA3 name normalisation.
  let mappedAlg = algStr;
  switch (algStr) {
    case 'SHA3224':
      mappedAlg = 'SHA3-224';
      break;
    case 'SHA3256':
      mappedAlg = 'SHA3-256';
      break;
    case 'SHA3384':
      mappedAlg = 'SHA3-384';
      break;
    case 'SHA3512':
      mappedAlg = 'SHA3-512';
      break;
    // 'NONE', 'SHA224', 'SHA256', 'SHA384', 'SHA512' pass through unchanged.
  }
  return _rsaVerify(
    new Uint8Array(key),
    new Uint8Array(msg),
    new Uint8Array(sig),
    mappedAlg as RSADigestAlgorithm,
  );
};
globalThis.httpGet = async (data: {
  url?: string;
  [key: string]: unknown;
}): Promise<{ body: string; status: number; [key: string]: unknown }> => {
  if (!data.url) return { ...data, body: 'url is undefined', status: 404 };
  // HTTPS enforcement: warn when a non-HTTPS URL is used with a non-local host.
  // Local development (localhost / 127.0.0.1 / ::1) is explicitly allowed over HTTP.
  if (data.url.startsWith('http://')) {
    try {
      const { hostname } = new URL(data.url);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      if (!isLocal) {
        console.warn(
          '[ride-js] httpGet: insecure HTTP request to non-local host. Use HTTPS for production node connections.',
          data.url,
        );
      }
    } catch {
      /* unparseable URL — fetch will reject it */
    }
  }
  const resp = await fetch(data.url, { signal: AbortSignal.timeout(30_000) });
  const status = resp.status;
  const body = await resp.text();
  return { ...data, body, status };
};
