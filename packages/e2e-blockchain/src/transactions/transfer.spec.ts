import { broadcast, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, DS_URL, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('Transfer (type 4)', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  let txId: string;
  let recipientAddr: string;

  it('broadcasts and confirms', async () => {
    const recipient = randomTestAccount(CHAIN_ID);
    recipientAddr = recipient.address;

    const tx = transfer(
      {
        amount: 100_000,
        chainId: CHAIN_ID,
        recipient: recipientAddr,
      },
      MASTER_SEED,
    );

    txId = tx.id;
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(txId, { apiBase: API_BASE, timeout: TIMEOUT });

    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('recipient balance increases', async () => {
    const res = await fetch(`${API_BASE}addresses/balance/${recipientAddr}`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { balance: number };
    expect(data.balance).toBeGreaterThanOrEqual(100_000);
  });

  it('appears in data-service', async () => {
    const url = `${DS_URL}/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=10`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    const found = body.items.some((item) => item.id === txId);
    expect(found).toBe(true);
  });
});
