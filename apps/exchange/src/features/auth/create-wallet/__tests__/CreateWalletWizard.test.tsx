/**
 * CreateWalletWizard — integration tests
 *
 * Walks the whole flow to prove the step guards hold: in particular that the
 * password step is unreachable without passing verification, and that stepping
 * back neither empties the password fields nor leaves a dead error on screen.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateWalletWizard } from '../CreateWalletWizard';
import { useCreateWallet } from '../useCreateWallet';

const PHRASE =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';
const WORDS = PHRASE.split(' ');
const VALID_PASSWORD = 'Abcdefghijk1!';

const { authCreate } = vi.hoisted(() => ({ authCreate: vi.fn() }));

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

/** Answer every verification challenge correctly, reading positions off screen. */
const answerAllChallenges = async () => {
  for (let asked = 0; asked < 3; asked++) {
    const prompt = await screen.findByText(/which word is/i);
    const position = Number(/#(\d+)/.exec(prompt.textContent ?? '')?.[1]);
    const word = WORDS[position - 1] as string;
    await userEvent.click(screen.getByRole('button', { name: word }));
  }
};

/** Method → phrase → reveal → verify → password. */
const goToPasswordStep = async () => {
  await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
  await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
  await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
  await answerAllChallenges();
  await screen.findByText(/secure your wallet/i);
};

describe('CreateWalletWizard', () => {
  beforeEach(() => {
    authCreate.mockReset();
    authCreate.mockResolvedValue(undefined);
  });

  it('starts on the method step', () => {
    render(<Wizard />);
    expect(screen.getByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('reaches the phrase step after choosing recovery phrase', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    expect(await screen.findByText(/your recovery phrase/i)).toBeInTheDocument();
  });

  it('reaches verification only after revealing and confirming the phrase', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    expect(await screen.findByText(/confirm your phrase/i)).toBeInTheDocument();
  });

  it('does not show the password step before verification passes', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    await userEvent.click(screen.getByRole('button', { name: /saved it/i }));
    await screen.findByText(/confirm your phrase/i);
    expect(screen.queryByText(/secure your wallet/i)).not.toBeInTheDocument();
  });

  it('goes back to the previous step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);
    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('offers no back control on the first step', () => {
    render(<Wizard />);
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('renders the step rail with four steps', () => {
    render(<Wizard />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
  });

  it('keeps the phrase revealed after going back and returning to the phrase step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reveal/i }));
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');

    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await screen.findByText(/how do you want to hold your keys/i);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));

    expect(await screen.findByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');
    expect(screen.queryByRole('button', { name: /reveal/i })).not.toBeInTheDocument();
  });

  it('swiping right past the threshold goes back a step', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 100 }] });

    expect(await screen.findByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('swiping right below the threshold does not go back', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 50 }] });

    expect(screen.getByText(/your recovery phrase/i)).toBeInTheDocument();
  });

  it('swiping left does not go back', async () => {
    render(<Wizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 20 }] });

    expect(screen.getByText(/your recovery phrase/i)).toBeInTheDocument();
  });

  it('keeps the entered password when the user steps back and returns', async () => {
    render(<Wizard />);
    await goToPasswordStep();
    await userEvent.type(screen.getByLabelText('Password'), VALID_PASSWORD);

    await userEvent.click(screen.getByRole('button', { name: /^back$/i }));
    await screen.findByText(/confirm your phrase/i);
    await answerAllChallenges();

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
    await screen.findByText(/confirm your phrase/i);
    await answerAllChallenges();
    await screen.findByText(/secure your wallet/i);

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
