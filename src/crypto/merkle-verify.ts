import { blake2b } from './hashing';
import { concat } from './concat-split';
import { equalBytes } from '@noble/curves/utils.js';

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
  let offset = 0;
  while (offset < merkleProof.length) {
    if (offset + 1 >= merkleProof.length)
      throw new Error('Failed to parse merkleProof: Truncated proof entry (missing size byte)');
    const side = merkleProof[offset] === 0 ? 'L' : 'R';
    const size = merkleProof[offset + 1]!;
    if (size < 1) throw new Error('Failed to parse merkleProof: Wrong hash size');
    if (offset + 2 + size > merkleProof.length)
      throw new Error(
        'Failed to parse merkleProof: Truncated proof entry (hash extends beyond proof)',
      );

    const hash = merkleProof.slice(offset + 2, offset + 2 + size);
    proofsWithSide.push([side, hash]);
    offset += 2 + size;
  }

  const rootHashFromProof = proofsWithSide.reduce(
    (acc, [side, hash]) =>
      blake2b(concat(INTERNAL_NODE_PREFIX, side === 'R' ? concat(hash, acc) : concat(acc, hash))),
    leafHash,
  );

  return equalBytes(rootHashFromProof, rootHash);
}
