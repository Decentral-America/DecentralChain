/**
 * CreateToken — both-mode contrast
 *
 * `CreateToken.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas`/
 * `palette.indigoHover` — it imported `landingTheme` only for the wrapper.
 * But it used to carry a large amount of its own fixed light-only literal
 * colour (`#F8FAFD`, `#E5EDF5`, `#E8E9FF`, `#FDF6E9`, `#FDF1F0`, `#533afd`) as
 * panel/alert backgrounds holding theme-relative ink (`text.secondary`,
 * default inherited ink, `primary.main`/`contrastText`). Under the old
 * wrapper that ink was always the same fixed light value the panels were
 * designed for, so nothing broke. Once the wrapper was gone, dark mode's ink
 * reached these still-fixed-light panels for the first time: several measured
 * ~1.0-1.9:1 pre-fix — see task-6-report.md for the full table.
 *
 * The redesign rebuilt the page out of shared pieces, and every surface now
 * comes from a theme role rather than a literal: a `WizardRail` for progress,
 * one MUI `Card` holding the current step (the step title, `InsetLabelField`s,
 * an `EmptyState`, `SettingsGroup` inset lists for the review), and the
 * guidance — the step description and a tip — as quiet text in an `aside` on
 * the page canvas. The fixed `#533afd` brand panel that used to hold the step
 * title and description is gone; that copy now sits on the card and the
 * canvas, and is measured there. The review's "customize" badge (a fixed
 * white chip over the token avatar) is gone with no replacement; the token
 * monogram it floated over remains, and its ink/fill pair is asserted
 * instead. The same regression — ink that follows the mode on a surface that
 * does not — is still what every case below is written to catch.
 *
 * The premium components read `theme.colors`/`theme.mode` from
 * styled-components, and the app mounts that provider beside MUI's above
 * every page, so this does too.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceProvider } from '@/components/atoms/SurfaceContext';
import { darkTheme, lightTheme } from '@/styles/themes';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { CreateToken } from '../CreateToken';

/**
 * Every `userEvent.setup` here passes `{ delay: null }`. These tests each type
 * ~13 characters and click through three steps of a heavy form, and
 * user-event's default inter-keystroke wait dominated their runtime — enough
 * that this file was the first to time out under full-suite parallel load.
 * Dropping the delay does not weaken anything: the assertions read computed
 * styles after the interaction, not during it.
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

/**
 * The text's ink against the colour actually painted behind it, which must be
 * the surface the caller names: the card, an inset group, or the page canvas.
 * Pinning the surface keeps a measurement from quietly falling through to
 * whatever happens to be underneath if the surface it was written for stopped
 * painting.
 */
function expectLegibleOn(text: HTMLElement, surface: string) {
  const ink = rgbToHex(getComputedStyle(text).color);
  const bg = rgbToHex(paintedBackground(text));
  expect(bg).toBe(surface);
  expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
}

const Providers = ({ mode, children }: { mode: ThemeMode; children: ReactNode }) => (
  <ThemeProvider theme={createAppTheme(mode)}>
    <StyledThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      {children}
    </StyledThemeProvider>
  </ThemeProvider>
);

const renderIn = (mode: ThemeMode) =>
  render(
    <Providers mode={mode}>
      <CreateToken />
    </Providers>,
  );

/**
 * Steps change inside `AnimatePresence mode="wait"`, so the next step's
 * fields mount only once the outgoing one has left — found, not got.
 */
async function toSmartAssetStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Token name'), 'TESTTOKEN');
  await user.click(screen.getByRole('button', { name: /next/i }));
  await user.type(await screen.findByLabelText('Quantity'), '1000');
  await user.click(screen.getByRole('button', { name: /next/i }));
  await screen.findByText('No script required');
}

/** Advances the wizard to the Review step (step 3) with valid data. */
async function goToReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await toSmartAssetStep(user);
  await user.click(screen.getByRole('button', { name: /next/i }));
  await screen.findByText('Token details');
}

