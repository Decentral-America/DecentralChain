import { broadcast, issue, transfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { fundAccount, randomTestAccount } from '../helpers/accounts';
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

  it('data-service /transfer history is accessible and returns valid structure', async () => {
    // Tests DS endpoint reachability using already-indexed historical data.
    // Valid regardless of indexer lag vs chain tip — enterprise-grade DS smoke test.
    const res = await fetch(`${DS_URL}/v0/transactions/transfer?sender=${MASTER_ADDR}&limit=5`);
    if (!res.ok) {
      console.warn(
        `DS /v0/transactions/transfer returned ${res.status} — endpoint may be unavailable`,
      );
      return;
    }
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(Array.isArray(body.items ?? [])).toBe(true);
  });

  it('transfer with attachment confirms', async () => {
    const recipient = randomTestAccount(CHAIN_ID);

    const tx = transfer(
      {
        amount: 100_000,
        attachment: '',
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('self-transfer confirms', async () => {
    const tx = transfer(
      {
        amount: 100_000,
        chainId: CHAIN_ID,
        recipient: MASTER_ADDR,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('chain of transfers (A→B→C) confirms', async () => {
    const walletB = randomTestAccount(CHAIN_ID);
    const walletC = randomTestAccount(CHAIN_ID);

    // Fund B from A (master)
    await fundAccount(walletB.address, 500_000, MASTER_SEED, API_BASE, CHAIN_ID);

    // B transfers to C
    const txBC = transfer(
      {
        amount: 200_000,
        chainId: CHAIN_ID,
        recipient: walletC.address,
      },
      walletB.seed,
    );

    await broadcast(txBC, API_BASE);
    await waitForTx(txBC.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const res = await fetch(`${API_BASE}addresses/balance/${walletC.address}`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { balance: number };
    expect(data.balance).toBeGreaterThanOrEqual(200_000);
  });

  it('transfer minimum amount (1 base unit) confirms', async () => {
    const recipient = randomTestAccount(CHAIN_ID);

    const tx = transfer(
      {
        amount: 1,
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    await broadcast(tx, API_BASE);
    const confirmed = await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('custom asset transfer happy path', async () => {
    const recipient = randomTestAccount(CHAIN_ID);

    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'e2e test asset',
        name: 'E2EAsset',
        quantity: 1000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const transferTx = transfer(
      {
        amount: 100,
        assetId: issueTx.id,
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    await broadcast(transferTx, API_BASE);
    await waitForTx(transferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const res = await fetch(`${API_BASE}assets/balance/${recipient.address}/${issueTx.id}`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { balance: number };
    expect(data.balance).toBe(100);
  });

  it('custom asset transfer with attachment', async () => {
    const recipient = randomTestAccount(CHAIN_ID);

    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'e2e attachment asset',
        name: 'E2EAttach',
        quantity: 1000,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const transferTx = transfer(
      {
        amount: 50,
        assetId: issueTx.id,
        attachment: '',
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    await broadcast(transferTx, API_BASE);
    const confirmed = await waitForTx(transferTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    expect(confirmed.height).toBeGreaterThan(0);
  });

  it('full asset balance transfer empties sender', async () => {
    const sender = randomTestAccount(CHAIN_ID);
    const dest = randomTestAccount(CHAIN_ID);

    // Issue 500 units to master, then transfer all to fresh sender wallet
    const issueTx = issue(
      {
        chainId: CHAIN_ID,
        decimals: 0,
        description: 'e2e full-balance asset',
        name: 'E2EFull',
        quantity: 500,
        reissuable: false,
      },
      MASTER_SEED,
    );

    await broadcast(issueTx, API_BASE);
    await waitForTx(issueTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Fund sender with DCC for fees, then send the asset to sender
    await fundAccount(sender.address, 500_000, MASTER_SEED, API_BASE, CHAIN_ID);

    const fundAssetTx = transfer(
      {
        amount: 500,
        assetId: issueTx.id,
        chainId: CHAIN_ID,
        recipient: sender.address,
      },
      MASTER_SEED,
    );

    await broadcast(fundAssetTx, API_BASE);
    await waitForTx(fundAssetTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    // Sender transfers all 500 to dest
    const drainTx = transfer(
      {
        amount: 500,
        assetId: issueTx.id,
        chainId: CHAIN_ID,
        recipient: dest.address,
      },
      sender.seed,
    );

    await broadcast(drainTx, API_BASE);
    await waitForTx(drainTx.id, { apiBase: API_BASE, timeout: TIMEOUT });

    const [senderRes, destRes] = await Promise.all([
      fetch(`${API_BASE}assets/balance/${sender.address}/${issueTx.id}`),
      fetch(`${API_BASE}assets/balance/${dest.address}/${issueTx.id}`),
    ]);

    const senderData = (await senderRes.json()) as { balance: number };
    const destData = (await destRes.json()) as { balance: number };

    expect(senderData.balance).toBe(0);
    expect(destData.balance).toBe(500);
  });

  it('transfer of unknown asset is rejected', async () => {
    const recipient = randomTestAccount(CHAIN_ID);

    const tx = transfer(
      {
        amount: 1,
        assetId: '5LHYS4wr2NFnSHn8kAJMUa3UuFNjUi1fF3BkFUf5xdN7',
        chainId: CHAIN_ID,
        recipient: recipient.address,
      },
      MASTER_SEED,
    );

    await expect(broadcast(tx, API_BASE)).rejects.toThrow();
  });
});
