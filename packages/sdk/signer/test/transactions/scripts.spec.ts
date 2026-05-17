import { libs } from '@decentralchain/transactions';
import { Signer } from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MOCK_URL, NETWORK_BYTE, SMART_ASSET_SCRIPT } from '../test-env';

const signer = new Signer({ NODE_URL: MOCK_URL });
const provider = new TestProvider(ACCOUNTS.SMART.seed);

void signer.setProvider(provider as any);

const issue = signer
  .issue({
    decimals: 0,
    description: 'Test description',
    fee: 1.004 * 10 ** 8,
    name: 'Test',
    quantity: 100,
    reissuable: false,
    script: SMART_ASSET_SCRIPT,
  })
  .broadcast()
  .then(([tx]: any[]) => tx);

it('Remove Account Script', async () => {
  await signer
    .setScript({
      fee: 1400000,
      script: null,
    })
    .broadcast();
});

it('Set Account Script', async () => {
  await signer
    .setScript({
      fee: 1400000,
      script: SMART_ASSET_SCRIPT,
    })
    .broadcast();
});

it('Set Asset Script', async () => {
  const asset = await issue;

  await signer
    .setAssetScript({
      assetId: asset.id,
      fee: 100400000,
      script: SMART_ASSET_SCRIPT,
    })
    .broadcast()
    .catch((e: unknown) => {
      console.error(String(e));
      return Promise.reject(e);
    });
});

it('Invoke', async () => {
  await signer
    .invoke({
      call: {
        args: [],
        function: 'foo',
      },
      dApp: libs.crypto.address(ACCOUNTS.SMART.seed, NETWORK_BYTE),
      fee: Math.ceil(0.009 * 10 ** 8),
    })
    .broadcast();
});
