/**
 * Network-level rejections: a transaction signed for another chain, and a replay of a
 * transaction that is already in the state.
 */

import { broadcast, data, transfer } from '@decentralchain/transactions';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
import { waitForFinalTx } from '../helpers/finality';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 180_000;

async function post(tx: unknown): Promise<{ status: number; message: string }> {
  const res = await fetch(`${API_BASE}transactions/broadcast`, {
    body: JSON.stringify(tx),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const body = (await res.json()) as { message?: string };
  return { message: body.message ?? '', status: res.status };
}

describe('Transaction rejections', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('rejects a transaction signed for another chain id', async () => {
    const account = randomTestAccount(CHAIN_ID);
    await fundAccount(account.address, 1_000_000, MASTER_SEED, API_BASE, CHAIN_ID);

    const foreign = CHAIN_ID === '?' ? '!' : '?';
    const tx = data(
      { chainId: foreign, data: [{ key: 'e2e_foreign', type: 'integer', value: 1 }] },
      account.seed,
    );
    const { message, status } = await post(tx);

    const expected = CHAIN_ID.charCodeAt(0);
    const provided = foreign.charCodeAt(0);
    expect(status).toBe(400);
    expect(message).toMatch(
      new RegExp(
        `Wrong chain-id\\. Expected - ${expected}, provided - ${provided}|another network: expected: ${expected}\\(.\\), actual: ${provided}\\(.\\)`,
      ),
    );
  });

  it('rejects re-broadcasting a transaction that is already in the state, without paying twice', async () => {
    const recipient = randomTestAccount(CHAIN_ID);
    const tx = transfer(
      { amount: 100_000, chainId: CHAIN_ID, recipient: recipient.address },
      MASTER_SEED,
    );
    await broadcast(tx, API_BASE);
    await waitForFinalTx(tx.id, API_BASE, TIMEOUT);

    const { message, status } = await post(tx);
    expect(status).toBe(400);
    expect(message).toContain(`Transaction ${tx.id} is already in the state`);

    const res = await fetch(`${API_BASE}addresses/balance/${recipient.address}`);
    expect(((await res.json()) as { balance: number }).balance).toBe(100_000);
  });
});
