import { ACCOUNTS, MOCK_URL, MASTER_ACCOUNT_SEED } from '../test-env';
import Signer from '../../src/Signer';
import { TestProvider } from '../TestProvider';

let signer: Signer;
let provider: TestProvider = new TestProvider(MASTER_ACCOUNT_SEED);

beforeEach(() => {
  signer = new Signer({ NODE_URL: MOCK_URL });
  provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
  signer.setProvider(provider as any);
});

it('Alias', () =>
  signer
    .alias({
      alias: `test@${Date.now()}`,
    })
    .broadcast()
    .then(([tx]: any[]) => {
      expect(tx.fee).toBe(0.001 * Math.pow(10, 8));
    }));
