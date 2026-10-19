/** index.html advertises /og-image.png for social cards; it must be a real 1200x630 PNG. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public/og-image.png', () => {
  it('is a 1200x630 PNG', () => {
    const png = readFileSync(path.resolve(import.meta.dirname, '../public/og-image.png'));
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
