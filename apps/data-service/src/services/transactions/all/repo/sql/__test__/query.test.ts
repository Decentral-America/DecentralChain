import { describe, expect, it } from 'vitest';
import { EXCLUDED_TX_TYPES, select } from '../query';

describe('all-transactions base query', () => {
  it('excludes CommitToGeneration (type 19) rows that txs now inherits', () => {
    expect(EXCLUDED_TX_TYPES).toEqual([19]);
    expect(select.clone().toString()).toContain('"t"."tx_type" not in (19)');
  });
});
