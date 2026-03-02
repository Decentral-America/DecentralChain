import ProviderCubensisAsModule, { ProviderCubensis } from '../src';
import { describe, it, expect } from 'vitest';

describe('Package', () => {
  it('import ProviderCubensis as module', () => {
    expect(new ProviderCubensisAsModule()).toBeInstanceOf(ProviderCubensis);
  });
});
