import { libs } from '@decentralchain/transactions';
import { Signer } from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MOCK_URL, NETWORK_BYTE } from '../test-env';

const MASTER_ADDRESS = libs.crypto.address(ACCOUNTS.NODE.seed, NETWORK_BYTE);
let signer: Signer;
let provider: TestProvider = new TestProvider(ACCOUNTS.SIMPLE.seed);

beforeEach(async () => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  await signer.setProvider(provider as any);
});

it('Lease', async () => {
  const [tx] = await signer
    .lease({
      amount: 100,
      recipient: MASTER_ADDRESS,
    })
    .broadcast();

  expect(tx.fee).toBe(0.001 * 10 ** 8);
});

it('Cancel lease', async () => {
  const [tx] = await signer
    .lease({
      amount: 100,
      recipient: MASTER_ADDRESS,
    })
    .broadcast();

  expect(tx.fee).toBe(0.001 * 10 ** 8);

  const [cancel] = await signer.cancelLease({ leaseId: tx.id }).broadcast();

  expect(cancel.fee).toBe(0.001 * 10 ** 8);
});
