/**
 * CreateToken — both-mode contrast
 *
 * `CreateToken.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — it imported `landingTheme` only for the wrapper.
 * But it carries a large amount of its own fixed light-only literal colour
 * (`#F8FAFD`, `#E5EDF5`, `#E8E9FF`, `#FDF6E9`, `#FDF1F0`, `#533afd`) used as
 * panel/alert backgrounds holding theme-relative ink (`text.secondary`,
 * default inherited ink, `primary.main`/`contrastText`). Under the old
 * wrapper that ink was always the same fixed light value the panels were
 * designed for, so nothing broke. Once the wrapper is gone, dark mode's ink
 * reaches these still-fixed-light panels for the first time: several measure
 * ~1.0-1.9:1 pre-fix — see task-6-report.md for the full table.
 *
 * The left "brand" panel (`background:'#533afd', color:'white'`) is a
 * deliberate fixed-brand surface, kept fixed in both modes (6.19:1, verified
 * below) — the same "fixed panel, fixed ink" pattern Task 5 established for
 * `LandingPage`'s canvas. Its "customize" `IconButton`, however, sits on a
 * fixed `bgcolor:'white'` badge but left its icon ink to MUI's *ambient*
 * `action.active` default — light in light mode (dark ink on white: fine),
 * `#fff` in MUI's stock dark palette (white-on-white, ~1:1) once real dark
 * mode reaches it.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceProvider } from '@/components/atoms/SurfaceContext';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { CreateToken } from '../CreateToken';

/**
 * Every `userEvent.setup` here passes `{ delay: null }`. These twelve tests
 * each type ~13 characters and click through three steps of a heavy MUI form,
 * and user-event's default inter-keystroke wait dominated their runtime —
 * enough that this file was the first to time out under full-suite parallel
 * load. Dropping the delay does not weaken anything: the assertions read
 * computed styles after the interaction, not during it.
 *
 * The timeout ceiling itself is set globally in `vitest.config.ts`; see the
 * note there for why 5s stopped being enough at 911 tests.
 */

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));
vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({ balances: { available: 0 } }),
}));
vi.mock('@/hooks/useTransactionSigning', () => ({
  useTransactionSigning: () => ({ signIssue: vi.fn() }),
}));

/**
 * `getComputedStyle(el).color`/`.backgroundColor` on a MUI
 * `variant="contained"`/`"outlined"` `Button` returns the raw
 * `var(--variant-containedColor)`/`var(--variant-containedBg)` reference in
 * jsdom rather than a resolved colour — jsdom does not resolve `var()` in
 * computed shorthand properties, but it does compute the custom property
 * itself (and jsdom's computed value is additionally lowercased, so the
 * property name must be matched case-insensitively). Resolve it by hand
 * when this happens.
 */
function resolveVar(style: CSSStyleDeclaration, value: string): string {
  const match = value.match(/^var\((--[\w-]+)\)$/);
  if (!match) return value;
  const wanted = match[1]!.toLowerCase();
  for (const prop of Array.from(style)) {
    if (prop.toLowerCase() === wanted) return style.getPropertyValue(prop).trim();
  }
  throw new Error(`Could not resolve ${match[1]}`);
}

/**
 * `resolveVar` only unwraps the `var()` indirection — its result can still
 * be an `rgb(...)` string (e.g. a literal `sx` override that never goes
 * through a custom property at all). `contrastRatio` is hex-only and
 * returns `NaN` for `rgb()`/`rgba()` input with no error (fix round 1: this
 * gap let a real `NaN` failure get reported as if it were the number
 * `2.946089016228706` — the number itself was right, computed by hand, but
 * it was never actually observed from a run until this fix). Always finish
 * by normalising to hex.
 */
function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function computedColor(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return toHex(resolveVar(style, style.color));
}

function computedBackground(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return toHex(resolveVar(style, style.backgroundColor));
}

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <CreateToken />
    </ThemeProvider>,
  );

/** Advances the wizard to the Review step (step 3) with valid data. */
async function goToReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Enter token name'), 'TESTTOKEN');
  await user.click(screen.getByRole('button', { name: /next/i }));
  await user.type(screen.getByPlaceholderText('Enter total quantity'), '1000');
  await user.click(screen.getByRole('button', { name: /next/i }));
  await user.click(screen.getByRole('button', { name: /next/i }));
}

