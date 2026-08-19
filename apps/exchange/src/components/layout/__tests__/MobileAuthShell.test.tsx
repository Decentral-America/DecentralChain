/**
 * MobileAuthShell — ink contrast against its fixed white surface
 *
 * The shell is a permanently white full-screen sheet (`bgcolor: '#FFFFFF'`,
 * unconditional — this mobile chrome, like the rest of `styles/mobileTokens`,
 * is a deliberately fixed brand surface, not one that follows the app's
 * light/dark toggle). But its back icon, divider and action labels were
 * painted with ambient MUI theme roles (`text.primary`, `divider`,
 * `primary.main`) rather than the fixed `mobileTokens` set every sibling
 * mobile component uses.
 *
 * `ImportPage` and `ImportAccountPage` used to force those roles to fixed
 * light values via `<ThemeProvider theme={landingTheme}>` (task-5-report.md).
 * Once that wrapper is gone, dark mode resolves `text.primary` to
 * `tokens('dark').text.primary` (`#f5f4ff`, near white) painted on the
 * shell's own permanently white background — effectively invisible.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { MobileAuthShell } from '../MobileAuthShell';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

// The shell only renders below the `md` breakpoint; the global stub in
// test/setup.ts never matches, so it renders `null` without this.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: true,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    }),
    writable: true,
  });
});

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

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <MobileAuthShell actionLabel="Sign In" actionRoute="/sign-in">
        <div>content</div>
      </MobileAuthShell>
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('MobileAuthShell (%s mode)', (mode) => {
  it('the back icon button clears AA against the shell’s white surface', () => {
    renderIn(mode);
    const back = screen.getByRole('button', { name: /back/i });
    const ink = rgbToHex(getComputedStyle(back).color);
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('the primary action label clears AA against the shell’s white surface', () => {
    renderIn(mode);
    const action = screen.getByRole('button', { name: 'Sign In' });
    const ink = rgbToHex(getComputedStyle(action).color);
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
