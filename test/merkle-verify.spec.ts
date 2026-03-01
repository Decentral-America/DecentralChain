import { base64Decode } from '../src/conversions/base-xx';
import { merkleVerify } from '../src/crypto/merkle-verify';
import { blake2b } from '../src/crypto/hashing';
import { concat } from '../src/crypto/concat-split';
import { describe, test, expect } from 'vitest';

describe('merkleVerify', () => {
  const rootHash = base64Decode('eh9fm3HeHZ3XA/UfMpC9HSwLVMyBLgkAJL0MIVBIoYk=');
  const leafData = base64Decode('AAAm+w==');
  const merkleProof = base64Decode(
    'ACBSs2di6rY+9N3mrpQVRNZLGAdRX2WBD6XkrOXuhh42XwEgKhB3Aiij6jqLRuQhrwqv6e05kr89tyxkuFYwUuMCQB8AIKLhp/AFQkokTe/NMQnKFL5eTMvDlFejApmJxPY6Rp8XACAWrdgB8DwvPA8D04E9HgUjhKghAn5aqtZnuKcmpLHztQAgd2OG15WYz90r1WipgXwjdq9WhvMIAtvGlm6E3WYY12oAIJXPPVIdbwOTdUJvCgMI4iape2gvR55vsrO2OmJJtZUNASAya23YyBl+EpKytL9+7cPdkeMMWSjk0Bc0GNnqIisofQ==',
  );

  test('verifies a valid merkle proof', () => {
    expect(merkleVerify(rootHash, merkleProof, leafData)).toBe(true);
  });

  test('rejects proof with tampered leaf data', () => {
    const tamperedLeaf = new Uint8Array(leafData);
    tamperedLeaf[0] ^= 0xff;
    expect(merkleVerify(rootHash, merkleProof, tamperedLeaf)).toBe(false);
  });

  test('throws on invalid rootHash length', () => {
    const shortHash = new Uint8Array(16);
    expect(() => merkleVerify(shortHash, merkleProof, leafData)).toThrow('Invalid rootHash length');
  });

  test('throws on malformed proof with zero hash size', () => {
    // side byte + 0x00 size byte → invalid
    const badProof = Uint8Array.from([0x00, 0x00]);
    expect(() => merkleVerify(rootHash, badProof, leafData)).toThrow('Wrong hash size');
  });

  test('returns true for empty proof when leaf equals root', () => {
    const leaf = new Uint8Array([1, 2, 3]);
    const LEAF_PREFIX = Uint8Array.from([0]);
    const computedRoot = blake2b(concat(LEAF_PREFIX, leaf));
    expect(merkleVerify(computedRoot, new Uint8Array(0), leaf)).toBe(true);
  });
});
