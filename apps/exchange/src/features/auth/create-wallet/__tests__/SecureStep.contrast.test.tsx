/**
 * SecureStep — contrast regression
 *
 * `onCanvas.primary`/`onCanvas.secondary` used to be hardcoded dark-mode-only
 * ink painted directly onto `GlassCard`, which is a solid white card in light
 * mode (Task 3), and `fieldSx` painted the same ink onto the password
 * fields. No prior test wrapped this step in a `ThemeProvider`, so nothing
 * would catch a hardcoded white literal being reintroduced — jsdom renders
 * any syntactically valid CSS colour without error, `toBeInTheDocument`
 * included — see task-7-report.md's Step 3 note.
 *
 * These tests pin real computed colour against the card background the ink
 * actually sits on, in both modes, so a future hardcoded literal fails
 * loudly instead of shipping unreadable text. Same pattern as
 * `SignUp.canvasContrast.test.tsx`: `getComputedStyle` → hex → `contrastRatio`
 * asserted directly with `toBeGreaterThanOrEqual`, never inferred through a
 * DOM-presence assertion that a bad colour would still pass.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { SecureStep } from '../steps/SecureStep';

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
/**
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site here passes an
 * opaque colour, so this is exact today; it is a structural limitation of
 * this idiom (duplicated across 15+ contrast test files) rather than a bug
 * in any one test. See task-8-report.md, Finding 5.
 */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Asserts directly on `contrastRatio(...)`, not on a boolean wrapper —
 * `contrastRatio` returns `NaN` for an unparseable colour, and `NaN` fails
 * `toBeGreaterThanOrEqual` loudly rather than passing vacuously.
 */
const expectClearsAA = (element: HTMLElement, bg: string) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
};

const noop = () => {};

describe('SecureStep — light mode ink on GlassCard', () => {
  const CARD = tokens('light').surface.overlay;

  const renderStep = () =>
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <SecureStep
          confirm=""
          error=""
          isSubmitting={false}
          onConfirmChange={noop}
          onPasswordChange={noop}
          onSubmit={noop}
          password=""
        />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Secure your wallet'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText(/this password encrypts your wallet/i), CARD);
  });

  it('the Password field label clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Password', { selector: 'label' }), CARD);
  });

  it('the Password field input ink clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByLabelText('Password'), CARD);
  });
});

describe('SecureStep — dark mode ink on GlassCard', () => {
  const CARD = tokens('dark').surface.overlay;

  const renderStep = () =>
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <SecureStep
          confirm=""
          error=""
          isSubmitting={false}
          onConfirmChange={noop}
          onPasswordChange={noop}
          onSubmit={noop}
          password=""
        />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Secure your wallet'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText(/this password encrypts your wallet/i), CARD);
  });

  it('the Password field label clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByText('Password', { selector: 'label' }), CARD);
  });

  it('the Password field input ink clears AA against the card', () => {
    renderStep();
    expectClearsAA(screen.getByLabelText('Password'), CARD);
  });
});
