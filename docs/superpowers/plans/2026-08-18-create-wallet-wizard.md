# Create Wallet Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overflowing single-card Create New Wallet screen with a four-step wizard on a dark glass surface, adding real seed verification in place of a checkbox.

**Architecture:** Two new presentational primitives (`GlassCard`, `StepRail`) live in `components/auth/`. The wizard lives in `features/auth/create-wallet/`: a container owning step index, a `useCreateWallet` hook owning all Seed/auth/validation logic, a pure `verification.ts` challenge generator, and four presentational step components. Steps receive data and callbacks as props and contain no business logic.

**Tech Stack:** React 19, TypeScript, MUI 9 (transitions only — no new dependency), styled-components (existing), Vitest + @testing-library/react, Vite 8.

## Global Constraints

- Node **24.18.0** (pinned in `.node-version`); activate with `nvm use 24.18.0` before any command.
- All commands run from `apps/exchange/`.
- Verification gate, all four must pass: `./node_modules/.bin/tsc -b --noEmit`, `./node_modules/.bin/vitest run`, `pnpm exec biome check .`, `./node_modules/.bin/vite build`.
- **418 existing tests must stay green.** Test count only grows.
- **No new runtime dependencies.** Animation uses MUI's bundled `Slide`/`Fade`/`Grow` plus CSS keyframes.
- Every wizard step must fit within a **600px viewport height**.
- Biome enforces **cognitive complexity ≤ 25** per function and sorts object keys alphabetically — write object literals with keys already in alphabetical order.
- Brand tokens come from `@/theme/landingTheme` (`brandInk`, `onCanvas`) and `@/styles/tokens` (`palette`). Do not introduce new hex values outside `GlassCard`'s surface spec.
- Password rules are unchanged from today: minimum 12 characters, and at least one uppercase, one lowercase, one digit, one special character.
- Respect `prefers-reduced-motion` — one media query disables all motion.

---

### Task 1: Verification challenge generator

Pure logic, no React. Built first because every later task depends on its types.

**Files:**
- Create: `src/features/auth/create-wallet/verification.ts`
- Test: `src/features/auth/create-wallet/__tests__/verification.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface VerifyChallenge { position: number; answer: string; choices: string[] }`
  - `function buildChallenges(words: string[], count?: number, rand?: () => number): VerifyChallenge[]`
  - `CHALLENGE_COUNT: 3`, `CHOICES_PER_CHALLENGE: 4`

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/create-wallet/__tests__/verification.test.ts`:

```ts
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
  'melody', 'rate', 'simple', 'stable', 'safe',
  'truck', 'worth', 'fresh', 'attract', 'sweet',
  'cook', 'lobster', 'zoo', 'kid', 'iron',
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/exchange && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24.18.0
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/verification.test.ts
```

Expected: FAIL — `Failed to resolve import "../verification"`.

- [ ] **Step 3: Write the implementation**

Create `src/features/auth/create-wallet/verification.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/verification.test.ts
```

Expected: PASS, 11 tests.

Note: the duplicate-words test uses a 7-word phrase with 3 unique-ish values; `CHOICES_PER_CHALLENGE` is 4, so the decoy pool must hold at least 3 distinct non-answer words. If it holds fewer, `choices` is shorter than 4 — that is correct behaviour and the distinct-count test still passes because it compares against `c.choices.length`.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/create-wallet/verification.ts src/features/auth/create-wallet/__tests__/verification.test.ts
git commit -m "feat(exchange): add seed verification challenge generator"
```

---

### Task 2: Surface primitives — GlassCard and StepRail

**Files:**
- Create: `src/components/auth/GlassCard.tsx`
- Create: `src/components/auth/StepRail.tsx`
- Test: `src/components/auth/__tests__/StepRail.test.tsx`

**Interfaces:**
- Consumes: `brandInk`, `onCanvas` from `@/theme/landingTheme`; `palette` from `@/styles/tokens`
- Produces:
  - `function GlassCard(props: { children: ReactNode; sx?: SxProps<Theme> }): JSX.Element`
  - `function StepRail(props: { steps: string[]; current: number }): JSX.Element` — `current` is 0-based

- [ ] **Step 1: Write the failing test**

Create `src/components/auth/__tests__/StepRail.test.tsx`:

```tsx
/**
 * StepRail — unit tests
 *
 * The rail is how a user knows where they are in a four-step flow they cannot
 * safely abandon halfway, so its labelling is asserted rather than eyeballed.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepRail } from '../StepRail';

const STEPS = ['Method', 'Phrase', 'Verify', 'Secure'];

describe('StepRail', () => {
  it('renders every step label', () => {
    render(<StepRail steps={STEPS} current={0} />);
    for (const label of STEPS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('exposes progress to assistive technology', () => {
    render(<StepRail steps={STEPS} current={2} />);
    const rail = screen.getByRole('progressbar');
    expect(rail).toHaveAttribute('aria-valuenow', '3');
    expect(rail).toHaveAttribute('aria-valuemin', '1');
    expect(rail).toHaveAttribute('aria-valuemax', '4');
  });

  it('marks the current step', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Phrase')).toHaveAttribute('data-state', 'current');
  });

  it('marks earlier steps complete and later steps upcoming', () => {
    render(<StepRail steps={STEPS} current={1} />);
    expect(screen.getByText('Method')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByText('Verify')).toHaveAttribute('data-state', 'upcoming');
  });

  it('handles the final step without overflowing the range', () => {
    render(<StepRail steps={STEPS} current={3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/components/auth/__tests__/StepRail.test.tsx
```

