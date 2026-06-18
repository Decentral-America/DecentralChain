import { broadcast, massTransfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('MassTransfer (type 11)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  const recipients = Array.from({ length: 5 }, () => randomTestAccount(CHAIN_ID));
  let txId: string;

  it('sends to 5 recipients', async () => {
    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: recipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('all recipients receive funds', async () => {
    for (const account of recipients) {
      const res = await fetch(`${API_BASE}addresses/balance/${account.address}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBeGreaterThanOrEqual(100_000);
    }
  });

  it('appears in data-service /v0/transactions/mass-transfer', async () => {
    const url = `${DS_URL}/v0/transactions/mass-transfer?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === txId);
    expect(found).toBe(true);
  });
});
