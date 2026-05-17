import { type Provider, Signer } from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MASTER_ACCOUNT_SEED, MOCK_URL } from '../test-env';

let signer: Signer;
let provider: TestProvider = new TestProvider(MASTER_ACCOUNT_SEED);

beforeEach(async () => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  await signer.setProvider(provider as Provider);
});

it('Data', async () => {
  const [tx] = await signer
    .data({
      data: [
        { key: 'string', type: 'string', value: 'string' },
        { key: 'number', type: 'integer', value: 100 },
        { key: 'boolean', type: 'boolean', value: true },
      ],
    })
    .broadcast();

  expect(tx.fee).toBe(0.001 * 10 ** 8);
});