Expected: FAIL — `Failed to resolve import "../StepRail"`.

- [ ] **Step 3: Write GlassCard**

Create `src/components/auth/GlassCard.tsx`:

```tsx
/**
 * The dark translucent surface every pre-app screen sits on.
 *
 * Replaces the white card that used to float on the night canvas. That card
 * was deliberate once — see the note rewritten in AuthScene — but a
 * security-critical form reading as a different product from the page around
 * it costs more than the contrast gains.
 *
 * Falls back to an opaque surface where backdrop-filter is unsupported, so
 * text contrast is never left to chance.
 */
import { Box, type SxProps, type Theme } from '@mui/material';
import { type ReactNode } from 'react';
import { brandInk } from '@/theme/landingTheme';

export function GlassCard({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{
        // Opaque fallback first; the translucent layer only applies where
        // backdrop-filter actually works.
        bgcolor: brandInk.deep,
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(6, 3, 20, 0.55)',
        overflow: 'hidden',
        p: { md: 4, xs: 3 },
        position: 'relative',
        // The lit top rim is what reads as glass rather than as a grey panel.
        '&::before': {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)',
          content: '""',
          height: '1px',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        '@supports (backdrop-filter: blur(1px))': {
          backdropFilter: 'blur(20px) saturate(140%)',
          bgcolor: 'rgba(255, 255, 255, 0.04)',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
```

- [ ] **Step 4: Write StepRail**

Create `src/components/auth/StepRail.tsx`:

```tsx
/**
 * Progress indicator for the create-wallet wizard.
 *
 * Labels carry a `data-state` of complete / current / upcoming so styling and
 * tests read from one source rather than inferring position twice.
 */
import { Box, Stack, Typography } from '@mui/material';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

type StepState = 'complete' | 'current' | 'upcoming';

function stateFor(index: number, current: number): StepState {
  if (index < current) return 'complete';
  if (index === current) return 'current';
  return 'upcoming';
}

export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  const filled = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;

  return (
    <Box
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current + 1}
      aria-label="Wallet setup progress"
      sx={{ mb: 3 }}
    >
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.10)', borderRadius: 999, height: 3, mb: 1.5 }}>
        <Box
          sx={{
            bgcolor: palette.indigoHover,
            borderRadius: 999,
            height: '100%',
            transition: 'width 320ms ease',
            width: `${filled}%`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        {steps.map((label, index) => {
          const state = stateFor(index, current);
          return (
            <Typography
              key={label}
              data-state={state}
              variant="caption"
              sx={{
                color: state === 'upcoming' ? onCanvas.secondary : onCanvas.primary,
                fontWeight: state === 'current' ? 700 : 400,
                opacity: state === 'upcoming' ? 0.6 : 1,
                transition: 'opacity 200ms ease, color 200ms ease',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              {label}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/components/auth/__tests__/StepRail.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/GlassCard.tsx src/components/auth/StepRail.tsx src/components/auth/__tests__/StepRail.test.tsx
git commit -m "feat(exchange): add GlassCard surface and StepRail progress primitives"
```

---

### Task 3: useCreateWallet hook

All Seed, auth, and validation logic. Extracted from `CreateAccount` unchanged in behaviour except that `hasBackup` now reflects passing verification rather than ticking a box.

**Files:**
- Create: `src/features/auth/create-wallet/useCreateWallet.ts`
- Test: `src/features/auth/create-wallet/__tests__/useCreateWallet.test.tsx`

