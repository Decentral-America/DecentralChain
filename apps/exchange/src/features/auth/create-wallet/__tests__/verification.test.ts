/**
 * verification — unit tests
 *
 * The challenge generator is the only thing standing between a user and a
 * wallet they cannot recover, so its invariants are pinned here: the answer is
 * always reachable, decoys never give it away, and positions never repeat.
 */
import { describe, expect, it } from 'vitest';
import {
  buildChallenges,
  CHALLENGE_COUNT,
  CHOICES_PER_CHALLENGE,
  type VerifyChallenge,
} from '../verification';

const WORDS = [
  'melody',
  'rate',
  'simple',
  'stable',
  'safe',
  'truck',
  'worth',
  'fresh',
  'attract',
  'sweet',
  'cook',
  'lobster',
  'zoo',
  'kid',
  'iron',
];

/** Deterministic stand-in for Math.random: cycles through fixed values. */
const seededRand = (values: number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] as number;
};

describe('buildChallenges', () => {
  it('returns CHALLENGE_COUNT challenges by default', () => {
    expect(buildChallenges(WORDS)).toHaveLength(CHALLENGE_COUNT);
  });

  it('always includes the correct answer among the choices', () => {
    for (let run = 0; run < 50; run++) {
      for (const c of buildChallenges(WORDS)) {
        expect(c.choices).toContain(c.answer);
      }
    }
  });

  it('gives every challenge CHOICES_PER_CHALLENGE distinct choices', () => {
    for (let run = 0; run < 50; run++) {
      for (const c of buildChallenges(WORDS)) {
        expect(c.choices).toHaveLength(CHOICES_PER_CHALLENGE);
        expect(new Set(c.choices).size).toBe(CHOICES_PER_CHALLENGE);
      }
    }
  });

  it('never repeats a position within one set', () => {
    for (let run = 0; run < 50; run++) {
      const positions = buildChallenges(WORDS).map((c) => c.position);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('reports positions as 1-based indexes into the phrase', () => {
    for (const c of buildChallenges(WORDS)) {
      expect(c.position).toBeGreaterThanOrEqual(1);
      expect(c.position).toBeLessThanOrEqual(WORDS.length);
      expect(WORDS[c.position - 1]).toBe(c.answer);
    }
  });

  it('draws decoys from the same phrase', () => {
    // A decoy from outside the phrase would let the user answer by vocabulary
    // alone rather than by remembering the word.
    for (const c of buildChallenges(WORDS)) {
      for (const choice of c.choices) {
        expect(WORDS).toContain(choice);
      }
    }
  });

  it('is deterministic for a given rand', () => {
    const a = buildChallenges(WORDS, 3, seededRand([0.1, 0.4, 0.7, 0.2, 0.9]));
    const b = buildChallenges(WORDS, 3, seededRand([0.1, 0.4, 0.7, 0.2, 0.9]));
    expect(a).toEqual(b);
  });

  it('handles a phrase with duplicate words without duplicating choices', () => {
    const dupes = ['same', 'same', 'same', 'other', 'third', 'fourth', 'fifth'];
    for (const c of buildChallenges(dupes)) {
      expect(new Set(c.choices).size).toBe(c.choices.length);
      expect(c.choices).toContain(c.answer);
    }
  });

  it('never offers the answer word twice when the phrase repeats it', () => {
    // A repeated word supplying itself as a decoy would put two correct-looking
    // tiles on screen; picking the "wrong" one is scored as a failure the user
    // cannot understand, on the one step standing between them and a wallet.
    const dupes = ['same', 'same', 'same', 'same', 'other', 'third', 'fourth', 'fifth', 'sixth'];
    for (let run = 0; run < 100; run++) {
      for (const c of buildChallenges(dupes)) {
        expect(c.choices.filter((choice) => choice === c.answer)).toHaveLength(1);
        expect(c.choices).toHaveLength(CHOICES_PER_CHALLENGE);
      }
    }
  });

  it('still builds a usable challenge when dedupe leaves fewer decoys than slots', () => {
    // Two distinct words means at most one decoy, so a challenge is short of
    // its four tiles — it must still be answerable rather than lose the answer.
    const thin = ['same', 'same', 'same', 'other'];
    for (let run = 0; run < 50; run++) {
      const challenges = buildChallenges(thin);
      expect(challenges.length).toBeGreaterThan(0);
      for (const c of challenges) {
        expect(c.choices).toContain(c.answer);
        expect(new Set(c.choices).size).toBe(c.choices.length);
        expect(c.choices.length).toBeLessThanOrEqual(CHOICES_PER_CHALLENGE);
        expect(thin[c.position - 1]).toBe(c.answer);
      }
    }
  });

  it('survives a phrase made entirely of one repeated word', () => {
    const same = ['same', 'same', 'same', 'same', 'same'];
    for (const c of buildChallenges(same)) {
      expect(c.choices).toEqual(['same']);
      expect(c.answer).toBe('same');
    }
  });

  it('returns fewer challenges than requested when the phrase is short', () => {
    expect(buildChallenges(['a', 'b'], 3)).toHaveLength(2);
  });

  it('returns an empty array for an empty phrase', () => {
    expect(buildChallenges([], 3)).toEqual([]);
  });

  it('produces challenges usable as VerifyChallenge', () => {
    const c: VerifyChallenge | undefined = buildChallenges(WORDS)[0];
    expect(typeof c?.answer).toBe('string');
  });
});
