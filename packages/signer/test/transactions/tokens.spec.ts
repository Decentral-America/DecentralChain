import Signer from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MASTER_ACCOUNT_SEED, MOCK_URL } from '../test-env';

let signer: Signer;
let provider: TestProvider = new TestProvider(MASTER_ACCOUNT_SEED);

beforeEach(() => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  signer.setProvider(provider as any);
});

it('Issue', async () => {
  const [tx] = await signer
    .issue({
      name: 'Test',
      description: 'Test description',
      quantity: 100,
      decimals: 0,
      reissuable: false,
    })
    .broadcast();

  expect(tx.fee).toBe(10 ** 8);
});

it('Reissue', async () => {
  const [{ id }] = await signer
    .issue({
      name: 'Test',
      description: 'Test description',
      quantity: 100,
      decimals: 0,
      reissuable: true,
    })
    .broadcast();

  const [tx] = await signer
    .reissue({
      assetId: id,
      quantity: 100,
      reissuable: true,
    })
    .broadcast();

  expect(tx.fee).toBe(0.001 * 10 ** 8);
});

it('Burn', async () => {
  const [{ id }] = await signer
    .issue({
      name: 'Test',
      description: 'Test description',
      quantity: 100,
      decimals: 0,
      reissuable: false,
    })
    .broadcast();

  const [tx] = await signer
    .burn({
      assetId: id,
      amount: 10,
    })
    .broadcast();

  expect(tx.fee).toBe(0.001 * 10 ** 8);
});