**Interfaces:**
- Consumes: `buildChallenges`, `VerifyChallenge` from `../verification`
- Produces:
  - `function validatePassword(password: string, confirm: string): string | null` — returns an error message or null
  - `function useCreateWallet(): CreateWalletApi`
  - ```ts
    interface CreateWalletApi {
      words: string[];
      challenges: VerifyChallenge[];
      isLedgerSupported: boolean;
      isCopied: boolean;
      isSubmitting: boolean;
      error: string;
      /** Set when Seed.create() threw; the phrase step shows this with a retry. */
      seedError: string;
      regenerateSeed: () => void;
      copyPhrase: () => Promise<void>;
      submit: (password: string, confirm: string) => Promise<boolean>;
    }
    ```

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/create-wallet/__tests__/useCreateWallet.test.tsx`:

```tsx
/**
 * useCreateWallet — unit tests
 *
 * Covers password validation (the rules are unchanged from the screen this
 * replaces) and that a failed submit surfaces an error without losing the
 * generated phrase.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateWallet, validatePassword } from '../useCreateWallet';

const create = vi.fn();
const navigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create,
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    user: null,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('data-service/classes/Seed', () => ({
  Seed: { create: vi.fn(() => ({ phrase: 'a b c d e f g h i j k l m n o' })) },
}));

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('', '')).toBe('Please enter a password');
  });

  it('rejects a password under 12 characters', () => {
    expect(validatePassword('Ab1!short', 'Ab1!short')).toBe(
      'Password must be at least 12 characters',
    );
  });

  it('rejects a password missing a character class', () => {
    const message = 'Password must contain uppercase, lowercase, a digit, and a special character';
    expect(validatePassword('abcdefghijkl', 'abcdefghijkl')).toBe(message);
    expect(validatePassword('ABCDEFGHIJKL', 'ABCDEFGHIJKL')).toBe(message);
    expect(validatePassword('Abcdefghijkl', 'Abcdefghijkl')).toBe(message);
    expect(validatePassword('Abcdefghijk1', 'Abcdefghijk1')).toBe(message);
  });

  it('rejects a mismatched confirmation', () => {
    expect(validatePassword('Abcdefghijk1!', 'Abcdefghijk2!')).toBe('Passwords do not match');
  });

  it('accepts a valid password', () => {
    expect(validatePassword('Abcdefghijk1!', 'Abcdefghijk1!')).toBeNull();
  });
});

describe('useCreateWallet', () => {
  beforeEach(() => {
    create.mockReset();
    navigate.mockReset();
  });

  it('exposes the generated phrase as words', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.words).toHaveLength(15);
    expect(result.current.words[0]).toBe('a');
  });

  it('builds verification challenges from the phrase', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.challenges).toHaveLength(3);
    for (const c of result.current.challenges) {
      expect(result.current.words).toContain(c.answer);
    }
  });

  it('keeps the same phrase across re-renders', () => {
    const { result, rerender } = renderHook(() => useCreateWallet());
    const first = result.current.words.join(' ');
    rerender();
    expect(result.current.words.join(' ')).toBe(first);
  });

  it('rejects an invalid password without calling create', async () => {
    const { result } = renderHook(() => useCreateWallet());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.submit('short', 'short');
    });
    expect(ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Password must be at least 12 characters');
  });

  it('creates the wallet with hasBackup true when the password is valid', async () => {
    create.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCreateWallet());
    await act(async () => {
      await result.current.submit('Abcdefghijk1!', 'Abcdefghijk1!');
    });
    expect(create).toHaveBeenCalledWith(
      'a b c d e f g h i j k l m n o',
      'Abcdefghijk1!',
      'My Account',
      true,
    );
  });

  it('reports a seed generation failure instead of crashing', async () => {
    const { Seed } = await import('data-service/classes/Seed');
    vi.mocked(Seed.create).mockImplementationOnce(() => {
      throw new Error('entropy unavailable');
    });
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.seedError).toMatch(/could not generate/i);
    expect(result.current.words).toEqual([]);
  });

  it('surfaces a creation failure as an error and preserves the phrase', async () => {
    create.mockRejectedValue(new Error('vault locked'));
    const { result } = renderHook(() => useCreateWallet());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.submit('Abcdefghijk1!', 'Abcdefghijk1!');
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('vault locked');
    expect(result.current.words).toHaveLength(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/useCreateWallet.test.tsx
```

Expected: FAIL — `Failed to resolve import "../useCreateWallet"`.

- [ ] **Step 3: Write the implementation**

Create `src/features/auth/create-wallet/useCreateWallet.ts`:

```ts
/**
 * State and side effects for the create-wallet wizard.
 *
 * Everything that touches Seed, AuthContext or the router lives here so the
 * step components stay presentational and this can be tested without rendering
 * a wizard. Behaviour is carried over from the screen this replaces, with one
 * change: `hasBackup` is now earned by passing verification rather than by
 * ticking a checkbox.
 */
import { Seed } from 'data-service/classes/Seed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';
import { buildChallenges, type VerifyChallenge } from './verification';

export interface CreateWalletApi {
  words: string[];
  challenges: VerifyChallenge[];
  isLedgerSupported: boolean;
  isCopied: boolean;
  isSubmitting: boolean;
  error: string;
  /** Set when Seed.create() threw; the phrase step shows this with a retry. */
  seedError: string;
  regenerateSeed: () => void;
  copyPhrase: () => Promise<void>;
  submit: (password: string, confirm: string) => Promise<boolean>;
}

/**
 * Validate a password against the wallet's rules.
 *
 * @returns An error message, or null when the password is acceptable.
 */
export function validatePassword(password: string, confirm: string): string | null {
  if (!password) return 'Please enter a password';
  if (password.length < 12) return 'Password must be at least 12 characters';

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    return 'Password must contain uppercase, lowercase, a digit, and a special character';
  }

  if (password !== confirm) return 'Passwords do not match';
  return null;
}

