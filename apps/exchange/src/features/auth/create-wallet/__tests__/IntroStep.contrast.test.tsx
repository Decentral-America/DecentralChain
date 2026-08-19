/**
 * IntroStep — contrast regression
 *
 * `onCanvas.primary`/`onCanvas.secondary` used to be hardcoded dark-mode-only
 * ink painted directly onto `GlassCard`, which is a solid white card in light
 * mode (Task 3). `IntroStep.test.tsx` renders this step with no
 * `ThemeProvider` at all, so nothing there would catch a hardcoded white
 * literal being reintroduced: any syntactically valid CSS colour renders
 * without error in jsdom, `toBeInTheDocument` included — see
 * task-7-report.md's Step 3 note.
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
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { IntroStep } from '../steps/IntroStep';

/** `getComputedStyle` reports `rgb(r, g, b)`; `contrastRatio` takes hex only. */
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
 * `contrastRatio` returns `NaN` for an unparseable (e.g. `rgba(...)`) colour,
 * and `NaN` fails `toBeGreaterThanOrEqual` loudly rather than passing
 * vacuously the way `toBeGreaterThan` would with a truthy/falsy shortcut.
 */
const expectClearsAA = (element: HTMLElement, bg: string) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
};

describe('IntroStep — light mode ink on GlassCard', () => {
  const CARD = tokens('light').surface.overlay;
  const LEDGER_TILE = tokens('light').surface.sunken;

  const renderIntro = (showLedger = false) =>
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <IntroStep onContinue={() => {}} onLedger={() => {}} showLedger={showLedger} />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText('Before you start'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText(/three things to know/i), CARD);
  });

  it('bullet title clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText('Your keys stay on this device'), CARD);
  });

  it('bullet description clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText(/nothing is uploaded/i), CARD);
  });

  it('Ledger tile title clears AA against its tile background', () => {
    renderIntro(true);
    expectClearsAA(screen.getByText('Ledger hardware wallet'), LEDGER_TILE);
  });

  it('Ledger tile description clears AA against its tile background', () => {
    renderIntro(true);
    expectClearsAA(screen.getByText(/private keys stay on the device/i), LEDGER_TILE);
  });
});

describe('IntroStep — dark mode ink on GlassCard', () => {
  const CARD = tokens('dark').surface.overlay;
  const LEDGER_TILE = tokens('dark').surface.sunken;

  const renderIntro = (showLedger = false) =>
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <IntroStep onContinue={() => {}} onLedger={() => {}} showLedger={showLedger} />
      </ThemeProvider>,
    );

  it('heading clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText('Before you start'), CARD);
  });

  it('subtitle clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText(/three things to know/i), CARD);
  });

  it('bullet title clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText('Your keys stay on this device'), CARD);
  });

  it('bullet description clears AA against the card', () => {
    renderIntro();
    expectClearsAA(screen.getByText(/nothing is uploaded/i), CARD);
  });

  it('Ledger tile title clears AA against its tile background', () => {
    renderIntro(true);
    expectClearsAA(screen.getByText('Ledger hardware wallet'), LEDGER_TILE);
  });

  it('Ledger tile description clears AA against its tile background', () => {
    renderIntro(true);
    expectClearsAA(screen.getByText(/private keys stay on the device/i), LEDGER_TILE);
  });
});
