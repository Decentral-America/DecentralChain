/**
 * CreateWalletWizard — integration tests
 *
 * Walks the whole flow to prove the step guards hold: in particular that the
 * password step is unreachable without passing verification.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateWalletWizard } from '../CreateWalletWizard';

const PHRASE =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron';

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

  it('keeps the phrase revealed after going back and returning to the phrase step', async () => {
    render(<CreateWalletWizard />);
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
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 100 }] });

    expect(await screen.findByText(/how do you want to hold your keys/i)).toBeInTheDocument();
  });

  it('swiping right below the threshold does not go back', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 50 }] });

    expect(screen.getByText(/your recovery phrase/i)).toBeInTheDocument();
  });

  it('swiping left does not go back', async () => {
    render(<CreateWalletWizard />);
    await userEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));
    await screen.findByText(/your recovery phrase/i);

    const area = screen.getByTestId('wizard-step-area');
    fireEvent.touchStart(area, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 20 }] });

    expect(screen.getByText(/your recovery phrase/i)).toBeInTheDocument();
  });
});
