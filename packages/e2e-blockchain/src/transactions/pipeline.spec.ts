import { broadcast, massTransfer, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { randomTestAccount } from '../helpers/accounts';
import { assertAppearsInDataService } from '../helpers/data-service';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const MASTER_ADDR = address(MASTER_SEED, CHAIN_ID);
const TIMEOUT = 120_000;

describe('Full data pipeline', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  it('transfer confirms and flows to data-service', async () => {
    const recipient = randomTestAccount(CHAIN_ID);
    const tx = transfer(
      { amount: 100_000, chainId: CHAIN_ID, recipient: recipient.address },
      MASTER_SEED,
    );
    const _t0 = Date.now();
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
    await assertAppearsInDataService(
      tx.id,
      `/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=50`,
      API_BASE,
    );
  });

  it('mass transfer confirms and flows to data-service', async () => {
    const recipients = Array.from({ length: 3 }, () => randomTestAccount(CHAIN_ID));
    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: recipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );
    const _t0 = Date.now();
    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
    await assertAppearsInDataService(
      tx.id,
      `/v0/transactions/mass-transfer?sender=${MASTER_ADDR}&limit=50`,
      API_BASE,
    );
  });
});
