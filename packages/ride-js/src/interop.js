import * as crypto from '@decentralchain/ts-lib-crypto';
import { rsaVerify as _rsaVerify } from '@decentralchain/ts-lib-crypto/rsa';

globalThis.base58Encode = (bytes) => crypto.base58Encode(new Uint8Array(bytes));
globalThis.base58Decode = (data) => crypto.base58Decode(data).buffer;
globalThis.base64Encode = (bytes) => crypto.base64Encode(new Uint8Array(bytes));
globalThis.base64Decode = (data) => crypto.base64Decode(data);
globalThis.keccak256 = (bytes) => Uint8Array.from(crypto.keccak(new Uint8Array(bytes))).buffer;
// @ts-expect-error — Buffer.from handles TBytes (Uint8Array) at runtime; overload mismatch is harmless
globalThis.sha256 = (bytes) => Buffer.from(crypto.sha256(new Uint8Array(bytes)), 'hex');
globalThis.blake2b256 = (bytes) => crypto.blake2b(new Uint8Array(bytes)).buffer;
globalThis.curve25519verify = (msg, sig, key) =>
  crypto.verifySignature(new Uint8Array(key), new Uint8Array(msg), new Uint8Array(sig));
globalThis.merkleVerify = (rootHash, merkleProof, leafData) =>
  crypto.merkleVerify(
    new Uint8Array(rootHash),
    new Uint8Array(merkleProof),
    new Uint8Array(leafData),
  );
globalThis.rsaVerify = (digest, msg, sig, key) => {
  let alg = digest.toString();
  switch (digest.toString()) {
    case 'SHA3224':
      alg = 'SHA3-224';
      break;
    case 'SHA3256':
      alg = 'SHA3-256';
      break;
    case 'SHA3384':
      alg = 'SHA3-384';
      break;
    case 'SHA3512':
      alg = 'SHA3-512';
      break;
    case 'NONE':
      alg = 'NONE';
      break;
  }
  return _rsaVerify(new Uint8Array(key), new Uint8Array(msg), new Uint8Array(sig), alg);
};
globalThis.httpGet = async (data) => {
  if (!data.url) return { ...data, body: 'url is undefined', status: 404 };
  const resp = await fetch(data.url, { signal: AbortSignal.timeout(30_000) });
  const status = resp.status;
  const body = await resp.text();
  return { ...data, body, status };
};
