import { knex } from 'knex';
import { describe, expect, it } from 'vitest';
import { filters, filtersOrder } from '../filters';

const pg = knex({ client: 'pg' });

describe('ethereum-like filters', () => {
  it('filters by recipient address (resolving aliases like the transfer route)', () => {
    const sql = filters
      .recipient('3N9Q2sdkkhAnbR4XCveuRaSMLiVtvebZ3wp')(pg({ t: 'txs_18' }).select('t.id'))
      .toString();
    expect(sql).toContain('recipient_address = coalesce((select sender from txs_10');
    expect(sql).toContain("'3N9Q2sdkkhAnbR4XCveuRaSMLiVtvebZ3wp'");
    expect(filtersOrder).toContain('recipient');
  });
});
