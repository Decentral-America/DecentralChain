import { libs } from '@decentralchain/transactions';
import Signer from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MOCK_URL, NETWORK_BYTE } from '../test-env';

const MASTER_ADDRESS = libs.crypto.address(ACCOUNTS.SIMPLE.seed, NETWORK_BYTE);
let signer: Signer;
let provider: TestProvider = new TestProvider(ACCOUNTS.SIMPLE.seed);

beforeEach(() => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  signer.setProvider(provider as any);
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
      name: 'Bitcoin',
      decimals: 8,
      quantity: 10000,
      reissuable: false,
      description: 'Digital gold',
    })
    .broadcast();

  await signer
    .transfer({
      amount: 1,
      recipient: MASTER_ADDRESS,
      assetId: id,
    })
    .broadcast();
});

it('Mass Transfer', async () => {
  await signer
    .massTransfer({
      transfers: [
        { recipient: MASTER_ADDRESS, amount: 1 },
        { recipient: MASTER_ADDRESS, amount: 1 },
      ],
    })
    .broadcast();
});
