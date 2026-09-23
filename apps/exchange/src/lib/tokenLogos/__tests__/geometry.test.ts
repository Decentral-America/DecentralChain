import { describe, expect, it } from 'vitest';
import { LOGO_SIZE, squareCrop } from '../geometry';

describe('squareCrop', () => {
  it('takes the full frame when the image is already square', () => {
    expect(squareCrop(64, 64)).toEqual({ size: 64, sx: 0, sy: 0 });
  });

  it('centres horizontally on a landscape image', () => {
    expect(squareCrop(100, 50)).toEqual({ size: 50, sx: 25, sy: 0 });
  });

  it('centres vertically on a portrait image', () => {
    expect(squareCrop(50, 100)).toEqual({ size: 50, sx: 0, sy: 25 });
  });

  it('rounds rather than leaving a fractional offset', () => {
    expect(squareCrop(101, 50)).toEqual({ size: 50, sx: 26, sy: 0 });
  });

  it('handles an image smaller than the target without upscaling the crop box', () => {
    expect(squareCrop(32, 16)).toEqual({ size: 16, sx: 8, sy: 0 });
  });

  it('exports the submitted size the spec requires', () => {
    expect(LOGO_SIZE).toBe(256);
  });
});
