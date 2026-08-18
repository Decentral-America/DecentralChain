/**
 * CreateWalletWizard — integration tests
 *
 * Walks the whole flow to prove the step guards hold: in particular that the
 * password step is unreachable until the phrase has been revealed — the only
 * evidence behind `hasBackup: true` now that verification is gone — and that
 * stepping back neither empties the password fields nor leaves a dead error on
 * screen.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateWalletWizard } from '../CreateWalletWizard';
import { useCreateWallet } from '../useCreateWallet';

const PHRASE =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';
const VALID_PASSWORD = 'Abcdefghijk1!';

const { authCreate } = vi.hoisted(() => ({ authCreate: vi.fn() }));
const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create: authCreate,
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

/**
 * The wizard is presentational — its state lives in useCreateWallet, called by
 * the page above the responsive branch (see SignUp). This is the composition
 * the app ships.
 */
function Wizard() {
  return <CreateWalletWizard wallet={useCreateWallet()} />;
}

/** Add or remove WebHID the way a Chrome/Safari split would. */
const setWebHid = (present: boolean) => {
  if (present) {
    Object.defineProperty(navigator, 'hid', { configurable: true, value: {} });
  } else {
    Reflect.deleteProperty(navigator, 'hid');
  }
};

/** Intro → phrase → reveal → password. */
const goToPasswordStep = async () => {
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
  await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
  await screen.findByRole('heading', { name: /secure your wallet/i });
};

describe('CreateWalletWizard', () => {
  beforeEach(() => {
    authCreate.mockReset();
    authCreate.mockResolvedValue(undefined);
    ledgerFlag.enabled = false;
    setWebHid(false);
  });

  afterEach(() => {
    setWebHid(false);
  });

  it('starts on the intro step', () => {
    render(<Wizard />);
    expect(screen.getByRole('heading', { name: /before you start/i })).toBeInTheDocument();
  });

  it('announces the new step to assistive technology on every change', async () => {
    render(<Wizard />);
    const announcer = screen.getByTestId('wizard-announcer');

    // Polite, so the announcement queues rather than interrupting; atomic, so
    // the whole sentence is re-read instead of only the digit that changed.
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
    expect(announcer).toHaveTextContent('Step 1 of 3: Before you start');

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(announcer).toHaveTextContent('Step 2 of 3: Your recovery phrase'));

    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    await waitFor(() => expect(announcer).toHaveTextContent('Step 3 of 3: Secure your wallet'));

    // Backwards too — the announcement tracks the step, not the direction.
    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await waitFor(() => expect(announcer).toHaveTextContent('Step 2 of 3: Your recovery phrase'));
  });

  it('moves focus to the new step heading, but does not steal focus on mount', async () => {
    render(<Wizard />);

    // On mount the user has not acted yet; taking focus here would drag them
    // past the progress rail before they had read anything.
    expect(document.activeElement).toBe(document.body);

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    const heading = await screen.findByRole('heading', { name: /your recovery phrase/i });
    await waitFor(() => expect(heading).toHaveFocus());
    // Programmatically focusable only — it must not join the tab order.
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('reaches the phrase step from the intro', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(
      await screen.findByRole('heading', { name: /your recovery phrase/i }),
    ).toBeInTheDocument();
  });

  it('reaches the password step after revealing and confirming the phrase', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    expect(await screen.findByRole('heading', { name: /secure your wallet/i })).toBeInTheDocument();
  });

  it('does not reach the password step until the phrase has been revealed', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });

    // The reveal is the whole of the evidence behind hasBackup: true, so the
    // way forward stays shut until the words have been on screen.
    const savedIt = screen.getByRole('button', { name: /saved it/i });
    expect(savedIt).toBeDisabled();
    // fireEvent rather than userEvent: userEvent refuses to touch a disabled
    // control, so it could not tell a real guard from a merely greyed-out one.
    fireEvent.click(savedIt);

    expect(screen.getByRole('heading', { name: /your recovery phrase/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /secure your wallet/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('goes back to the previous step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });
    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByRole('heading', { name: /before you start/i })).toBeInTheDocument();
  });

  it('offers no back control on the first step', () => {
    render(<Wizard />);
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('renders the step rail with three steps', () => {
    render(<Wizard />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3');
  });

  it('hides the Ledger tile on the intro step while the flag is off', () => {
    setWebHid(true);
    render(<Wizard />);
    expect(screen.queryByRole('button', { name: /ledger/i })).not.toBeInTheDocument();
  });

  it('shows the Ledger tile on the intro step when the flag is on and WebHID is available', () => {
    ledgerFlag.enabled = true;
    setWebHid(true);
    render(<Wizard />);
    expect(screen.getByRole('button', { name: /ledger hardware wallet/i })).toBeInTheDocument();
  });

  it('keeps the phrase revealed after going back and returning to the phrase step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');

    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await screen.findByRole('heading', { name: /before you start/i });
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');
    expect(screen.queryByRole('button', { name: /reveal/i })).not.toBeInTheDocument();
  });

  it('swiping right past the threshold goes back a step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 100 }] });

    expect(await screen.findByRole('heading', { name: /before you start/i })).toBeInTheDocument();
  });

  it('swiping right below the threshold does not go back', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 50 }] });

    expect(screen.getByRole('heading', { name: /your recovery phrase/i })).toBeInTheDocument();
  });

  it('swiping left does not go back', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 20 }] });

    expect(screen.getByRole('heading', { name: /your recovery phrase/i })).toBeInTheDocument();
  });

  it('keeps the entered password when the user steps back and returns', async () => {
    render(<Wizard />);
    await goToPasswordStep();
    await userEvent.type(screen.getByLabelText('Password'), VALID_PASSWORD);

    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));

    expect(await screen.findByLabelText('Password')).toHaveValue(VALID_PASSWORD);
  });

  it('drops a failed attempt error when the user leaves the password step', async () => {
    authCreate.mockRejectedValue(new Error('vault locked'));
    render(<Wizard />);
    await goToPasswordStep();
    await userEvent.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await userEvent.type(screen.getByLabelText('Confirm password'), VALID_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: /^create wallet$/i }));
    expect(await screen.findByText('vault locked')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await screen.findByRole('heading', { name: /your recovery phrase/i });
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    await screen.findByRole('heading', { name: /secure your wallet/i });

    // The error belonged to an attempt the user has since navigated away from;
    // showing it above untouched fields describes a failure that did not happen.
    expect(screen.queryByText('vault locked')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue(VALID_PASSWORD);
  });

  it('disables Back while the wallet is being created', async () => {
    let release: () => void = () => {};
    authCreate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => resolve();
        }),
    );

    render(<Wizard />);
    await goToPasswordStep();
    await userEvent.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await userEvent.type(screen.getByLabelText('Confirm password'), VALID_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: /^create wallet$/i }));

    // Back mid-flight would unmount the only component that renders `error`,
    // so a later rejection would fail silently.
    expect(await screen.findByRole('button', { name: /creating wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^back$/i })).toBeDisabled();

    await act(async () => {
      release();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /^back$/i })).toBeEnabled());
  });
});
