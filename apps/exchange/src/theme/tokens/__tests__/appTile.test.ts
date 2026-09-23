/**
 * `appTile` — both-mode contrast.
 *
 * Eight fills is eight more things that can drift, so the floors are asserted
 * per hue rather than spot-checked. A hue added or edited without clearing both
 * modes fails here, which is the only thing keeping the family honest.
 */
import { describe, expect, it } from 'vitest';
import { APP_TILE_HUES, contrastRatio, tokens } from '@/theme/tokens/semantic';

describe.each(['light', 'dark'] as const)('appTile (%s mode)', (mode) => {
  it.each(APP_TILE_HUES)('%s: its glyph ink clears 4.5:1 on its own fill', (hue) => {
    const { fill, on } = tokens(mode).appTile[hue];
    expect(contrastRatio(on, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(APP_TILE_HUES)('%s: its fill is distinguishable from the ground', (hue) => {
    const t = tokens(mode);
    expect(contrastRatio(t.appTile[hue].fill, t.surface.base)).toBeGreaterThanOrEqual(3);
  });

  it('defines exactly the eight hues the type names', () => {
    expect(Object.keys(tokens(mode).appTile).sort()).toEqual([...APP_TILE_HUES].sort());
  });
});
