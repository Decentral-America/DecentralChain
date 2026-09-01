/**
 * The submitted format, matching the convention contributors already know from
 * Trust Wallet: 256x256 PNG. The small variants the app actually renders are
 * derived in the logo repository, not here.
 */
export const LOGO_SIZE = 256;

export interface CropRect {
  sx: number;
  sy: number;
  size: number;
}

/**
 * The largest centred square that fits the source.
 *
 * Pure on purpose: jsdom has no canvas, so this is the part that can be tested.
 * Cropping before scaling is what stops a wide banner being squashed into a
 * circle — the icon is round, so the corners are discarded anyway.
 */
export function squareCrop(width: number, height: number): CropRect {
  const size = Math.min(width, height);
  return {
    size,
    sx: Math.round((width - size) / 2),
    sy: Math.round((height - size) / 2),
  };
}