describe.each(['light', 'dark'] as const)('CreateToken — step 0 (%s mode)', (mode) => {
  it('the canvas actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const panel = screen.getByText('Token Name *').closest('.MuiPaper-root') as HTMLElement;
    expect(rgbToHex(getComputedStyle(panel).backgroundColor)).toBe(tokens(mode).surface.raised);
  });

  it('the fixed brand panel ink clears AA against its own fixed fill, in both modes', () => {
    renderIn(mode);
    const title = screen.getByText('Token Information');
    const ink = rgbToHex(getComputedStyle(title).color);
    expect(contrastRatio(ink, '#533afd')).toBeGreaterThanOrEqual(4.5);
  });

  it('the "Next" button ink clears AA against its fixed brand fill, once enabled', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    // The button is disabled (exempt from AA) until the step is valid — a
    // real user only ever sees it as the ink/fill pair asserted below.
    await user.type(screen.getByPlaceholderText('Enter token name'), 'TESTTOKEN');
    const button = screen.getByRole('button', { name: /next/i });
    expect(button).toBeEnabled();
    const ink = computedColor(button);
    const bg = computedBackground(button);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each([
  'light',
  'dark',
] as const)('CreateToken — step 2, no-script box (%s mode)', (mode) => {
  it('the "No Script Required" panel copy clears AA against its own panel', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await user.type(screen.getByPlaceholderText('Enter token name'), 'TESTTOKEN');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByPlaceholderText('Enter total quantity'), '1000');
    await user.click(screen.getByRole('button', { name: /next/i }));

    for (const text of [
      screen.getByText('No Script Required'),
      screen.getByText(/Your token will be created as a standard asset/),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each(['light', 'dark'] as const)('CreateToken — step 3, review (%s mode)', (mode) => {
  it('the Token Preview panel name and quantity clear AA against their panel', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const panel = screen.getByText('Token Preview').nextElementSibling as HTMLElement;
    for (const text of [
      within(panel).getByText('TESTTOKEN'),
      within(panel).getByText('1,000 TESTTOKEN'),
    ]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the Details Summary rows clear AA against their panel', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const row = screen.getByText('Quantity').closest('div')!;
    const value = screen.getByText('1,000');
    for (const text of [screen.getByText('Quantity'), value]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(row).toBeInTheDocument();
  });

  it('the "Important Notice" warning banner clears AA against its own background', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const alert = screen.getByText('Important Notice').closest('[role="alert"]') as HTMLElement;
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(getComputedStyle(alert).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the Transaction Fees panel heading and total clear AA against their panel', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    for (const text of [screen.getByText('Transaction Fees'), screen.getByText('Total Cost')]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the Insufficient Balance error banner clears AA against its own background', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const alert = screen.getByText('Insufficient Balance').closest('[role="alert"]') as HTMLElement;
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(getComputedStyle(alert).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the "customize" icon button ink clears AA against its own fixed white badge', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const button = screen.getByRole('button', { name: /customize token appearance/i });
    const icon = button.querySelector('svg')!;
    const ink = rgbToHex(getComputedStyle(icon).color);
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('the "Create Token" button ink clears AA against its fixed brand fill, once enabled', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);
    // Disabled until the terms checkbox is agreed — exempt from AA until
    // then (WCAG 1.4.3 excludes inactive controls). Check it, as a real
    // user must, to reach the ink/fill pair that is actually shown.
    await user.click(screen.getByRole('checkbox'));
    const button = screen.getByRole('button', { name: /create token/i });
    expect(button).toBeEnabled();
    const ink = computedColor(button);
    const bg = computedBackground(button);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * The pinned mobile step bar (final-review item 3).
 *
 * On a phone the stepper pins under the band and, when it does, gains its own
 * surface so it stays legible over the content scrolling beneath it. That
 * surface was `mobileSurface.card` — `palette.pureWhite`, `#ffffff`, and
 * `styles/mobileTokens.ts` has no mode dimension at all, so it is a fixed
 * light fill by construction. The `StepLabel` inside takes MUI's mode-aware
 * `text.primary`/`text.secondary`, so in dark mode the ink flips to `#f5f4ff`
 * on `#ffffff`: 1.09:1. The one piece of the form that exists to survive
 * being glanced at is exactly the piece that disappears.
 *
 * The surface arrives with the pinning, so the *pinned* state is the one
 * under test: `SurfaceProvider compact` puts the bar in its sticky branch,
 * and the `stuck` scroll probe resolves true on mount in jsdom (the bar's
 * `getBoundingClientRect().top` and its resolved `top` are both 0), which is
 * asserted below rather than assumed — a transparent bar would mean this
 * test measured nothing.
 */
describe.each([
  'light',
  'dark',
] as const)('CreateToken — pinned mobile step bar (%s mode)', (mode) => {
  it('the pinned bar paints a mode-aware surface, and its labels clear AA on it', () => {
    render(
      <ThemeProvider theme={createAppTheme(mode)}>
        <CssBaseline />
        <SurfaceProvider compact>
          <CreateToken />
        </SurfaceProvider>
      </ThemeProvider>,
    );

    const label = screen.getByText('Basic Info');
    const bar = label.closest('.MuiStepper-root')?.parentElement as HTMLElement;
    expect(bar).not.toBeNull();

    const fill = computedBackground(bar);
    // The bar is genuinely in its pinned state — otherwise the fill is
    // `transparent` and the contrast assertion below proves nothing.
    expect(getComputedStyle(bar).position).toBe('sticky');
    expect(fill).not.toBe('rgba(0, 0, 0, 0)');

    // Both the active label and a not-yet-reached one: MUI gives them
    // `text.primary` and `text.secondary` respectively, and the fill has to
    // carry both. Asserted before the token identity below, so a run
    // against the broken source reports the ratio that actually breaks the
    // screen rather than a colour mismatch.
    for (const text of ['Basic Info', 'Review']) {
      const ink = computedColor(screen.getByText(text));
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }

    expect(fill).toBe(tokens(mode).surface.raised);
  });
});