export function useCreateWallet(): CreateWalletApi {
  // Generated once per mount. A re-generated phrase mid-flow would invalidate
  // whatever the user has already written down, so this only changes when the
  // user explicitly retries after a generation failure.
  const [attempt, setAttempt] = useState(0);
  const [seedState] = useMemo(() => {
    try {
      return [{ seed: Seed.create(), seedError: '' }];
    } catch (err) {
      logger.error('[CreateWallet] seed generation failed:', err);
      return [{ seed: null, seedError: 'Could not generate a recovery phrase. Try again.' }];
    }
    // `attempt` is the retry trigger: bumping it regenerates the phrase.
  }, [attempt]);

  const seed = seedState.seed;
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { create, user, isAuthenticated, getActiveState } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();
  const navigate = useNavigate();

  const words = useMemo(() => (seed ? seed.phrase.split(' ') : []), [seed]);
  const challenges = useMemo(() => buildChallenges(words), [words]);
  const regenerateSeed = useCallback(() => setAttempt((n) => n + 1), []);

  // WebHID, so Chrome and Edge only.
  const isLedgerSupported = typeof navigator !== 'undefined' && 'hid' in navigator;

  // Navigation is deferred until creation has settled, so ProtectedRoute sees
  // isAuthenticated before the route changes.
  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting && !isCreating) {
      void navigate(getActiveState('wallet'), { replace: true });
    }
  }, [isAuthenticated, user, isSubmitting, isCreating, navigate, getActiveState]);

  const copyPhrase = useCallback(async () => {
    if (seed) await copyToClipboard(seed.phrase);
  }, [copyToClipboard, seed]);

  const submit = useCallback(
    async (password: string, confirm: string): Promise<boolean> => {
      setError('');

      if (!seed) {
        setError('No recovery phrase was generated. Go back and try again.');
        return false;
      }

      const invalid = validatePassword(password, confirm);
      if (invalid) {
        setError(invalid);
        return false;
      }

      setIsSubmitting(true);
      setIsCreating(true);
      try {
        if (isAuthenticated && user) {
          // Additional account: the vault must be unlocked first. The seed is
          // handed over in memory, never through router state, which would
          // persist it in browser history.
          const { setSeedTransfer } = await import('@/lib/secureTransfer');
          setSeedTransfer(seed.phrase);
          setIsCreating(false);
          setIsSubmitting(false);
          void navigate('/auth/import', {
            state: { hasBackup: true, hasSeedTransfer: true, name: 'My Account' },
          });
          return true;
        }

        await create(seed.phrase, password, 'My Account', true);
        // Let React flush the auth state before the navigation effect runs.
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsCreating(false);
        setIsSubmitting(false);
        return true;
      } catch (err) {
        logger.error('[CreateWallet] creation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to create account');
        setIsSubmitting(false);
        setIsCreating(false);
        return false;
      }
    },
    [create, isAuthenticated, navigate, seed, user],
  );

  return {
    challenges,
    copyPhrase,
    error,
    isCopied,
    isLedgerSupported,
    isSubmitting,
    regenerateSeed,
    seedError: seedState.seedError,
    submit,
    words,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/useCreateWallet.test.tsx
```

Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/create-wallet/useCreateWallet.ts src/features/auth/create-wallet/__tests__/useCreateWallet.test.tsx
git commit -m "feat(exchange): extract create-wallet state into useCreateWallet"
```

---

### Task 4: ChooseMethodStep and RecoveryPhraseStep

**Files:**
- Create: `src/features/auth/create-wallet/steps/ChooseMethodStep.tsx`
- Create: `src/features/auth/create-wallet/steps/RecoveryPhraseStep.tsx`
- Test: `src/features/auth/create-wallet/__tests__/RecoveryPhraseStep.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond brand tokens
- Produces:
  - `function ChooseMethodStep(props: { isLedgerSupported: boolean; onSeed: () => void; onLedger: () => void }): JSX.Element`
  - `function RecoveryPhraseStep(props: { words: string[]; isCopied: boolean; seedError: string; onCopy: () => void; onContinue: () => void; onRetry: () => void }): JSX.Element`

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/create-wallet/__tests__/RecoveryPhraseStep.test.tsx`:

```tsx
/**
 * RecoveryPhraseStep — unit tests
 *
 * The phrase must not be readable until the user asks for it: a screenshare or
 * a passer-by should not capture it before the user has decided they are ready.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecoveryPhraseStep } from '../steps/RecoveryPhraseStep';

const WORDS = 'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron'.split(' ');

const setup = (overrides: Partial<Parameters<typeof RecoveryPhraseStep>[0]> = {}) => {
  const props = {
    isCopied: false,
    onContinue: vi.fn(),
    onCopy: vi.fn(),
    onRetry: vi.fn(),
    seedError: '',
    words: WORDS,
    ...overrides,
  };
  render(<RecoveryPhraseStep {...props} />);
  return props;
};

describe('RecoveryPhraseStep', () => {
  it('hides the phrase until revealed', () => {
    setup();
    expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument();
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'false');
  });

  it('reveals the phrase when the cover is activated', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');
  });

  it('renders every word with its position', () => {
    setup();
    expect(screen.getByText('melody')).toBeInTheDocument();
    expect(screen.getByText('iron')).toBeInTheDocument();
    expect(screen.getAllByTestId('seed-word')).toHaveLength(15);
  });

  it('copies without requiring a reveal', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(props.onCopy).toHaveBeenCalled();
  });

  it('offers a retry instead of a grid when generation failed', async () => {
    const props = setup({ seedError: 'Could not generate a recovery phrase. Try again.' });
    expect(screen.queryByTestId('seed-grid')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(props.onRetry).toHaveBeenCalled();
  });

  it('blocks continue until the phrase has been revealed', async () => {
    const props = setup();
    const next = screen.getByRole('button', { name: /saved it/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(props.onContinue).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/RecoveryPhraseStep.test.tsx
```

Expected: FAIL — `Failed to resolve import "../steps/RecoveryPhraseStep"`.

- [ ] **Step 3: Write ChooseMethodStep**

Create `src/features/auth/create-wallet/steps/ChooseMethodStep.tsx`:

```tsx
/**
 * Step 1 — how the user wants to hold their keys.
 *
 * Two equal tiles rather than a banner plus an "OR CONTINUE WITH" divider,
 * which framed Ledger as an interruption to the seed flow rather than a
 * choice between two.
 */
import KeyIcon from '@mui/icons-material/Key';
import UsbIcon from '@mui/icons-material/Usb';
import { Box, Stack, Typography } from '@mui/material';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

function MethodTile({
  description,
  disabled,
  icon,
  onClick,
  title,
}: {
  description: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={{
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        p: 2.5,
        textAlign: 'left',
        transition: 'border-color 180ms ease, transform 180ms ease, background-color 180ms ease',
        width: '100%',
        '&:hover:not(:disabled)': {
          bgcolor: 'rgba(255,255,255,0.06)',
          borderColor: palette.indigoHover,
          transform: 'translateY(-2px)',
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ color: palette.indigoHover, lineHeight: 0, mt: '2px' }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: onCanvas.primary, fontWeight: 600 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: onCanvas.secondary }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function ChooseMethodStep({
  isLedgerSupported,
  onLedger,
  onSeed,
}: {
  isLedgerSupported: boolean;
  onLedger: () => void;
  onSeed: () => void;
}) {
  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        How do you want to hold your keys?
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        Either way, your keys never leave your control.
      </Typography>

      <Stack spacing={2}>
        <MethodTile
          icon={<KeyIcon />}
          onClick={onSeed}
          title="Recovery phrase"
          description="Fifteen words you write down and store safely. Works on any device."
        />
        <MethodTile
          disabled={!isLedgerSupported}
          icon={<UsbIcon />}
          onClick={onLedger}
          title={isLedgerSupported ? 'Ledger hardware wallet' : 'Ledger — needs Chrome or Edge'}
          description="Your private keys stay on the device and never touch this browser."
        />
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 4: Write RecoveryPhraseStep**

Create `src/features/auth/create-wallet/steps/RecoveryPhraseStep.tsx`:

```tsx
/**
 * Step 2 — the recovery phrase.
 *
 * The grid is blurred until the user asks for it. Revealing is one-way: once
 * shown it stays shown, because re-hiding would only obstruct someone
 * mid-transcription. Copy works either way, so a password manager user never
 * has to put the phrase on screen at all.
 */
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

export function RecoveryPhraseStep({
  isCopied,
  onContinue,
  onCopy,
  onRetry,
  seedError,
  words,
}: {
  isCopied: boolean;
  onContinue: () => void;
  onCopy: () => void;
  onRetry: () => void;
  seedError: string;
  words: string[];
}) {
  const [revealed, setRevealed] = useState(false);

  // Generation failed: there is no phrase to show, so offer a retry rather
  // than an empty grid the user cannot act on.
  if (seedError) {
    return (
      <Box>
        <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 1 }}>
          Your recovery phrase
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {seedError}
        </Alert>
        <Button fullWidth onClick={onRetry} sx={{ bgcolor: palette.indigoHover }} variant="contained">
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Your recovery phrase
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 2 }}>
        Write these {words.length} words down in order and store them offline.
      </Typography>

      {/* Replaces the orange warning banner: same weight of message, in the
          brand's own palette rather than a colour used nowhere else. */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'flex-start',
          bgcolor: 'rgba(124, 92, 255, 0.08)',
          border: '1px solid rgba(124, 92, 255, 0.35)',
          borderRadius: '12px',
          mb: 2.5,
          p: 1.75,
        }}
      >
        <ShieldIcon sx={{ color: palette.indigoHover, fontSize: 20, mt: '1px' }} />
        <Typography variant="body2" sx={{ color: onCanvas.primary }}>
          Anyone with these words controls your funds. Never type them into a website and never
          store them on this device.
        </Typography>
      </Stack>

      <Box sx={{ position: 'relative' }}>
        <Box
          data-testid="seed-grid"
          data-revealed={revealed ? 'true' : 'false'}
          sx={{
            display: 'grid',
            filter: revealed ? 'none' : 'blur(7px)',
            gap: 1,
            gridTemplateColumns: { md: 'repeat(5, 1fr)', sm: 'repeat(3, 1fr)', xs: 'repeat(2, 1fr)' },
            transition: 'filter 320ms ease',
            userSelect: revealed ? 'auto' : 'none',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          {words.map((word, index) => (
            <Stack
              key={`${index}-${word}`}
              data-testid="seed-word"
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'baseline',
                animation: revealed ? 'seed-word-in 260ms ease both' : 'none',
                animationDelay: revealed ? `${index * 25}ms` : '0ms',
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                px: 1.25,
                py: 0.75,
                '@keyframes seed-word-in': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'none' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            >
              <Typography variant="caption" sx={{ color: onCanvas.secondary, minWidth: 16 }}>
                {index + 1}
              </Typography>
              <Typography sx={{ color: onCanvas.primary, fontFamily: 'monospace', fontSize: 14 }}>
                {word}
              </Typography>
            </Stack>
          ))}
        </Box>

        {!revealed && (
          <Button
            onClick={() => setRevealed(true)}
            startIcon={<VisibilityIcon />}
            sx={{
              color: onCanvas.primary,
              inset: 0,
              position: 'absolute',
              textTransform: 'none',
              width: '100%',
            }}
          >
            Tap to reveal
          </Button>
        )}
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
        <Button
          onClick={onCopy}
          startIcon={isCopied ? <DoneIcon /> : <ContentCopyIcon />}
          sx={{ borderColor: 'rgba(255,255,255,0.25)', color: onCanvas.primary }}
          variant="outlined"
        >
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          disabled={!revealed}
          fullWidth
          onClick={onContinue}
          sx={{ bgcolor: palette.indigoHover }}
          variant="contained"
        >
          I've saved it
        </Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/RecoveryPhraseStep.test.tsx
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/create-wallet/steps/ src/features/auth/create-wallet/__tests__/RecoveryPhraseStep.test.tsx
git commit -m "feat(exchange): add method-choice and recovery-phrase wizard steps"
```

---

### Task 5: VerifyStep and SecureStep

**Files:**
- Create: `src/features/auth/create-wallet/steps/VerifyStep.tsx`
- Create: `src/features/auth/create-wallet/steps/SecureStep.tsx`
- Test: `src/features/auth/create-wallet/__tests__/VerifyStep.test.tsx`

**Interfaces:**
- Consumes: `VerifyChallenge` from `../verification`
- Produces:
  - `function VerifyStep(props: { challenges: VerifyChallenge[]; onComplete: () => void }): JSX.Element`
  - `function SecureStep(props: { error: string; isSubmitting: boolean; onSubmit: (password: string, confirm: string) => void }): JSX.Element`

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/create-wallet/__tests__/VerifyStep.test.tsx`:

```tsx
/**
 * VerifyStep — unit tests
 *
 * Passing every challenge is the only route to the password step, so the
 * advance conditions are asserted rather than assumed.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { VerifyChallenge } from '../verification';
import { VerifyStep } from '../steps/VerifyStep';

const CHALLENGES: VerifyChallenge[] = [
  { answer: 'melody', choices: ['melody', 'rate', 'zoo', 'kid'], position: 1 },
  { answer: 'worth', choices: ['iron', 'worth', 'cook', 'safe'], position: 7 },
];

describe('VerifyStep', () => {
  it('shows the first challenge position', () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    expect(screen.getByText(/word #1/i)).toBeInTheDocument();
  });

  it('advances to the next challenge on a correct answer', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(await screen.findByText(/word #7/i)).toBeInTheDocument();
  });

  it('does not advance on a wrong answer', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'zoo' }));
    expect(screen.getByText(/word #1/i)).toBeInTheDocument();
  });

  it('marks a wrong answer without locking the user out', async () => {
    render(<VerifyStep challenges={CHALLENGES} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'zoo' }));
    expect(screen.getByRole('button', { name: 'melody' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(await screen.findByText(/word #7/i)).toBeInTheDocument();
  });

  it('calls onComplete only after every challenge passes', async () => {
    const onComplete = vi.fn();
    render(<VerifyStep challenges={CHALLENGES} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: 'melody' }));
    expect(onComplete).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'worth' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/VerifyStep.test.tsx
```

Expected: FAIL — `Failed to resolve import "../steps/VerifyStep"`.

- [ ] **Step 3: Write VerifyStep**

Create `src/features/auth/create-wallet/steps/VerifyStep.tsx`:

```tsx
/**
 * Step 3 — prove the phrase was actually written down.
 *
 * A wrong answer costs nothing but a shake: the goal is to make sure the user
 * has the phrase, not to punish a misremembered position. There is no attempt
 * counter and no lockout, because locking someone out of a wallet they have
 * already generated helps nobody.
 */
import { Box, Grow, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';
import type { VerifyChallenge } from '../verification';

export function VerifyStep({
  challenges,
  onComplete,
}: {
  challenges: VerifyChallenge[];
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);

  const challenge = challenges[index];
  if (!challenge) return null;

  const answer = (choice: string) => {
    if (choice !== challenge.answer) {
      setWrong(choice);
      return;
    }
    setWrong(null);
    if (index + 1 >= challenges.length) {
      onComplete();
      return;
    }
    setIndex(index + 1);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Confirm your phrase
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        Question {index + 1} of {challenges.length}
      </Typography>

      <Typography sx={{ color: onCanvas.primary, mb: 2 }}>
        Which word is <strong>word #{challenge.position}</strong>?
      </Typography>

      <Stack spacing={1.25}>
        {challenge.choices.map((choice, i) => (
          <Grow in key={`${challenge.position}-${choice}`} timeout={160 + i * 60}>
            <Box
              component="button"
              type="button"
              onClick={() => answer(choice)}
              sx={{
                animation: wrong === choice ? 'verify-shake 280ms ease' : 'none',
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: wrong === choice ? 'error.main' : 'rgba(255,255,255,0.12)',
                borderRadius: '12px',
                color: onCanvas.primary,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: 15,
                py: 1.5,
                transition: 'border-color 180ms ease, background-color 180ms ease',
                width: '100%',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: palette.indigoHover },
                '@keyframes verify-shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-6px)' },
                  '75%': { transform: 'translateX(6px)' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                  transition: 'none',
                },
              }}
            >
              {choice}
            </Box>
          </Grow>
        ))}
      </Stack>

      {wrong && (
        <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
          Not that one — check your written copy and try again.
        </Typography>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Write SecureStep**

Create `src/features/auth/create-wallet/steps/SecureStep.tsx`:

```tsx
/**
 * Step 4 — the password that encrypts the wallet on this device.
 *
 * The strength meter reflects the rules the hook enforces, so a user is never
 * shown a full bar for a password that will then be rejected.
 */
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

/** Count how many of the wallet's password rules a candidate satisfies (0-5). */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  return [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

const FIELD_SX = {
  '& .MuiInputBase-input': { color: onCanvas.primary },
  '& .MuiInputLabel-root': { color: onCanvas.secondary },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
  },
} as const;

export function SecureStep({
  error,
  isSubmitting,
  onSubmit,
}: {
  error: string;
  isSubmitting: boolean;
  onSubmit: (password: string, confirm: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const strength = passwordStrength(password);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password, confirm);
      }}
    >
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Secure your wallet
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        This password encrypts your wallet on this device. It cannot be reset.
      </Typography>

      <Stack spacing={2}>
        <TextField
          autoComplete="new-password"
          fullWidth
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          sx={FIELD_SX}
          type="password"
          value={password}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                bgcolor: i < strength ? palette.indigoHover : 'rgba(255,255,255,0.12)',
                borderRadius: 999,
                flex: 1,
                height: 3,
                transition: 'background-color 220ms ease',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            />
          ))}
        </Box>

        <TextField
          autoComplete="new-password"
          fullWidth
          label="Confirm password"
          onChange={(e) => setConfirm(e.target.value)}
          sx={FIELD_SX}
          type="password"
          value={confirm}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          disabled={isSubmitting}
          fullWidth
          sx={{ bgcolor: palette.indigoHover, py: 1.25 }}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? 'Creating wallet…' : 'Create wallet'}
        </Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/VerifyStep.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/create-wallet/steps/VerifyStep.tsx src/features/auth/create-wallet/steps/SecureStep.tsx src/features/auth/create-wallet/__tests__/VerifyStep.test.tsx
