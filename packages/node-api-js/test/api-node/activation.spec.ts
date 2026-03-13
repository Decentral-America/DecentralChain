import { create } from '../../src';
import { type IFeatures } from '../../src/api-node/activation';
import { type TLong } from '../../src/interface';
import { NODE_URL } from '../_state';

const api: ReturnType<typeof create> = create(NODE_URL);

const CheckFeatures = (object: IFeatures<TLong>) => {
  expect(object).toMatchObject({
    activationHeight: expect.any(Number),
    blockchainStatus: expect.any(String),
    description: expect.any(String),
    id: expect.any(Number),
    nodeStatus: expect.any(String),
  });
};

it('Activation status', async () => {
  const info = await api.activation.fetchActivationStatus();
  expect(typeof info.height).toBe('number');
  expect(typeof info.votingInterval).toBe('number');
  expect(typeof info.votingThreshold).toBe('number');
  expect(info.features).toBeInstanceOf(Array);
  info.features.forEach(CheckFeatures);
});
