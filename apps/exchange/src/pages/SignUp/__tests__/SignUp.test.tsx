/**
 * SignUp — breakpoint-flip regression
 *
 * SignUp renders the wizard from two branches rooted at different component
 * types (MobileAuthScreen vs AuthScene). If wizard state lives inside the
 * component those branches render, crossing the `md` breakpoint — a tablet
 * rotation is enough — unmounts one tree and mounts the other, regenerating
 * the seed and resetting the step.
 *
 * That is a fund-loss bug, not a cosmetic one: a user who has written down the
 * phrase from before the flip finishes the flow holding a backup for a wallet
 * that was never created. These tests pin the seed and the step index across
 * the flip.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignUp } from '../SignUp';

const PHRASE_A =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';
const PHRASE_B =
  'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar';

const { seedCreate } = vi.hoisted(() => ({ seedCreate: vi.fn() }));

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
vi.mock('data-service/classes/Seed', () => ({ Seed: { create: seedCreate } }));

/**
 * A live `matchMedia` the test can flip, so MUI's real `useMediaQuery` runs
 * rather than being stubbed out. The global stub installed by test/setup.ts is
 * inert — it never notifies — which cannot model a viewport change.
 */
const mediaListeners = new Set<() => void>();
let isNarrow = false;

const realMatchMedia = window.matchMedia;
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    addEventListener: (_type: string, cb: () => void) => {
      mediaListeners.add(cb);
    },
    addListener: (cb: () => void) => {
      mediaListeners.add(cb);
    },
    dispatchEvent: () => false,
    get matches() {
      return isNarrow && query.includes('max-width');
    },
    media: query,
    onchange: null,
    removeEventListener: (_type: string, cb: () => void) => {
      mediaListeners.delete(cb);
    },
    removeListener: (cb: () => void) => {
      mediaListeners.delete(cb);
    },
  }),
  writable: true,
});

afterAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: realMatchMedia,
    writable: true,
  });
});

/** Cross the `md` breakpoint the way a device rotation would. */
const flipToNarrow = () =>
  act(() => {
    isNarrow = true;
    for (const notify of [...mediaListeners]) notify();
  });

describe('SignUp across the md breakpoint', () => {
  beforeEach(() => {
    isNarrow = false;
    mediaListeners.clear();
    seedCreate.mockReset();
    seedCreate.mockReturnValueOnce({ phrase: PHRASE_A }).mockReturnValue({ phrase: PHRASE_B });
  });

  it('keeps the same seed phrase when the viewport crosses md', async () => {
    render(<SignUp />);

    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    expect(screen.getByText('melody')).toBeInTheDocument();

    flipToNarrow();

    // A second Seed.create() means the words the user just wrote down belong
    // to a wallet that will never be created.
    expect(seedCreate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('melody')).toBeInTheDocument();
    expect(screen.queryByText('alpha')).not.toBeInTheDocument();
  });

  it('keeps the step index when the viewport crosses md', async () => {
    render(<SignUp />);

    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    flipToNarrow();

    // The flip really happened: the desktop chrome is gone.
    expect(screen.queryByText(/start trading today/i)).not.toBeInTheDocument();
    // ...but the wizard is still on the phrase step, not back at step 0.
    expect(screen.getByText(/your recovery phrase/i)).toBeInTheDocument();
    expect(screen.queryByText(/how do you want to hold your keys/i)).not.toBeInTheDocument();
  });

  it('keeps the phrase revealed when the viewport crosses md', async () => {
    render(<SignUp />);

    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');

    flipToNarrow();

    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');
  });
});
