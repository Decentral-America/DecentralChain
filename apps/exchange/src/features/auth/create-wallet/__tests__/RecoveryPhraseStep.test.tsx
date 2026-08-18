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

const WORDS =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron'.split(
    ' ',
  );

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