git commit -m "feat(exchange): add seed verification and password wizard steps"
```

---

### Task 6: CreateWalletWizard container

**Files:**
- Create: `src/features/auth/create-wallet/CreateWalletWizard.tsx`
- Create: `src/features/auth/create-wallet/index.ts`
- Test: `src/features/auth/create-wallet/__tests__/CreateWalletWizard.test.tsx`

**Interfaces:**
- Consumes: `useCreateWallet` (Task 3), `GlassCard`/`StepRail` (Task 2), all four steps (Tasks 4-5)
- Produces: `function CreateWalletWizard(): JSX.Element`, re-exported from `index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/create-wallet/__tests__/CreateWalletWizard.test.tsx`:

```tsx
/**
 * CreateWalletWizard — integration tests
 *
 * Walks the whole flow to prove the step guards hold: in particular that the
 * password step is unreachable without passing verification.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateWalletWizard } from '../CreateWalletWizard';

const PHRASE = 'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create: vi.fn().mockResolvedValue(undefined),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    user: null,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('data-service/classes/Seed', () => ({
  Seed: { create: () => ({ phrase: PHRASE }) },
}));

describe('CreateWalletWizard', () => {
  it('starts on the method step', () => {
    render(<CreateWalletWizard />);
    expect(screen.getByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('reaches the phrase step after choosing recovery phrase', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    expect(await screen.findByText(/your recovery phrase/i)).toBeInTheDocument();
  });

  it('reaches verification only after revealing and confirming the phrase', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    expect(await screen.findByText(/confirm your phrase/i)).toBeInTheDocument();
  });

  it('does not show the password step before verification passes', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    await screen.findByText(/confirm your phrase/i);
    expect(screen.queryByText(/secure your wallet/i)).not.toBeInTheDocument();
  });

  it('goes back to the previous step', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);
    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('offers no back control on the first step', () => {
    render(<CreateWalletWizard />);
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('renders the step rail with four steps', () => {
    render(<CreateWalletWizard />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/CreateWalletWizard.test.tsx
```

Expected: FAIL — `Failed to resolve import "../CreateWalletWizard"`.

- [ ] **Step 3: Write the container**

Create `src/features/auth/create-wallet/CreateWalletWizard.tsx`:

```tsx
/**
 * Four-step wallet creation.
 *
 * Replaces a single card that stacked a phrase, two password fields, a warning
 * and a checkbox past the bottom of the viewport. Each step fits a 600px
 * viewport; the container owns only which step is showing.
 */
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Fade, Slide } from '@mui/material';
import { useNavigate } from 'react-router';
import { useRef, useState } from 'react';
import { GlassCard } from '@/components/auth/GlassCard';
import { StepRail } from '@/components/auth/StepRail';
import { onCanvas } from '@/theme/landingTheme';
import { ChooseMethodStep } from './steps/ChooseMethodStep';
import { RecoveryPhraseStep } from './steps/RecoveryPhraseStep';
import { SecureStep } from './steps/SecureStep';
import { VerifyStep } from './steps/VerifyStep';
import { useCreateWallet } from './useCreateWallet';

