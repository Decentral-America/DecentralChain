import { libs } from '@decentralchain/transactions';
import { Signer } from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MOCK_URL, NETWORK_BYTE } from '../test-env';

const MASTER_ADDRESS = libs.crypto.address(ACCOUNTS.SIMPLE.seed, NETWORK_BYTE);
let signer: Signer;
let provider: TestProvider = new TestProvider(ACCOUNTS.SIMPLE.seed);

beforeEach(async () => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  await signer.setProvider(provider as any);
});

it('Transfer Signer', async () => {
  await signer
    .transfer({
      amount: 1,
      recipient: MASTER_ADDRESS,
    })
    .broadcast();
});

it('Transfer custom asset', async () => {
  const [{ id }] = await signer
    .issue({
      decimals: 8,
      description: 'Digital gold',
      name: 'Bitcoin',
      quantity: 10000,
      reissuable: false,
    })
    .broadcast();

  await signer
    .transfer({
      amount: 1,
      assetId: id,
      recipient: MASTER_ADDRESS,
    })
    .broadcast();
});

it('Mass Transfer', async () => {
  await signer
    .massTransfer({
      transfers: [
        { amount: 1, recipient: MASTER_ADDRESS },
        { amount: 1, recipient: MASTER_ADDRESS },
      ],
    })
    .broadcast();
});