describe.each(['light', 'dark'] as const)('CreateToken — step 0 (%s mode)', (mode) => {
  it('the form surface actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    // The "Token name" field paints its own `colors.surface` container, on
    // the step card's `background.paper`: both are the raised surface.
    const field = screen.getByLabelText('Token name').parentElement as HTMLElement;
    expect(rgbToHex(getComputedStyle(field).backgroundColor)).toBe(tokens(mode).surface.raised);
    const card = field.closest('.MuiCard-root') as HTMLElement;
    expect(rgbToHex(getComputedStyle(card).backgroundColor)).toBe(tokens(mode).surface.raised);
  });

  it('the step title and guidance copy clear AA against the surface each sits on', () => {
    // These used to share the fixed `#533afd` brand panel. The title now
    // heads the step card; the description and tip sit in the aside, on the
    // page canvas.
    renderIn(mode);
    expectLegibleOn(
      screen.getByRole('heading', { level: 2, name: 'Token Information' }),
      tokens(mode).surface.raised,
    );

    const aside = screen.getByRole('complementary', { name: 'Guidance' });
    for (const text of [
      within(aside).getByText('Step 1 of 4'),
      within(aside).getByText(/Define the fundamental properties of your token/),
      within(aside).getByText('Token Name Guidelines'),
      within(aside).getByText(/Choose a clear and memorable name/),
    ]) {
      expectLegibleOn(text, tokens(mode).surface.base);
    }
  });

  it('the "Next" button ink clears AA against its fixed brand fill, once enabled', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    // The button is disabled (exempt from AA) until the step is valid — a
    // real user only ever sees it as the ink/fill pair asserted below.
    await user.type(screen.getByLabelText('Token name'), 'TESTTOKEN');
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
] as const)('CreateToken — step 2, no-script state (%s mode)', (mode) => {
  it('the "No script required" copy clears AA against the step card', async () => {
    // Was a tinted "No Script Required" panel; it is now an `EmptyState`
    // drawn straight onto the step card.
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await toSmartAssetStep(user);

    for (const text of [
      screen.getByText('No script required'),
      screen.getByText(/Your token will be created as a standard asset/),
    ]) {
      expectLegibleOn(text, tokens(mode).surface.raised);
    }
  });
});

