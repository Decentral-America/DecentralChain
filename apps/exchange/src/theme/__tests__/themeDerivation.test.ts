/**
 * Theme derivation — unit tests
 *
 * The MUI theme and the styled-components theme are two consumers of one token
 * set. These tests pin that they actually agree: the historical bug was three
 * independent systems that only looked similar.
 */
import { describe, expect, it } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { createAppTheme } from '../mui-theme';
import { tokens } from '../tokens/semantic';

describe('createAppTheme', () => {
  it('takes its palette from the semantic tokens', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = tokens(mode);
      const mui = createAppTheme(mode);
      expect(mui.palette.mode).toBe(mode);
      expect(mui.palette.background.default).toBe(t.surface.base);
      expect(mui.palette.background.paper).toBe(t.surface.raised);
      expect(mui.palette.text.primary).toBe(t.text.primary);
      expect(mui.palette.divider).toBe(t.border.subtle);
    }
  });

  it('produces genuinely different palettes per mode', () => {
    expect(createAppTheme('light').palette.background.default).not.toBe(
      createAppTheme('dark').palette.background.default,
    );
  });
});

describe('styled-components themes', () => {
  it('take the same values as MUI for the same mode', () => {
    // One source, two consumers — if these disagree the app has two looks again.
    expect(lightTheme.colors.background).toBe(tokens('light').surface.base);
    expect(darkTheme.colors.background).toBe(tokens('dark').surface.base);
    expect(lightTheme.colors.text).toBe(tokens('light').text.primary);
    expect(darkTheme.colors.text).toBe(tokens('dark').text.primary);
  });
});
