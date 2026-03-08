import { address, randomSeed } from '@decentralchain/ts-lib-crypto';
import { data } from '../src';
import * as utilityF from '../src/nodeInteraction';
import { broadcast } from '../src/nodeInteraction';

const chainId = '!';
const apiBase = 'https://testnet-node.decentralchain.io/';

describe('Node interaction utility functions', () => {
  vi.setConfig({ testTimeout: 60000 });
  it('should send tx to node', async () => {
    const dataParams = {
      version: 1,
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
      chainId: chainId,
    };
    const result = data(dataParams, 'seed seed');

    await expect(broadcast(result, apiBase)).rejects.toMatchObject({ error: 303 });
  });

  it('Should get current height', async () => {
    return expect(utilityF.currentHeight(apiBase)).resolves.toBeGreaterThan(0);
  });

  it('Should get transaction by id', async () => {
    const id = 'EdhLuhUMX22gKxGxKZxLcVsygMC9nBCBbSuAxFhbZumQ';
    const tx = await utilityF.transactionById(id, apiBase);
    expect(tx.id).toEqual(id);
  });

  it('Should throw on not existing tx', async () => {
    const id = 'EdhLuhUMX22gKxGxKZxLcVsygMC9nBCBbSuAxFbZumQ';
    expect(utilityF.transactionById(id, apiBase)).rejects.toMatchObject({ error: 311 });
  });

  it('Should wait 1 Block', async () => {
    await utilityF.waitNBlocks(1, { apiBase });
  }, 120000);

  it('Should get balance', async () => {
    await expect(
      utilityF.balance('3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu', apiBase),
    ).resolves.not.toBeNaN();
    await expect(utilityF.balance('bad address', apiBase)).rejects.toMatchObject({ error: 199 });
  }, 5000);

  it('Should get balanceDetails', async () => {
    await expect(
      utilityF.balanceDetails('3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu', apiBase),
    ).resolves.not.toBe(false);
  }, 5000);

  it('Should get asset balance', async () => {
    await expect(
      utilityF.assetBalance(
        '3xdf6GESKGNP1oUyT8QXDgzTE11yi1sJGyVmjt7HHNEU',
        '3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu',
        apiBase,
      ),
    ).resolves.not.toBe(false);
  }, 5000);

  it('Should get NFT balance', async () => {
    await expect(
      utilityF.assetBalance(
        '2HgvJjAJFug1QriGTJPLK1AM2Yv3GqYnDLpUjQprf1Ut',
        '3Ms5T2C6pvqiZbMASjiJvPh9u57bQpcVLLp',
        apiBase,
      ),
    ).resolves.toEqual(1);
  }, 5000);

  it('Should return correct error on invalid address for asset balance', async () => {
    const resp = utilityF.assetBalance('invalidAddress', 'bad address', apiBase);
    await expect(resp).rejects.toMatchObject({ error: 199 });
  }, 5000);

<<<<<<< HEAD
    it('Should get NFT balance', async () => {
        await expect(utilityF.assetBalance('2HgvJjAJFug1QriGTJPLK1AM2Yv3GqYnDLpUjQprf1Ut', '3Ms5T2C6pvqiZbMASjiJvPh9u57bQpcVLLp', apiBase)).resolves.toEqual(1)
    }, 5000)

    it('Should return correct error on invalid address for asset balance', async () => {
        const resp = utilityF.assetBalance('invalidAddress', 'bad address', apiBase)
        await expect(resp).rejects.toMatchObject({error: 199})
    }, 5000)
=======
  it('Should get accountData ', async () => {
<<<<<<< HEAD:test/nodeInteraction.test.ts
    const addr = address(randomSeed(), chainId)
    await expect(utilityF.accountData(addr, apiBase)).resolves.not.toBeFalsy()
  }, 5000)
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
    const addr = address(randomSeed(), chainId);
    await expect(utilityF.accountData(addr, apiBase)).resolves.not.toBe(false);
  }, 5000);
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/nodeInteraction.spec.ts

  it('Should get accountData and filter it by regexp', async () => {
    const data = await utilityF.accountData(
      {
        address: '3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu',
        match: 'binary.*',
      },
      apiBase,
    );
    expect(Object.keys(data).length).toEqual(2);
  }, 5000);

  it('Should get accountData by key ', async () => {
    const data = await utilityF.accountDataByKey(
      'string_value',
      '3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu',
      apiBase,
    );
    expect(data).not.toBe(false);
  }, 5000);

  it('Should get accountData by key and return null on no data', async () => {
    const data = await utilityF.accountDataByKey(
      'test23',
      '3MtXzccPrCAoKans9TD9sp3qoFHiajPA4Uu',
      apiBase,
    );
    expect(data).toBeNull();
  }, 5000);

  it('Should give correct error on invalid address', async () => {
    const data = utilityF.accountDataByKey('test23', 'invalidAddress', apiBase);
    await expect(data).rejects.toMatchObject({ error: 199 });
  }, 5000);

  it('Should get account script info', async () => {
    const data = await utilityF.scriptInfo('3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR', apiBase);
    expect(data).toMatchObject({ extraFee: 0 });
  }, 5000);

  it('Should get account script meta', async () => {
    const data = await utilityF.scriptMeta('3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR', apiBase);
    expect(data).toMatchObject({ address: '3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR' });
  }, 5000);

<<<<<<< HEAD
    it('Should get account script meta', async () => {
<<<<<<< HEAD
<<<<<<< HEAD
        const data = await utilityF.scriptMeta('3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR', apiBase)
        expect(data).toMatchObject({address: '3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR'})
=======
        const data = await utilityF.scriptMeta('3XVVT9TLt9cthFCxdBfgT1kp56d5E5reNak', apiBase)
        console.log(data)
        expect(data).toMatchObject({address: '3XVVT9TLt9cthFCxdBfgT1kp56d5E5reNak'})
>>>>>>> 697d643a (minor fixes)
=======
        const data = await utilityF.scriptMeta('3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR', apiBase)
        expect(data).toMatchObject({address: '3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR'})
>>>>>>> f33083a0 (updated dependencies)
    }, 5000)
=======
  it('Should reward info', async () => {
<<<<<<< HEAD:test/nodeInteraction.test.ts
    const data = await utilityF.rewards('https://testnet-node.decentralchain.io')
    expect(data).toHaveProperty('currentReward')
  }, 5000)
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
    const data = await utilityF.rewards('https://testnet-node.decentralchain.io');
    expect(data).toHaveProperty('currentReward');
  }, 5000);
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/nodeInteraction.spec.ts

  it('Should get invokeTx state changes', async () => {
    const data = await utilityF.stateChanges(
      'CNo4Zy72KEAo4pnpVL5FQrBujwhqhYgBogwQ1RS8uWkD',
      apiBase,
    );
    expect(Array.isArray(data.data)).toBe(true);
  }, 5000);
});
