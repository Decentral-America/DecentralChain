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

describe('ethereumSign — EIP-155 known-answer vector (https://eips.ethereum.org/EIPS/eip-155)', () => {
  // EIP-155 example: nonce 9, gasPrice 20 gwei, gas 21000, to 0x3535…35, value 1 ether,
  // empty data, chainId 1, signed with private key 0x4646…46.
  const privateKey = new Uint8Array(32).fill(0x46);
  const signingPayload = Uint8Array.from(
    Buffer.from(
      'ec098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a764000080018080',
      'hex',
    ),
  );

  it('hashes the payload to the signing hash published in the EIP', () => {
    expect(Buffer.from(keccak(signingPayload)).toString('hex')).toBe(
      'daf5a779ae972f972197303d7b574746c7ef83eadac0f2791ad23db92e4c8e53',
    );
  });

  it('produces the r, s and v published in the EIP', () => {
    const { r, s, recovery } = ethereumSign(privateKey, signingPayload);
    expect(r).toBe(18515461264373351373200002665853028612451056578545711640558177340181847433846n);
    expect(s).toBe(46948507304638947509940763649030358759909902576025900602547168820602576006531n);
    expect(1n * 2n + 35n + BigInt(recovery)).toBe(37n); // v = chainId * 2 + 35 + recovery
  });
});
