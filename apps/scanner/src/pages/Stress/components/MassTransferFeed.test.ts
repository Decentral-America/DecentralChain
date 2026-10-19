import { describe, expect, it } from 'vitest';
import { txDetailHref } from './MassTransferFeed';

describe('txDetailHref', () => {
  it('links to this explorer, not an external host', () => {
    expect(txDetailHref('ABC123')).toBe('/transaction?id=ABC123');
  });
});
