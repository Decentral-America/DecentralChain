/**
 * RecoveryPhraseStep — contrast regression
 *
 * `onCanvas.primary`/`onCanvas.secondary` used to be hardcoded dark-mode-only
 * ink painted directly onto `GlassCard`, which is a solid white card in light
 * mode (Task 3). `RecoveryPhraseStep.test.tsx` never wraps a `ThemeProvider`
 * either, so nothing there would catch a hardcoded white literal being
 * reintroduced — jsdom renders any syntactically valid CSS colour without
 * error, `toBeInTheDocument` included — see task-7-report.md's Step 3 note.
 *
 * These tests pin real computed colour against the token background each
 * piece of ink actually sits on, in both modes, so a future hardcoded
 * literal fails loudly instead of shipping unreadable text. Same pattern as
 * `SignUp.canvasContrast.test.tsx`: `getComputedStyle` → hex → `contrastRatio`
 * asserted directly with `toBeGreaterThanOrEqual`, never inferred through a
 * DOM-presence assertion that a bad colour would still pass.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { RecoveryPhraseStep } from '../steps/RecoveryPhraseStep';

const WORDS =
  'melody rate simple stable safe truck worth fresh attract sweet cook lobster zoo kid iron'.split(
    ' ',
  );

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */

/**
 * Asserts directly on `contrastRatio(...)`, not on a boolean wrapper —
 * `contrastRatio` returns `NaN` for an unparseable colour, and `NaN` fails
 * `toBeGreaterThanOrEqual` loudly rather than passing vacuously.
 */
const expectClearsAA = (element: HTMLElement, bg: string) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
};

type StepProps = Parameters<typeof RecoveryPhraseStep>[0];

const noop = () => {};
const baseProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  isCopied: false,
  isRevealed: false,
  onContinue: noop,
  onCopy: noop,
  onRetry: noop,
  onReveal: noop,
  seedError: '',
  words: WORDS,
  ...overrides,
});

describe('RecoveryPhraseStep — light mode ink on GlassCard', () => {
  const CARD = tokens('light').surface.overlay;
  const SHIELD_PANEL = tokens('light').accent.muted;
  const SEED_TILE = tokens('light').surface.sunken;

  const renderStep = (overrides: Partial<StepProps> = {}) =>
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <RecoveryPhraseStep {...baseProps(overrides)} />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Your recovery phrase'), CARD);
  });

  it('heading clears AA against the card on the seed-error branch too', () => {
    renderStep({ seedError: 'Could not generate a recovery phrase. Try again.' });
    expectClearsAA(screen.getByText('Your recovery phrase'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText(/write these 15 words down/i), CARD);
  });

  it('shield panel text clears AA against the panel background', () => {
    renderStep();
    expectClearsAA(screen.getByText(/anyone with these words controls your funds/i), SHIELD_PANEL);
  });

  it('the "Tap to reveal" cover clears AA against the seed tiles behind it', () => {
    renderStep({ isRevealed: false });
    expectClearsAA(screen.getByRole('button', { name: /tap to reveal/i }), SEED_TILE);
  });

  it('a revealed word clears AA against its tile background', () => {
    renderStep({ isRevealed: true });
    expectClearsAA(screen.getByText('melody'), SEED_TILE);
  });

  it('a seed position number clears AA against its tile background', () => {
    renderStep({ isRevealed: true });
    expectClearsAA(screen.getAllByTestId('seed-word')[0]!.querySelector('span')!, SEED_TILE);
  });

  it('the Copy button clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByRole('button', { name: /^copy$/i }), CARD);
  });
});

describe('RecoveryPhraseStep — dark mode ink on GlassCard', () => {
  const CARD = tokens('dark').surface.overlay;
  const SHIELD_PANEL = tokens('dark').accent.muted;
  const SEED_TILE = tokens('dark').surface.sunken;

  const renderStep = (overrides: Partial<StepProps> = {}) =>
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <RecoveryPhraseStep {...baseProps(overrides)} />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Your recovery phrase'), CARD);
  });

  it('heading clears AA against the card on the seed-error branch too', () => {
    renderStep({ seedError: 'Could not generate a recovery phrase. Try again.' });
    expectClearsAA(screen.getByText('Your recovery phrase'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText(/write these 15 words down/i), CARD);
  });

  it('shield panel text clears AA against the panel background', () => {
    renderStep();
    expectClearsAA(screen.getByText(/anyone with these words controls your funds/i), SHIELD_PANEL);
  });

  it('the "Tap to reveal" cover clears AA against the seed tiles behind it', () => {
    renderStep({ isRevealed: false });
    expectClearsAA(screen.getByRole('button', { name: /tap to reveal/i }), SEED_TILE);
  });

  it('a revealed word clears AA against its tile background', () => {
    renderStep({ isRevealed: true });
    expectClearsAA(screen.getByText('melody'), SEED_TILE);
  });

  it('a seed position number clears AA against its tile background', () => {
    renderStep({ isRevealed: true });
    expectClearsAA(screen.getAllByTestId('seed-word')[0]!.querySelector('span')!, SEED_TILE);
  });

  it('the Copy button clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByRole('button', { name: /^copy$/i }), CARD);
  });
});

/**
 * The Copy button's outline (WCAG 1.4.11, final-review item 8).
 *
 * This border is the only thing that identifies the control as a button —
 * `variant="outlined"` gives it no fill — so it is a "visual information
 * required to identify a user interface component" and owes 3:1 against the
 * surface behind it.
 *
 * It was `border.strong`, which measures 1.71:1 against the light card and
 * 1.56:1 against the dark one. That gap was recorded twice as unfixable, on a
 * justification that was factually wrong: it claimed no existing token clears
 * 3:1 there. `text.tertiary` does, comfortably, in both modes — the Task 8
 * review had already established this and the record was never acted on.
 *
 * `border.strong` remains correct where it is a *hairline between adjacent
 * surfaces* (`overlaySurface`'s card edge, the landing diagrams); the defect
 * is using it where a control's identity depends on it.
 */
describe.each([
  'light',
  'dark',
] as const)('RecoveryPhraseStep — the Copy button outline (%s mode)', (mode) => {
  it("clears WCAG 1.4.11's 3:1 non-text floor against the card behind it", () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <RecoveryPhraseStep {...baseProps()} />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: /^copy$/i });
    const border = rgbToHex(getComputedStyle(button).borderTopColor);
    expect(contrastRatio(border, tokens(mode).surface.overlay)).toBeGreaterThanOrEqual(3);
  });
});
