import ProviderCubensisAsModule, { ProviderCubensis } from '../src';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('Package', () => {
  it('import ProviderCubensis as module', () => {
    expect(new ProviderCubensisAsModule()).to.be.instanceof(ProviderCubensis);
  });
});
