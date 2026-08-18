/**
 * RecoveryPhraseStep — unit tests
 *
 * The real words must be absent from the DOM until the user asks for them: a
 * screen reader, view-source, DevTools, or Ctrl+F must not be able to pick up
 * the phrase before the user has decided they are ready to see it.
 *
 * The step is fully controlled, so these tests hold `isRevealed` in a harness
 * the way the wizard's hook does — there is no local state to fall back on.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RecoveryPhraseStep } from '../steps/RecoveryPhraseStep';

const WORDS =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron'.split(
    ' ',
  );

type StepProps = Parameters<typeof RecoveryPhraseStep>[0];

const setup = (overrides: Partial<StepProps> = {}) => {
  const spies = {
    onContinue: vi.fn(),
    onCopy: vi.fn(),
    onRetry: vi.fn(),
    onReveal: vi.fn(),
  };

  function Harness() {
    // Stands in for useCreateWallet, which owns `isRevealed` in the app.
    const [isRevealed, setIsRevealed] = useState(false);
    return (
      <RecoveryPhraseStep
        isCopied={false}
        isRevealed={isRevealed}
        onContinue={spies.onContinue}
        onCopy={spies.onCopy}
        onReveal={() => {
          spies.onReveal();
          setIsRevealed(true);
        }}
        onRetry={spies.onRetry}
        seedError=""
        words={WORDS}
        {...overrides}
      />
    );
  }

  render(<Harness />);
  return spies;
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

  it('asks the caller to reveal rather than deciding on its own', async () => {
    const onReveal = vi.fn();
    setup({ isRevealed: false, onReveal });
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(onReveal).toHaveBeenCalledTimes(1);
    // Controlled: with `isRevealed` pinned false the grid stays covered, so a
    // caller that forgets to wire the pair fails loudly here rather than
    // silently losing the guarantee that revealing survives a remount.
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'false');
  });

  it('renders as revealed when the caller says it already is', () => {
    setup({ isRevealed: true });
    expect(screen.getByTestId('seed-grid')).toHaveAttribute('data-revealed', 'true');
    expect(screen.queryByRole('button', { name: /reveal/i })).not.toBeInTheDocument();
  });

  it('keeps the real words out of the DOM until revealed', async () => {
    setup();
    expect(screen.queryByText('melody')).not.toBeInTheDocument();
    expect(screen.queryByText('iron')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(screen.getByText('melody')).toBeInTheDocument();
    expect(screen.getByText('iron')).toBeInTheDocument();
  });

  it('renders every word with its position once revealed', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(screen.getByText('melody')).toBeInTheDocument();
    expect(screen.getByText('iron')).toBeInTheDocument();
    expect(screen.getAllByTestId('seed-word')).toHaveLength(15);
  });

  it('pairs word N with numeral N, in phrase order', async () => {
    // A phrase transcribed out of order restores nothing, and the mistake is
    // invisible until the user needs the wallet back.
    setup();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    const slots = screen.getAllByTestId('seed-word');
    expect(slots).toHaveLength(WORDS.length);
    slots.forEach((slot, index) => {
      expect(slot).toHaveTextContent(new RegExp(`^${index + 1}${WORDS[index]}$`));
    });
  });

  it('copies without requiring a reveal', async () => {
    const spies = setup();
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(spies.onCopy).toHaveBeenCalled();
  });

  it('offers a retry instead of a grid when generation failed', async () => {
    const spies = setup({ seedError: 'Could not generate a recovery phrase. Try again.' });
    expect(screen.queryByTestId('seed-grid')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(spies.onRetry).toHaveBeenCalled();
  });

  it('blocks continue until the phrase has been revealed', async () => {
    const spies = setup();
    const next = screen.getByRole('button', { name: /saved it/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /reveal/i }));
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(spies.onContinue).toHaveBeenCalled();
  });
});