describe.each(['light', 'dark'] as const)('CreateToken — step 3, review (%s mode)', (mode) => {
  it('the token preview name and quantity clear AA against the step card', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    // The preview is no longer its own panel: the name and quantity sit on
    // the step card beside the token's monogram.
    const quantity = screen.getByText('1,000 TESTTOKEN');
    const name = quantity.previousElementSibling as HTMLElement;
    expect(name).toHaveTextContent(/^TESTTOKEN$/);
    for (const text of [name, quantity]) {
      expectLegibleOn(text, tokens(mode).surface.raised);
    }
  });

  it('the "Token details" rows clear AA against their inset group', async () => {
    // Was the "Details Summary" panel; now a `SettingsGroup` whose rows sit
    // on its own `colors.surface`.
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const group = screen.getByText('Token details').closest('section') as HTMLElement;
    for (const text of [within(group).getByText('Quantity'), within(group).getByText('1,000')]) {
      expectLegibleOn(text, tokens(mode).surface.raised);
    }
  });

  it('the "Important notice" warning banner clears AA against its own background', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const alert = screen.getByText('Important notice').closest('[role="alert"]') as HTMLElement;
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(getComputedStyle(alert).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the "Transaction fees" heading and total clear AA against the surface each sits on', async () => {
    // The heading heads its inset group on the step card; "Total cost" is a
    // row inside the group's own surface. Both surfaces are the raised one.
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    for (const text of [screen.getByText('Transaction fees'), screen.getByText('Total cost')]) {
      expectLegibleOn(text, tokens(mode).surface.raised);
    }
  });

  it('the "Insufficient balance" error banner clears AA against its own background', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const alert = screen.getByText('Insufficient balance').closest('[role="alert"]') as HTMLElement;
    const ink = rgbToHex(getComputedStyle(alert).color);
    const bg = rgbToHex(getComputedStyle(alert).backgroundColor);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the token monogram ink clears AA against its accent fill', async () => {
    // Replaces the "customize" badge case: that fixed-white chip is gone with
    // no equivalent. The monogram it sat on is the preview's one filled mark,
    // so its ink/fill pair is what has to survive both modes now.
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);

    const monogram = screen.getByText('1,000 TESTTOKEN').parentElement!
      .previousElementSibling as HTMLElement;
    expect(monogram).toHaveTextContent(/^T$/);
    const ink = rgbToHex(getComputedStyle(monogram).color);
    const bg = rgbToHex(paintedBackground(monogram));
    expect(bg).toBe(tokens(mode).accent.primary);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the "Create Token" button ink clears AA against its fixed brand fill, once enabled', async () => {
    const user = userEvent.setup({ delay: null });
    renderIn(mode);
    await goToReviewStep(user);
    // Disabled until the terms checkbox is agreed — exempt from AA until
    // then (WCAG 1.4.3 excludes inactive controls). Check it, as a real
    // user must, to reach the ink/fill pair that is actually shown.
    await user.click(screen.getByRole('checkbox', { name: /agree/i }));
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
 * On a phone the progress rail pins under the band and, when it does, gains
 * its own surface so it stays legible over the content scrolling beneath it.
 * That surface used to be `palette.pureWhite`, `#ffffff`, from a
 * `styles/mobileTokens.ts` with no mode dimension at all — a fixed light fill
 * by construction — while the step labels on it took mode-aware ink, so in
 * dark mode the ink flipped to `#f5f4ff` on `#ffffff`: 1.09:1. The one piece
 * of the form that exists to survive being glanced at was exactly the piece
 * that disappeared. `mobileSurface.card` is now `var(--surface-canvas)`, which
 * follows `data-theme`; `paintedBackground` resolves it for the mode.
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
      <Providers mode={mode}>
        <SurfaceProvider compact>
          <CreateToken />
        </SurfaceProvider>
      </Providers>,
    );

    const rail = screen.getByRole('list', { name: 'Token creation steps' });
    let bar: HTMLElement | null = rail;
    while (bar && getComputedStyle(bar).position !== 'sticky') bar = bar.parentElement;
    // The bar is genuinely in its pinned state — otherwise it is not sticky,
    // its fill is `transparent`, and the contrast below proves nothing.
    expect(bar).not.toBeNull();
    expect(getComputedStyle(bar!).backgroundColor).not.toMatch(/transparent|rgba\(0, 0, 0, 0\)/);
    const fill = rgbToHex(paintedBackground(bar!, mode));

    // The rail names the current step above it in `colors.text`, with its
    // "· 1 of 4" count in `colors.textSecondary`: the two inks the fill has
    // to carry. A not-yet-reached step is its numbered chip, on the chip's
    // own surface. Asserted before the token identity below, so a run
    // against a broken source reports the ratio that actually breaks the
    // screen rather than a colour mismatch.
    const current = screen.getByText('Basic Info');
    expect(getComputedStyle(current).opacity).toBe('1');
    const count = current.lastElementChild as HTMLElement;
    expect(count).toHaveTextContent('· 1 of 4');
    for (const text of [current, count]) {
      const ink = rgbToHex(getComputedStyle(text).color);
      expect(rgbToHex(paintedBackground(text, mode))).toBe(fill);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }

    const reviewChip = screen.getByText('Step 4 of 4: Review').nextElementSibling as HTMLElement;
    expect(reviewChip).toHaveTextContent(/^4$/);
    const chipInk = rgbToHex(getComputedStyle(reviewChip).color);
    const chipFill = rgbToHex(paintedBackground(reviewChip, mode));
    expect(contrastRatio(chipInk, chipFill)).toBeGreaterThanOrEqual(4.5);

    expect(fill).toBe(tokens(mode).surface.raised);
  });
});
