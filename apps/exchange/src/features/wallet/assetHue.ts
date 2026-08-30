/**
 * A stable hue per asset.
 *
 * Hashed from the asset id rather than assigned by position, so an asset keeps
 * its colour when the sort order or the wallet's contents change — the colour
 * is an identity cue, and one that moves is worse than none.
 *
 * Shared rather than local to the table so the mark on a portfolio row and the
 * mark in the dialog that row opens are the same colour. Two independent
 * copies would drift the moment either changed.
 */
import { APP_TILE_HUES, type AppTileHue } from '@/theme/tokens/semantic';

export const hueFor = (assetId: string): AppTileHue => {
  let hash = 0;
  for (let i = 0; i < assetId.length; i++) {
    hash = (hash * 31 + assetId.charCodeAt(i)) % 100_000;
  }
  return APP_TILE_HUES[hash % APP_TILE_HUES.length] as AppTileHue;
};
