import { ProviderCubensis } from '../src';
import { describe, it, expect } from 'vitest';

describe('Package', () => {
  it('exports ProviderCubensis as a named export', () => {
    expect(ProviderCubensis).toBeDefined();
    expect(typeof ProviderCubensis).toBe('function');
  });

  it('ProviderCubensis can be instantiated', () => {
    expect(new ProviderCubensis()).toBeInstanceOf(ProviderCubensis);
  });
});
