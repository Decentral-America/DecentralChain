import { describe, expect, it } from 'vitest';
import { buildApp } from '../test/app-factory';

describe('senders[] validation', () => {
  it('rejects non-address senders with 400', async () => {
    const app = buildApp();
    const res = await app.request('/v0/transactions/exchange?senders[]=abc%2Cdef%7D');
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).toContain('senders must be base58 addresses');
  });

  it('accepts base58 addresses', async () => {
    const app = buildApp();
    const res = await app.request(
      '/v0/transactions/exchange?senders[]=3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr',
    );
    expect(res.status).toBe(200);
  });
});
