import { publicKey } from '@decentralchain/ts-lib-crypto';
import { commitToGeneration } from '../../src';
import { validateTxSignature } from '../utils';

describe('commitToGeneration', () => {
  const stringSeed = 'adsa';

  it('should build with a sender-derived BLS endorser key and commitment signature', () => {
    const tx = commitToGeneration({ generationPeriodStart: 1000 }, stringSeed);

    expect(tx.type).toBe(19);
    expect(tx.generationPeriodStart).toBe(1000);
    expect(tx.senderPublicKey).toBe(publicKey(stringSeed));
    // BLS endorser key must be distinct from the ed25519 sender key — proves real
    // BLS derivation happened rather than accidentally reusing the sender's key.
    expect(tx.endorserPublicKey).not.toBe(tx.senderPublicKey);
    expect(tx.endorserPublicKey.length).toBeGreaterThan(0);
    expect(tx.commitmentSignature.length).toBeGreaterThan(0);
  });

  it('should get a correct ed25519 proof signature over the proto-serialized tx', () => {
    const tx = commitToGeneration({ generationPeriodStart: 1000 }, stringSeed);
    // protoBytesMinVersion=0 forces the proto-bytes branch in validateTxSignature,
    // since CommitToGeneration is always version 1 (tx.version > 0 is true).
    expect(validateTxSignature(tx, 0)).toBe(true);
  });

  it('should be deterministic for a fixed timestamp: same params+seed -> same id and BLS fields', () => {
    const tsFixed = 1700000000000;
    const tx1 = commitToGeneration({ generationPeriodStart: 1000, timestamp: tsFixed }, stringSeed);
    const tx2 = commitToGeneration({ generationPeriodStart: 1000, timestamp: tsFixed }, stringSeed);

    expect(tx2.id).toBe(tx1.id);
    expect(tx2.commitmentSignature).toBe(tx1.commitmentSignature);
    expect(tx2.endorserPublicKey).toBe(tx1.endorserPublicKey);
  });

  it('should accept a precomputed endorserPublicKey/commitmentSignature without re-deriving from the seed', () => {
    const derived = commitToGeneration({ generationPeriodStart: 1000 }, stringSeed);
    const tx = commitToGeneration(
      {
        commitmentSignature: derived.commitmentSignature,
        endorserPublicKey: derived.endorserPublicKey,
        generationPeriodStart: 1000,
      },
      stringSeed,
    );

    expect(tx.endorserPublicKey).toBe(derived.endorserPublicKey);
    expect(tx.commitmentSignature).toBe(derived.commitmentSignature);
  });

  it('should throw when neither a seed nor a precomputed endorserPublicKey/commitmentSignature is given', () => {
    expect(() =>
      commitToGeneration({
        generationPeriodStart: 1000,
        senderPublicKey: publicKey(stringSeed),
      } as Parameters<typeof commitToGeneration>[0]),
    ).toThrowError(/endorserPublicKey/);
  });
});