const STEP_LABELS = ['Method', 'Phrase', 'Verify', 'Secure'];

export function CreateWalletWizard() {
  const wallet = useCreateWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // Direction only affects the slide, so a ref avoids a render purely to
  // record which way the next transition should run.
  const back = useRef(false);

  const go = (next: number) => {
    back.current = next < step;
    setStep(next);
  };

  // Back is available from every step after the first. Without it a user on
  // the verify step who needs to re-read their phrase would be stuck.
  const canGoBack = step > 0;
  const goBack = () => {
    if (canGoBack) go(step - 1);
  };

  // Swipe right to go back, on touch only. Mirrors the button rather than
  // replacing it, so the affordance is still visible.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start !== null && end !== undefined && end - start > 64) goBack();
  };

  const render = () => {
    if (step === 0) {
      return (
        <ChooseMethodStep
          isLedgerSupported={wallet.isLedgerSupported}
          onLedger={() => void navigate('/import/ledger')}
          onSeed={() => go(1)}
        />
      );
    }
    if (step === 1) {
      return (
        <RecoveryPhraseStep
          isCopied={wallet.isCopied}
          onContinue={() => go(2)}
          onCopy={() => void wallet.copyPhrase()}
          onRetry={wallet.regenerateSeed}
          seedError={wallet.seedError}
          words={wallet.words}
        />
      );
    }
    if (step === 2) {
      return <VerifyStep challenges={wallet.challenges} onComplete={() => go(3)} />;
    }
    return (
      <SecureStep
        error={wallet.error}
        isSubmitting={wallet.isSubmitting}
        onSubmit={(password, confirm) => void wallet.submit(password, confirm)}
      />
    );
  };

  return (
    <GlassCard>
      <StepRail current={step} steps={STEP_LABELS} />

      {canGoBack && (
        <Button
          onClick={goBack}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ color: onCanvas.secondary, mb: 1, minHeight: 44, textTransform: 'none' }}
        >
          Back
        </Button>
      )}

      <Box
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{ minHeight: 320, overflow: 'hidden', position: 'relative' }}
      >
        <Slide direction={back.current ? 'right' : 'left'} in key={step} timeout={280}>
          <Box>
            <Fade in timeout={320}>
              <Box>{render()}</Box>
            </Fade>
          </Box>
        </Slide>
      </Box>
    </GlassCard>
  );
}
```

Create `src/features/auth/create-wallet/index.ts`:

```ts
export { CreateWalletWizard } from './CreateWalletWizard';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/features/auth/create-wallet/__tests__/CreateWalletWizard.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/create-wallet/CreateWalletWizard.tsx src/features/auth/create-wallet/index.ts src/features/auth/create-wallet/__tests__/CreateWalletWizard.test.tsx
git commit -m "feat(exchange): assemble the create-wallet wizard container"
```

---

### Task 7: Wire into SignUp, mobile polish, retire CreateAccount

**Files:**
- Modify: `src/pages/SignUp/SignUp.tsx` — swap `CreateAccount` for `CreateWalletWizard` in both branches
- Modify: `src/components/auth/AuthScene.tsx` — rewrite the docstring convention
- Modify: `src/components/mobile/MobileAuthScreen.tsx` — sticky action area, tap targets
- Delete: `src/features/auth/CreateAccount.tsx`

**Interfaces:**
- Consumes: `CreateWalletWizard` from `@/features/auth/create-wallet`
- Produces: nothing new

- [ ] **Step 1: Confirm CreateAccount has no other consumers**

```bash
grep -rn "CreateAccount" src/ --include="*.tsx" --include="*.ts" | grep -v "features/auth/CreateAccount.tsx"
```

Expected: only `src/pages/SignUp/SignUp.tsx`. If anything else appears, stop and report — do not delete.

- [ ] **Step 2: Swap the component in SignUp**

In `src/pages/SignUp/SignUp.tsx`, replace the import:

```tsx
import { CreateWalletWizard } from '@/features/auth/create-wallet';
```

and both usages of `<CreateAccount />` with `<CreateWalletWizard />`. In the desktop branch, also delete the `Box sx={{ mt: 3 }}` wrapper holding the "Already have an account? Sign in" button — the wizard's method step now owns that choice, and the outlined button duplicates it.

- [ ] **Step 3: Rewrite the AuthScene convention note**

In `src/components/auth/AuthScene.tsx`, replace the sentence

> "light cards float on the dark field as the brightest thing in view, which is right, because the card is always the screen's one job."

with

```
 * Content sits on a translucent glass surface (see GlassCard) rather than a
 * light card. The card is still the screen's one job, but it now reads as part
 * of the same surface as the landing page instead of a panel pasted onto it.
