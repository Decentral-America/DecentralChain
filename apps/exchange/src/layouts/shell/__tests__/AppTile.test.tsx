/**
 * AppTile — anatomy, state and reach.
 *
 * Tested directly rather than through the launcher: the tile carries five
 * states, and exercising one of them through the dialog means mounting fifteen
 * tiles to look at one.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppTile } from '@/layouts/shell/AppTile';
import { LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

const SWAP = LAUNCHER_TILES.find((d) => d.label === 'Swap')!;

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function renderTile(mode: ThemeMode, active = false, onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AppTile destination={SWAP} active={active} onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  const button = screen.getByRole('button', { name: SWAP.label });
  const plate = button.querySelector('.app-tile__plate') as HTMLElement;
  return { button, onNavigate, plate };
}

describe.each(['light', 'dark'] as const)('AppTile (%s mode)', (mode) => {
  it('paints its plate from the destination hue, both halves', () => {
    const { plate } = renderTile(mode);
    const hue = tokens(mode).appTile[SWAP.hue];
    expect(toHex(getComputedStyle(plate).backgroundColor)).toBe(hue.fill);
    expect(toHex(getComputedStyle(plate).color)).toBe(hue.on);
  });

  it('its glyph clears AA against the plate it sits on', () => {
    const { plate } = renderTile(mode);
    const ink = toHex(getComputedStyle(plate).color);
    const fill = toHex(getComputedStyle(plate).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('its label clears AA against the dialog ground, not the plate', () => {
    const { button } = renderTile(mode);
    const label = screen.getByText(SWAP.label);
    const ink = toHex(getComputedStyle(label).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
    // The label sits outside the plate, so its legibility depends on one
    // verified surface rather than on eight separate fills.
    expect(button.querySelector('.app-tile__plate')?.contains(label)).toBe(false);
  });

  it('marks the current destination without relying on the fill', () => {
    const { button, plate } = renderTile(mode, true);
    expect(button).toHaveAttribute('aria-current', 'page');
    // The fill identifies the feature, so the state has to be carried by the
    // ring instead. Asserted as present-vs-absent rather than by matching the
    // colour inside the shorthand: jsdom is free to normalise a hex in
    // `box-shadow` to `rgb()`, and an assertion that depends on which it picks
    // is a coin flip, not a test.
    expect(getComputedStyle(plate).boxShadow).not.toBe('none');
  });

  it('leaves a non-current destination without the marker or the ring', () => {
    const { button, plate } = renderTile(mode, false);
    expect(button).not.toHaveAttribute('aria-current');
    expect(getComputedStyle(plate).boxShadow).toBe('none');
  });
});

describe('AppTile behaviour', () => {
  it('navigates to its destination on click', async () => {
    const { button, onNavigate } = renderTile('light');
    button.click();
    expect(onNavigate).toHaveBeenCalledWith(SWAP.path);
  });

  it('exposes its description without needing a hover', () => {
    const { button } = renderTile('light');
    const id = button.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toBe(SWAP.description);
  });

  it('hides the glyph from assistive tech and names itself by its label', () => {
    const { button, plate } = renderTile('light');
    expect(plate).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAccessibleName(SWAP.label);
  });
});
