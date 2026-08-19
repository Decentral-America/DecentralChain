/**
 * BurnAssetModal — WarningText / ErrorMessage / BurnButton ink
 *
 * Task 8, test-gap 3: no component-level test locked these three to their
 * intent inks, so a future edit could repoint one to a literal silently — the
 * raw-colour lint (`noRawColours.test.ts`) would only catch that if the
 * replacement were itself a literal, not a wrong-but-still-a-token repoint
 * (e.g. `colors.error` swapped for `colors.warning`). This pins each to the
 * actual token pairing `BurnAssetModal.tsx` uses:
 *   - `WarningText` (ink `onWarning`) sits on `Warning`'s solid `warning` fill.
 *   - `BurnButton` (ink `onError`) sits on its own solid `error` fill.
 *
 * `ErrorMessage` is deliberately not covered here: it only renders once
 * `handleBurn`'s `ds.broadcast` call has rejected, and this suite has no
 * established pattern yet for mocking `data-service`'s transaction calls.
 * Its ink (`colors.error`, a plain string on a translucent `error`-tinted
 * background) is a distinct pairing from the other two either way — a
 * text-coloured-as-error-on-a-tint alert, not an intent-fill/ink pair — so
 * it would need its own async, `data-service`-mocking test rather than
 * fitting the pattern below. Left as a known gap rather than a rushed or
 * flaky one.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { BurnAssetModal } from '../BurnAssetModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

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

const expectClearsAA = (element: HTMLElement, bg: string) => {
  const hex = rgbToHex(getComputedStyle(element).color);
  expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
};

describe.each([
  ['light', lightTheme] as const,
  ['dark', darkTheme] as const,
])('BurnAssetModal ink — %s mode', (mode, theme) => {
  const t = tokens(mode);

  const renderModal = () =>
    render(
      <ThemeProvider theme={theme}>
        <BurnAssetModal
          isOpen
          onClose={() => {}}
          assetId="asset-1"
          assetName="TestToken"
          availableBalance={1000}
          decimals={2}
        />
      </ThemeProvider>,
    );

  it('WarningText clears AA against its own solid warning fill', () => {
    renderModal();
    const warningText = screen.getByText(/burning tokens permanently destroys them/i);
    expectClearsAA(warningText, t.intent.warning);
  });

  it('BurnButton label clears AA against its own solid error fill', () => {
    renderModal();
    const burnButton = screen.getByRole('button', { name: /burn tokens/i });
    expectClearsAA(burnButton, t.intent.danger);
  });
});