```

- [ ] **Step 4: Mobile polish in MobileAuthScreen**

In `src/components/mobile/MobileAuthScreen.tsx`, ensure the footer region is sticky and tap targets meet 48px:

```tsx
sx={{
  bgcolor: 'transparent',
  bottom: 0,
  position: 'sticky',
  pt: 2,
  '& button': { minHeight: 48 },
}}
```

Apply to the existing footer wrapper element; do not restructure the component.

- [ ] **Step 5: Delete the replaced component**

```bash
git rm src/features/auth/CreateAccount.tsx
```

- [ ] **Step 6: Run the full gate**

```bash
cd apps/exchange && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24.18.0
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
rm -rf dist && ./node_modules/.bin/vite build
```

Expected: 0 type errors; **465 tests passing**; biome exit 0; build succeeds.

The arithmetic: 418 existing + 11 verification + 5 StepRail + 13 useCreateWallet
+ 6 RecoveryPhraseStep + 5 VerifyStep + 7 CreateWalletWizard = 465. `CreateAccount`
has no test file, so deleting it removes no assertions.

If the count differs, reconcile before committing rather than adjusting the expectation.

- [ ] **Step 7: Verify in the browser**

```bash
./node_modules/.bin/vite --host
```

Open `http://localhost:3333/signup`. Confirm: the card is dark glass on the night canvas; all four steps fit without scrolling at 1280x720; the phrase is blurred until revealed; a wrong verification answer shakes without locking; the password step is unreachable until all three challenges pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/SignUp/SignUp.tsx src/components/auth/AuthScene.tsx src/components/mobile/MobileAuthScreen.tsx
git commit -m "feat(exchange): replace the create-wallet screen with the four-step wizard"
```

---

## Phase 2 — deferred

Not part of this plan. After the wizard ships and the surface has proven itself, convert
`LoginForm` (plus `AccountSelectScreen`, which it renders), `ImportAccount` and `SeedBackup`
to `GlassCard`. Surface swap only, no logic change.

`PasswordProtection` (325 lines) and `AccountSwitcher` (243 lines) have no consumers. Flagged
as dead; deletion is a separate decision.
