/**
 * The launcher's tile list.
 *
 * Two properties that are easy to break silently and impossible to see in
 * review: that every destination names a hue the token family actually
 * defines, and that no two tiles of one hue end up touching.
 *
 * Adjacency depends on the column count, which is why the grid pins its
 * columns instead of auto-filling. This test and
 * `AppLauncher`'s `gridTemplateColumns` have to agree — change one without the
 * other and this fails, which is the point.
 */
import { describe, expect, it } from 'vitest';
import { LAUNCHER_TILES, TOP_TABS } from '@/layouts/shell/navigation';
import { APP_TILE_HUES } from '@/theme/tokens/semantic';

/** The three counts `AppLauncher` pins its grid to, at xs / sm / md+. */
const COLUMN_COUNTS = [3, 4, 7];

describe('LAUNCHER_TILES', () => {
  it('lists fifteen destinations, each path once', () => {
    const paths = LAUNCHER_TILES.map((d) => d.path);
    expect(paths).toHaveLength(15);
    expect(new Set(paths).size).toBe(15);
  });

  it('gives every destination a hue the token family defines', () => {
    for (const destination of LAUNCHER_TILES) {
      expect(APP_TILE_HUES).toContain(destination.hue);
    }
  });

  it.each(COLUMN_COUNTS)('places no two tiles of one hue adjacently at %i columns', (columns) => {
    const clashes: string[] = [];
    LAUNCHER_TILES.forEach((tile, index) => {
      const rightIndex = index + 1;
      const belowIndex = index + columns;
      const hasRightNeighbour = (index % columns) + 1 < columns;
      if (hasRightNeighbour && LAUNCHER_TILES[rightIndex]?.hue === tile.hue) {
        clashes.push(`${tile.label} / ${LAUNCHER_TILES[rightIndex]?.label} (${tile.hue})`);
      }
      if (LAUNCHER_TILES[belowIndex]?.hue === tile.hue) {
        clashes.push(`${tile.label} / ${LAUNCHER_TILES[belowIndex]?.label} (${tile.hue})`);
      }
    });
    expect(clashes).toEqual([]);
  });
});

describe('TOP_TABS', () => {
  it('is built from the very objects the grid renders', () => {
    // Identity, not equality: the previous version indexed into the group
    // arrays positionally, so reordering a group silently retitled the top bar.
    for (const tab of TOP_TABS) {
      expect(LAUNCHER_TILES).toContain(tab);
    }
  });

  it('is the four destinations worth a click from anywhere', () => {
    expect(TOP_TABS.map((t) => t.label)).toEqual(['Dashboard', 'Portfolio', 'Trade', 'Swap']);
  });
});
