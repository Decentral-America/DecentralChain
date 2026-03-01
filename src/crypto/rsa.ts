import { type RSADigestAlgorithm, type TBytes, type TRSAKeyPair } from './interface';
import { base64Decode } from '../conversions/base-xx';
import {
  generateKeyPairSync,
  createPublicKey,
  createPrivateKey,
  createSign,
  createVerify,
  type KeyObject,
} from 'node:crypto';

/** Minimum RSA key size enforced by this library (NIST SP 800-57). */
const MIN_RSA_BITS = 2048;
const DEFAULT_RSA_BITS = 2048;
const DEFAULT_RSA_E = 0x10001; // 65537

/**
 * Map of our digest algorithm names to Node.js OpenSSL algorithm strings.
 * `crypto.createSign`/`createVerify` accept these directly.
 *
 * MD5 and SHA1 are intentionally excluded — they are cryptographically broken.
 */
const DIGEST_MAP: Record<RSADigestAlgorithm, string> = {
  SHA224: 'sha224',
  SHA256: 'sha256',
  SHA384: 'sha384',
  SHA512: 'sha512',
  'SHA3-224': 'sha3-224',
  'SHA3-256': 'sha3-256',
  'SHA3-384': 'sha3-384',
  'SHA3-512': 'sha3-512',
};

/* ── Key helpers ─────────────────────────────────────────────────── */

/** Convert a PEM-encoded key to raw bytes. */
export const pemToBytes = (pem: string) =>
  base64Decode(
    pem
      .trim()
      .split(/\r\n|\n/)
      .slice(1, -1)
      .join('')
      .trim(),
  );

/**
 * Import SPKI DER bytes as a Node.js KeyObject (public key).
 * Handles both PKCS#1 (`RSAPublicKey`) and SubjectPublicKeyInfo (`spki`)
 * encodings — tries `spki` first, falls back to `pkcs1`.
 */
function importPublicKey(der: Uint8Array): KeyObject {
  try {
    return createPublicKey({ key: Buffer.from(der), format: 'der', type: 'spki' });
  } catch {
    return createPublicKey({ key: Buffer.from(der), format: 'der', type: 'pkcs1' });
  }
}

/**
 * Import PKCS#1 / PKCS#8 DER bytes as a Node.js KeyObject (private key).
 */
function importPrivateKey(der: Uint8Array): KeyObject {
  try {
    return createPrivateKey({ key: Buffer.from(der), format: 'der', type: 'pkcs1' });
  } catch {
    return createPrivateKey({ key: Buffer.from(der), format: 'der', type: 'pkcs8' });
  }
}

/* ── Key generation ──────────────────────────────────────────────── */

/** Generate an RSA key pair synchronously. */
export const rsaKeyPairSync = (
  bits: number = DEFAULT_RSA_BITS,
  e: number = DEFAULT_RSA_E,
): TRSAKeyPair => {
  if (bits < MIN_RSA_BITS) {
    throw new Error(`RSA key size must be at least ${MIN_RSA_BITS} bits, got ${bits}`);
  }

  const kp = generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicExponent: e,
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs1', format: 'der' },
  });

  return {
    rsaPublic: new Uint8Array(kp.publicKey),
    rsaPrivate: new Uint8Array(kp.privateKey),
  };
};

/** Generate an RSA key pair asynchronously. */
export const rsaKeyPair = (
  bits: number = DEFAULT_RSA_BITS,
  e: number = DEFAULT_RSA_E,
): Promise<TRSAKeyPair> => {
  // Node.js generateKeyPairSync is used intentionally — it's fast for
  // 2048-bit keys and avoids the callback API complexity. Wrapping in
  // Promise.resolve keeps the async signature for callers.
  return Promise.resolve(rsaKeyPairSync(bits, e));
};

/* ── Sign / Verify ───────────────────────────────────────────────── */

/** Create an RSA PKCS#1 v1.5 signature. */
export const rsaSign = (
  rsaPrivateKey: TBytes,
  message: TBytes,
  digest: RSADigestAlgorithm = 'SHA256',
): TBytes => {
  const algo = DIGEST_MAP[digest] as string | undefined;
  if (!algo) {
    throw new Error(
      `Unsupported or unsafe RSA digest algorithm: "${digest}". Use SHA256 or stronger.`,
    );
  }
  const key = importPrivateKey(rsaPrivateKey);

  const signer = createSign(algo);
  signer.update(message);
  return new Uint8Array(signer.sign({ key, padding: 1 /* RSA_PKCS1_PADDING */ }));
};

/** Verify an RSA PKCS#1 v1.5 signature. */
export const rsaVerify = (
  rsaPublicKey: TBytes,
  message: TBytes,
  signature: TBytes,
  digest: RSADigestAlgorithm = 'SHA256',
): boolean => {
  const algo = DIGEST_MAP[digest] as string | undefined;
  if (!algo) {
    throw new Error(
      `Unsupported or unsafe RSA digest algorithm: "${digest}". Use SHA256 or stronger.`,
    );
  }
  const key = importPublicKey(rsaPublicKey);

  const verifier = createVerify(algo);
  verifier.update(message);
  return verifier.verify({ key, padding: 1 /* RSA_PKCS1_PADDING */ }, signature);
};
