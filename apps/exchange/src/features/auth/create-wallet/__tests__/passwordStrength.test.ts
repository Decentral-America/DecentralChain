/**
 * passwordStrength / validatePassword — parity
 *
 * SecureStep's contract is that "the strength meter reflects the rules the hook
 * enforces, so a user is never shown a full bar for a password that will then
 * be rejected". That is a promise about two functions in two different files
 * agreeing, and nothing but this test holds them together: adding a rule to
 * validatePassword without adding a bar to passwordStrength would show a full
 * meter over a password the wizard refuses.
 */
import { describe, expect, it } from 'vitest';
import { passwordStrength } from '../steps/SecureStep';
import { validatePassword } from '../useCreateWallet';

/** How many bars the meter draws — a full meter must mean "accepted". */
const MAX_STRENGTH = 5;

/** Deterministic PRNG (mulberry32) so a failure is always reproducible. */
const makeRand = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Deliberately spans every character class the rules test for, plus length. */
const ALPHABET = 'aQ7! zM3#bn0$';

const CORPUS = [
  '',
  'a',
  'Ab1!',
  'abcdefghijkl',
  'ABCDEFGHIJKL',
  'Abcdefghijkl',
  'Abcdefghijk1',
  'abcdefghijk1!',
  'ABCDEFGHIJK1!',
  'Abcdefghijkl!',
  'Abcdefghij1!', // exactly 12 — the boundary the rule allows
  'Abcdefghi1!', // exactly 11 — the boundary it rejects
  'Abcdefghijk1!',
  'Abcdefghijk1!'.repeat(8),
];

describe('passwordStrength / validatePassword parity', () => {
  it('draws a full meter exactly when the password is accepted', () => {
    for (const password of CORPUS) {
      const full = passwordStrength(password) === MAX_STRENGTH;
      const accepted = validatePassword(password, password) === null;
      expect(full, `mismatch for ${JSON.stringify(password)}`).toBe(accepted);
    }
  });

  it('draws a full meter exactly when the password is accepted, over random input', () => {
    const rand = makeRand(20260818);
    for (let run = 0; run < 2000; run++) {
      const length = Math.floor(rand() * 18);
      let password = '';
      for (let i = 0; i < length; i++) {
        password += ALPHABET[Math.floor(rand() * ALPHABET.length)] as string;
      }
      const full = passwordStrength(password) === MAX_STRENGTH;
      const accepted = validatePassword(password, password) === null;
      expect(full, `mismatch for ${JSON.stringify(password)}`).toBe(accepted);
    }
  });

  it('never reports full strength for a password the rules reject', () => {
    for (const password of CORPUS) {
      if (validatePassword(password, password) !== null) {
        expect(passwordStrength(password)).toBeLessThan(MAX_STRENGTH);
      }
    }
  });

  it('scores an empty password zero', () => {
    expect(passwordStrength('')).toBe(0);
    expect(validatePassword('', '')).toBe('Please enter a password');
  });

  it('stays within the number of bars the meter draws', () => {
    for (const password of CORPUS) {
      expect(passwordStrength(password)).toBeGreaterThanOrEqual(0);
      expect(passwordStrength(password)).toBeLessThanOrEqual(MAX_STRENGTH);
    }
  });

  it('measures the password only — a mismatched confirmation is a separate error', () => {
    // The meter sits under the password field, above the confirm field, so it
    // deliberately says nothing about the pair. Pinned so the divergence is a
    // decision rather than a surprise.
    expect(passwordStrength('Abcdefghijk1!')).toBe(MAX_STRENGTH);
    expect(validatePassword('Abcdefghijk1!', 'Abcdefghijk2!')).toBe('Passwords do not match');
  });
});
