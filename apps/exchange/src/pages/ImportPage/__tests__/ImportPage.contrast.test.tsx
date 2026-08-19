/**
 * ImportPage — both-mode contrast
 *
 * `ImportPage.tsx` never imported `brandInk`/`onCanvas`/`brandCanvas` either
 * — every colour role (`background.default`, `primary.main`,
 * `primary.contrastText`, `divider`, `text.secondary`) is theme-relative, so
 * removing its `<ThemeProvider theme={landingTheme}>` wrapper (task 5)
 * re-derives them from the real app theme automatically. This test verifies
 * that claim on both the desktop method cards and the mobile shell (which
 * has its own dedicated regression coverage in
 * `MobileAuthShell.test.tsx` — task-5-report.md).
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { ImportPage } from '../ImportPage';

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

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

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

const renderDesktop = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <ImportPage />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('ImportPage — desktop (%s mode)', (mode) => {
  it('the "Seed Phrase" card title clears AA against the canvas', () => {
    renderDesktop(mode);
    const heading = screen.getByText('Seed Phrase');
    const ink = rgbToHex(getComputedStyle(heading).color);
    const bg = rgbToHex(nearestBackground(heading));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the page heading clears AA against the canvas', () => {
    renderDesktop(mode);
    const heading = screen.getByText('Import Account');
    const ink = rgbToHex(getComputedStyle(heading).color);
    const bg = rgbToHex(nearestBackground(heading));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(['light', 'dark'] as const)('ImportPage — mobile shell (%s mode)', (mode) => {
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

  it('the mobile heading clears AA on the mobile shell (fixed white, never follows mode)', () => {
    renderDesktop(mode);
    const heading = screen.getByText('Choose your import method');
    const ink = rgbToHex(getComputedStyle(heading).color);
    // The mobile shell's own content region has no explicit background of
    // its own (transparent), so it inherits the shell root's fixed white.
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
