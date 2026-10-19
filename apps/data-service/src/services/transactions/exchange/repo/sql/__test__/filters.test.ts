import { knex } from 'knex';
import { describe, expect, it } from 'vitest';
import { filters } from '../filters';

const pg = knex({ client: 'pg' });

describe('exchange senders filter', () => {
  it('binds senders as a varchar array, one escaped literal per element', () => {
    const sql = filters
      .senders(['3MAAA', "3MB'B"])(pg({ t: 'txs_7' }).select('t.id'))
      .toString();
    expect(sql).toContain(
      "array[order1->>'sender', order2->>'sender'] && array['3MAAA', '3MB''B']::varchar[]",
    );
  });
});
