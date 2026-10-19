/**
 * The launcher's tile list.
 *
 * Two properties that are easy to break silently and impossible to see in
 * review: that every destination names a hue the token family actually
 * defines, and that no two tiles of one hue end up touching — on the mainnet
 * grid (15 tiles) and on test-network grids, where Swap is absent because no
 * AMM is deployed there.
 */
import { describe, expect, it } from 'vitest';
import {
  type Destination,
  LAUNCHER_COLUMNS,
  LAUNCHER_TILES,
  launcherTilesFor,
  SWAP,
  TOP_TABS,
  topTabsFor,
} from '@/layouts/shell/navigation';
import { APP_TILE_HUES } from '@/theme/tokens/semantic';

const COLUMN_COUNTS = Object.values(LAUNCHER_COLUMNS);

function hueClashes(tiles: Destination[], columns: number): string[] {
  const clashes: string[] = [];
  tiles.forEach((tile, index) => {
    const right = tiles[index + 1];
    const below = tiles[index + columns];
    const hasRightNeighbour = (index % columns) + 1 < columns;
    if (hasRightNeighbour && right?.hue === tile.hue) {
      clashes.push(`${tile.label} / ${right.label} (${tile.hue})`);
    }
    if (below?.hue === tile.hue) clashes.push(`${tile.label} / ${below.label} (${tile.hue})`);
  });
  return clashes;
}

describe.each([
  { ammSupported: true, count: 15 },
  { ammSupported: false, count: 14 },
])('launcherTilesFor(ammSupported: $ammSupported)', ({ ammSupported, count }) => {
  const tiles = launcherTilesFor(ammSupported);

  it(`lists ${count} destinations, each path once`, () => {
    const paths = tiles.map((d) => d.path);
    expect(paths).toHaveLength(count);
    expect(new Set(paths).size).toBe(count);
  });

  it('offers Swap only where an AMM is deployed', () => {
    expect(tiles.includes(SWAP)).toBe(ammSupported);
  });

  it('gives every destination a hue the token family defines', () => {
    for (const destination of tiles) expect(APP_TILE_HUES).toContain(destination.hue);
  });

  it.each(COLUMN_COUNTS)('places no two tiles of one hue adjacently at %i columns', (columns) => {
    expect(hueClashes(tiles, columns)).toEqual([]);
  });
});

describe('TOP_TABS', () => {
  it('is built from the very objects the grid renders', () => {
    for (const tab of TOP_TABS) expect(LAUNCHER_TILES).toContain(tab);
  });

  it('is Dashboard, Portfolio, Trade, Swap where an AMM exists', () => {
    expect(topTabsFor(true).map((t) => t.label)).toEqual([
      'Dashboard',
      'Portfolio',
      'Trade',
      'Swap',
    ]);
  });

  it('replaces Swap with Markets on networks without an AMM', () => {
    const tabs = topTabsFor(false);
    expect(tabs.map((t) => t.label)).toEqual(['Dashboard', 'Portfolio', 'Trade', 'Markets']);
    for (const tab of tabs) expect(launcherTilesFor(false)).toContain(tab);
  });
});
