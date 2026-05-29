import { address, randomSeed } from '@decentralchain/ts-lib-crypto';
import { data, issue } from '../src';
import * as utilityF from '../src/nodeInteraction';
import { broadcast, waitForTx } from '../src/nodeInteraction';

const chainId = process.env.DCC_TEST_CHAIN_ID ?? 'R';
const apiBase = process.env.DCC_TEST_NODE_URL
  ? `${process.env.DCC_TEST_NODE_URL}/`
  : 'http://localhost:6869/';
const masterSeed = process.env.DCC_TEST_MINER_SEED ?? 'dcc private node seed with dcc tokens';
const minerAddr = address(masterSeed, chainId);
const TIMEOUT = 60_000;

// ── Self-provisioned state ───────────────────────────────────────────
// Instead of relying on pre-existing testnet state, beforeAll creates
// the exact state each test needs on whatever node is running.
let dataTxId: string;
let issuedAssetId: string;

describe('Node interaction utility functions', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  beforeAll(async () => {
    // 1. Broadcast a data tx → used by accountData*, transactionById tests
    const dataTx = data(
      {
        chainId,
        data: [
          { key: 'string_value', type: 'string', value: 'hello' },
          { key: 'int_value', type: 'integer', value: 42 },
          { key: 'binary_one', type: 'binary', value: 'base64:AQID' },
          { key: 'binary_two', type: 'binary', value: 'base64:BAUG' },
          { key: 'bool_value', type: 'boolean', value: true },
        ],
      },
      masterSeed,
    );
    await broadcast(dataTx, apiBase);
    await waitForTx(dataTx.id, { apiBase, timeout: TIMEOUT });
    dataTxId = dataTx.id;

    // 2. Issue a token → used by assetBalance test
    const issueTx = issue(
      {
        chainId,
        decimals: 0,
        description: 'nodeInteraction test token',
        name: `NIT${Date.now().toString(36).slice(-5)}`,
        quantity: 100,
        reissuable: false,
      },
      masterSeed,
    );
    await broadcast(issueTx, apiBase);
    await waitForTx(issueTx.id, { apiBase, timeout: TIMEOUT });
    issuedAssetId = issueTx.id;
  }, TIMEOUT * 3);

  it('should send tx to node', async () => {
    const dataParams = {
      chainId: chainId,
      data: [
        {
          key: 'oneTwo',
          value: false,
        },
        {
          key: 'twoThree',
          value: 2,
        },
        {
          key: 'three',
          value: Uint8Array.from([1, 2, 3, 4, 5, 6]),
        },
      ],
      timestamp: 100000,
      version: 1,
    };
    const result = data(dataParams, 'seed seed');

    await expect(broadcast(result, apiBase)).rejects.toMatchObject({ data: { error: 303 } });
  });

  it('Should get current height', async () => {
    await expect(utilityF.currentHeight(apiBase)).resolves.toBeGreaterThan(0);
  });

  it('Should get transaction by id', async () => {
    const tx = await utilityF.transactionById(dataTxId, apiBase);
    expect(tx.id).toEqual(dataTxId);
  });

  it('Should throw on not existing tx', async () => {
    const id = 'EdhLuhUMX22gKxGxKZxLcVsygMC9nBCBbSuAxFbZumQ';
    await expect(utilityF.transactionById(id, apiBase)).rejects.toMatchObject({
      data: { error: 311 },
    });
  });

  it('Should wait 1 Block', async () => {
    await utilityF.waitNBlocks(1, { apiBase });
  }, 120000);

  it('Should get balance', async () => {
    await expect(utilityF.balance(minerAddr, apiBase)).resolves.not.toBeNaN();
    await expect(utilityF.balance('bad address', apiBase)).rejects.toMatchObject({
      data: { error: 199 },
    });
  }, 5000);

  it('Should get balanceDetails', async () => {
    await expect(utilityF.balanceDetails(minerAddr, apiBase)).resolves.not.toBe(false);
  }, 5000);

  it('Should get asset balance', async () => {
    await expect(utilityF.assetBalance(issuedAssetId, minerAddr, apiBase)).resolves.toEqual(100);
  }, 5000);

  it('Should return correct error on invalid address for asset balance', async () => {
    const resp = utilityF.assetBalance('invalidAddress', 'bad address', apiBase);
    await expect(resp).rejects.toMatchObject({ data: { error: 199 } });
  }, 5000);

  it('Should get accountData ', async () => {
    const addr = address(randomSeed(), chainId);
    await expect(utilityF.accountData(addr, apiBase)).resolves.not.toBe(false);
  }, 5000);

  it('Should get accountData and filter it by regexp', async () => {
    const result = await utilityF.accountData(
      {
        address: minerAddr,
        match: 'binary.*',
      },
      apiBase,
    );
    expect(Object.keys(result).length).toEqual(2);
  }, 5000);

  it('Should get accountData by key ', async () => {
    const result = await utilityF.accountDataByKey('string_value', minerAddr, apiBase);
    expect(result).not.toBe(false);
  }, 5000);

  it('Should get accountData by key and return null on no data', async () => {
    const result = await utilityF.accountDataByKey('nonexistent_key_xyz', minerAddr, apiBase);
    expect(result).toBeNull();
  }, 5000);

  it('Should give correct error on invalid address', async () => {
    const result = utilityF.accountDataByKey('test23', 'invalidAddress', apiBase);
    await expect(result).rejects.toMatchObject({ data: { error: 199 } });
  }, 5000);

  it('Should get account script info', async () => {
    const result = await utilityF.scriptInfo(minerAddr, apiBase);
    expect(result).toMatchObject({ extraFee: 0 });
  }, 5000);

  it('Should reward info', async () => {
    const result = await utilityF.rewards(apiBase.replace(/\/$/, ''));
    expect(result).toHaveProperty('currentReward');
  }, 5000);
});
