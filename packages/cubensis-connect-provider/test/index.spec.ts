import { describe, expect, it } from 'vitest';
import { ProviderCubensis } from '../src';

describe('Package', () => {
  it('exports ProviderCubensis as a named export', () => {
    expect(ProviderCubensis).toBeDefined();
    expect(typeof ProviderCubensis).toBe('function');
  });

  it('ProviderCubensis can be instantiated', () => {
    expect(new ProviderCubensis()).toBeInstanceOf(ProviderCubensis);
  });
});
