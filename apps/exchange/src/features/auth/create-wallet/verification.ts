/**
 * Seed-phrase verification challenges.
 *
 * Replaces the single "I have written it down" checkbox with something a user
 * cannot pass without having actually read the phrase. Pure functions, no
 * React, so the invariants can be tested exhaustively.
 */

/** How many words the user must confirm. */
export const CHALLENGE_COUNT = 3;

/** Candidates offered per challenge — one correct, the rest decoys. */
export const CHOICES_PER_CHALLENGE = 4;

/** One "which word was at position N?" question. */
export interface VerifyChallenge {
  /** 1-based index into the phrase, as shown to the user. */
  position: number;
  /** The word that belongs at `position`. */
  answer: string;
  /** Shuffled candidates; always contains `answer`. */
  choices: string[];
}

/** Pick `n` distinct integers from [0, size) using `rand`. */
function pickPositions(size: number, n: number, rand: () => number): number[] {
  const pool = Array.from({ length: size }, (_, i) => i);
  const out: number[] = [];
  while (out.length < n && pool.length > 0) {
    const [taken] = pool.splice(Math.floor(rand() * pool.length), 1);
    if (taken !== undefined) out.push(taken);
  }
  return out;
}

/** Fisher-Yates using `rand`, returning a new array. */
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

/**
 * Build verification challenges for a phrase.
 *
 * Decoys are drawn from the same phrase so the answer cannot be found by
 * vocabulary alone, and are de-duplicated against the answer so a phrase with
 * repeated words cannot produce a question with two correct-looking choices.
 *
 * @param words - The phrase, split into words.
 * @param count - How many challenges to build. Clamped to the phrase length.
 * @param rand - Randomness source; injectable so tests are deterministic.
 */
export function buildChallenges(
  words: string[],
  count: number = CHALLENGE_COUNT,
  rand: () => number = Math.random,
): VerifyChallenge[] {
  if (words.length === 0) return [];

  return pickPositions(words.length, Math.min(count, words.length), rand).map((index) => {
    const answer = words[index] as string;

    // Distinct words other than the answer. Set first, so a phrase containing
    // the same word twice cannot supply it as its own decoy.
    const decoyPool = [...new Set(words)].filter((w) => w !== answer);
    const decoys = shuffle(decoyPool, rand).slice(0, CHOICES_PER_CHALLENGE - 1);

    return {
      answer,
      choices: shuffle([answer, ...decoys], rand),
      position: index + 1,
    };
  });
}
