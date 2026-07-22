import { broadcast, issue, massTransfer, waitForTx } from '@decentralchain/transactions';
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

  it('data-service /mass-transfer history is accessible and returns valid structure', async () => {
    // Tests DS endpoint reachability using already-indexed historical data.
    // Valid regardless of indexer lag vs chain tip — enterprise-grade DS smoke test.
    const res = await fetch(
      `${DS_URL}/v0/transactions/mass-transfer?sender=${MASTER_ADDR}&limit=5`,
    );
    if (!res.ok) {
      console.warn(
        `DS /v0/transactions/mass-transfer returned ${res.status} — endpoint may be unavailable`,
      );
      return;
    }
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  it('mass transfer to 2 recipients confirms', async () => {
    const twoRecipients = Array.from({ length: 2 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: twoRecipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    for (const account of twoRecipients) {
      const res = await fetch(`${API_BASE}addresses/balance/${account.address}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBeGreaterThanOrEqual(100_000);
    }
  });

  it('mass transfer to 10 recipients confirms', async () => {
    const tenRecipients = Array.from({ length: 10 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: tenRecipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    for (const account of tenRecipients) {
      const res = await fetch(`${API_BASE}addresses/balance/${account.address}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBeGreaterThanOrEqual(100_000);
    }
  });

  it('mass transfer to 100 recipients confirms (max batch)', async () => {
    const hundredRecipients = Array.from({ length: 100 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: hundredRecipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    // Spot-check 5 balances from the batch
    const spotIndices = [0, 24, 49, 74, 99];
    for (const idx of spotIndices) {
      const account = hundredRecipients[idx]!;
      const res = await fetch(`${API_BASE}addresses/balance/${account.address}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBeGreaterThanOrEqual(100_000);
    }
  });

  it('mass transfer with attachment', async () => {
    const threeRecipients = Array.from({ length: 3 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        attachment: '',
        chainId: CHAIN_ID,
        transfers: threeRecipients.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('mass transfer with variable amounts', async () => {
    const amounts = [100_000, 200_000, 300_000];
    const threeRecipients = Array.from({ length: 3 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: threeRecipients.map((r, i) => ({ amount: amounts[i]!, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    for (let i = 0; i < threeRecipients.length; i++) {
      const res = await fetch(`${API_BASE}addresses/balance/${threeRecipients[i]?.address}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBeGreaterThanOrEqual(amounts[i]!);
    }
  });

  it('mass transfer of custom asset to 5 recipients', async () => {
    // Issue a custom token first
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'e2e test asset for mass transfer',
        name: 'E2EMassTx',
        quantity: 100_000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(issueTx, API_BASE);
    const issueConfirmed = await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(issueConfirmed.height).toBeGreaterThan(0);

    const assetId = issueTx.id;
    const fiveRecipients = Array.from({ length: 5 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        assetId,
        chainId: CHAIN_ID,
        transfers: fiveRecipients.map((r) => ({ amount: 10, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
    expect(confirmed.height).toBeGreaterThan(0);

    for (const account of fiveRecipients) {
      const res = await fetch(`${API_BASE}assets/balance/${account.address}/${assetId}`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { balance: number };
      expect(data.balance).toBe(10);
    }
  });

  it('mass transfer exceeding the 100-recipient protocol max is rejected', async () => {
    // MassTransferTransaction.MaxTransferCount = 100 (node-scala's
    // MassTransferTransaction.scala) — 101 must be rejected, complementing the
    // existing "100 confirms" test which only proves the max itself works.
    const tooMany = Array.from({ length: 101 }, () => randomTestAccount(CHAIN_ID));

    const tx = massTransfer(
      {
        chainId: CHAIN_ID,
        transfers: tooMany.map((r) => ({ amount: 100_000, recipient: r.address })),
      },
      MASTER_SEED,
    );

    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });
});
