/**
 * Overlay surface — unit tests
 *
 * Dark translucent glass has no honest light inversion: the same treatment with
 * light values is a grey box. So this returns different *constructions* per
 * mode, and these tests pin that difference rather than treating it as a bug.
 */
import { describe, expect, it } from 'vitest';
import { overlaySurface } from '../surfaces';

describe('overlaySurface', () => {
  it('uses a blur in dark mode', () => {
    const s = overlaySurface('dark') as Record<string, unknown>;
    expect(String(s['backdropFilter'])).toContain('blur');
    expect(String(s['WebkitBackdropFilter'])).toContain('blur');
  });

  it('uses no blur in light mode', () => {
    const s = overlaySurface('light') as Record<string, unknown>;
    expect(s['backdropFilter']).toBeUndefined();
    expect(s['WebkitBackdropFilter']).toBeUndefined();
  });

  it('is opaque in light mode so text contrast is never left to chance', () => {
    const s = overlaySurface('light') as Record<string, unknown>;
    expect(String(s['backgroundColor'])).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('gives both modes a border and a shadow', () => {
    for (const mode of ['light', 'dark'] as const) {
      const s = overlaySurface(mode) as Record<string, unknown>;
      expect(s['border']).toBeTruthy();
      expect(s['boxShadow']).toBeTruthy();
    }
  });

  it('gives both modes the same radius, so cards match across modes', () => {
    const light = overlaySurface('light') as Record<string, unknown>;
    const dark = overlaySurface('dark') as Record<string, unknown>;
    expect(light['borderRadius']).toBe(dark['borderRadius']);
  });
});
