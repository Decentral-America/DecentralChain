import { secp256k1 } from '@noble/curves/secp256k1.js';
import { describe, expect, it } from 'vitest';
import { ethereumKeyPair, ethereumSign } from '../src/crypto/ethereum';
import { keccak } from '../src/crypto/hashing';

describe('ethereumKeyPair', () => {
  it('returns a 64-byte uncompressed public key when generating a fresh key', () => {
    // Regression: secp256k1.keygen()'s own `publicKey` field is COMPRESSED
    // (33 bytes: a marker byte + X coordinate only). Using it as-is instead
    // of deriving explicitly via getPublicKey(secretKey, false) silently
    // produced a 32-byte X-coordinate-only value here — wrong length, and
    // (worse) it hashed to a completely different, unfunded address in a
    // live end-to-end test before this was caught.
    const { ethPublicKey } = ethereumKeyPair();
    expect(ethPublicKey).toHaveLength(64);
  });

  it('derives the identical public key whether generated fresh or re-derived from its own private key', () => {
    const generated = ethereumKeyPair();
    const rederived = ethereumKeyPair(generated.ethPrivateKey);
    expect(rederived.ethPublicKey).toEqual(generated.ethPublicKey);
  });
});

describe('ethereumSign', () => {
  it('produces a signature that recovers to the exact signing public key', () => {
    // The one guarantee that actually matters end-to-end: the node recovers
    // the sender's public key from the signature alone (Ethereum transactions
    // carry no explicit public key field), so if this doesn't hold, every
    // transaction silently debits a different account than the one funded --
    // exactly the failure the keygen() bug above caused in a live test.
    const { ethPrivateKey, ethPublicKey } = ethereumKeyPair();
    const message = new TextEncoder().encode('stand-in for an RLP-encoded unsigned tx payload');

    const { r, s, recovery } = ethereumSign(ethPrivateKey, message);
    const sig = new secp256k1.Signature(r, s, recovery);

    const digest = keccak(message); // ethereumSign hashes internally the same way
    const recoveredPoint = sig.recoverPublicKey(digest);
    const recoveredUncompressed = recoveredPoint.toBytes(false).slice(1); // drop 0x04 prefix

    expect(recoveredUncompressed).toEqual(ethPublicKey);
  });
});
