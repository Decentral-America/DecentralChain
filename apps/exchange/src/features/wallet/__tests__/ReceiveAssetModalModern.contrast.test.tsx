/**
 * ReceiveAssetModalModern — the address well's ink and surface, in both modes
 *
 * The redesigned dialog is a title bar ("Receive DCC" and a close button), a
 * line of secondary copy, the address QR on a white `QRCodeCard` plate, the
 * address itself in a mode-aware well, a "Copy address" button and a warning
 * note.
 *
 * Dropped: the header badge case. It measured the `CallReceived` icon's
 * `intent.onSuccess` ink against the badge's fixed `intent.success` fill
 * (5.34:1 after fix round 1 repointed it off `text.primary`'s 3.42:1). The
 * redesign removed the badge outright and the title bar carries no icon, so
 * there is no ink-on-fill pair left to measure.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { ReceiveAssetModalModern } from '../ReceiveAssetModalModern';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3P123', name: 'Trader' } }),
}));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <ReceiveAssetModalModern isOpen onClose={vi.fn()} assetName="DCC" />
      </StyledThemeProvider>
    </ThemeProvider>,
  );
}

/**
 * The wallet address well (final-review item 1).
 *
 * `bgcolor: 'grey.50'` *looks* like a theme token, so the raw-colour lint
 * passes it and Task 8's review explicitly classified `grey.NNN` dot-paths as
 * false positives to exclude. But MUI's grey palette is **mode-invariant** —
 * `grey.50` is `#fafafa` in light *and* dark — so it behaves exactly like a
 * hardcoded hex. The address `Typography` inside declared no `color` at all,
 * so it inherited the Dialog paper's mode-aware `text.primary`: fine in light
 * but 1.04:1 in dark. The user's own wallet address, the one thing this modal
 * exists to show, was invisible.
 *
 * This is the same defect class as a hex literal, which is why the assertion
 * below measures behaviour (ink vs the fill actually painted) rather than
 * syntax.
 */
describe.each([
  'light',
  'dark',
] as const)('ReceiveAssetModalModern — address well (%s mode)', (mode) => {
  it('the address ink clears AA against the surface it is actually painted on', () => {
    renderIn(mode);
    const address = screen.getByText('3P123');
    const well = address.closest('.MuiCard-root') as HTMLElement;
    expect(well).not.toBeNull();
    const ink = toHex(getComputedStyle(address).color);
    const fill = toHex(getComputedStyle(well).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('the well and its border move with the mode instead of pinning a fixed grey', () => {
    renderIn(mode);
    const well = screen.getByText('3P123').closest('.MuiCard-root') as HTMLElement;
    const style = getComputedStyle(well);
    expect(toHex(style.backgroundColor)).toBe(tokens(mode).surface.sunken);
    expect(toHex(style.borderTopColor)).toBe(tokens(mode).border.subtle);
  });
});
