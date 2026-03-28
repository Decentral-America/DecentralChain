import { libs } from '@decentralchain/transactions';
import { Signer } from '../src/Signer';
import { TestProvider } from './TestProvider';
import { MOCK_URL, NETWORK_BYTE } from './test-env';

const seed = libs.crypto.randomSeed();
const address = libs.crypto.address(seed, NETWORK_BYTE);
const publicKey = libs.crypto.publicKey(seed);

it('Login', async () => {
  const signer = new Signer({ NODE_URL: MOCK_URL });
  const provider = new TestProvider(seed);
  await signer.setProvider(provider as any);

  const user = await signer.login();
  expect(user.address).toBe(address);
  expect(user.publicKey).toBe(publicKey);
});

it('Get balances empty', async () => {
  const signer = new Signer({ NODE_URL: MOCK_URL });
  const provider = new TestProvider(seed);
  await signer.setProvider(provider as any);

  await signer.login();
  const balances = await signer.getBalance();
  expect(balances.length).toBe(1);
  expect(balances[0].assetId).toBe('DCC');
  expect(balances[0].amount).toBe('0');
});
