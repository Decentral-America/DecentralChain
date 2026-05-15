import { Signer } from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MASTER_ACCOUNT_SEED, MOCK_URL } from '../test-env';

let signer: Signer;
let provider: TestProvider = new TestProvider(MASTER_ACCOUNT_SEED);

beforeEach(async () => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  await signer.setProvider(provider as any);
});

it('Alias', () =>
  signer
    .alias({
      alias: `test@${Date.now()}`,
    })
    .broadcast()
    .then(([tx]: any[]) => {
      expect(tx.fee).toBe(0.001 * 10 ** 8);
    }));
