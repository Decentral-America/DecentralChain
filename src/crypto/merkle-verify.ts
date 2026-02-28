import { blake2b } from './hashing';
import { concat } from './concat-split';

/**
 * Verify a Merkle proof against a root hash and leaf data.
 *
 * @param rootHash - The expected 32-byte BLAKE2b root hash.
 * @param merkleProof - The serialized Merkle proof bytes.
 * @param leafData - The leaf data to verify.
 * @returns `true` if the proof is valid.
 */
export function merkleVerify(
  rootHash: Uint8Array,
  merkleProof: Uint8Array,
  leafData: Uint8Array,
): boolean {
  const LEAF_PREFIX = Uint8Array.from([0]);
  const INTERNAL_NODE_PREFIX = Uint8Array.from([1]);

  if (rootHash.length !== 32)
    throw new Error('Failed to parse merkleProof: Invalid rootHash length');

  const leafHash = blake2b(concat(LEAF_PREFIX, leafData));

  const proofsWithSide: ['L' | 'R', Uint8Array][] = [];
  let proofBytes = merkleProof.map((x) => x);
  while (proofBytes.length > 0) {
    const side = proofBytes[0] === 0 ? 'L' : 'R';
    const size = proofBytes[1]!;
    if (size < 1) throw new Error('Failed to parse merkleProof: Wrong hash size');

    const hash = proofBytes.slice(2, 2 + size);
    proofsWithSide.push([side, hash]);
    proofBytes = proofBytes.slice(2 + size);
  }

  const rootHashFromProof = proofsWithSide.reduce(
    (acc, [side, hash]) =>
      blake2b(concat(INTERNAL_NODE_PREFIX, side === 'R' ? concat(hash, acc) : concat(acc, hash))),
    leafHash,
  );

  return rootHashFromProof.every((v, i) => v === rootHash[i]);
}
