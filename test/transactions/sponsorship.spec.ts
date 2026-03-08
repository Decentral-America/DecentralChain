import Signer from '../../src/Signer';
import { TestProvider } from '../TestProvider';
import { ACCOUNTS, MOCK_URL } from '../test-env';

const signer = new Signer({ NODE_URL: MOCK_URL });
const provider = new TestProvider(ACCOUNTS.SIMPLE.seed);
signer.setProvider(provider as any);

const issue = signer
  .issue({
    name: 'Test',
    description: 'Test description',
    quantity: 100,
    decimals: 0,
    reissuable: false,
  })
  .broadcast();

it('Sponsorship', async () => {
  const [asset] = await issue;
  await signer
    .sponsorship({
      assetId: asset.id,
      minSponsoredAssetFee: 1,
    })
    .broadcast();
});

it('Cancel Sponsorship', async () => {
  const [asset] = await issue;
  await signer
    .sponsorship({
      assetId: asset.id,
      minSponsoredAssetFee: 1,
    })
    .broadcast();

  await signer
    .sponsorship({
      assetId: asset.id,
      minSponsoredAssetFee: null,
    })
    .broadcast();
});
