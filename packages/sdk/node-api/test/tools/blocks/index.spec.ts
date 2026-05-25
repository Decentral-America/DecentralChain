import { create } from '../../../src';
import getNetworkByte from '../../../src/tools/blocks/getNetworkByte';
import getNetworkCode from '../../../src/tools/blocks/getNetworkCode';
import { CHAIN_ID, NETWORK_BYTE, NODE_URL } from '../../_state';

const { tools } = create(NODE_URL);

it('Get network byte by index', async () => {
  const byte = await tools.blocks.getNetworkByte();
  expect(byte).toBe(NETWORK_BYTE);
});

it('Get network byte by func', async () => {
  const byte = await getNetworkByte(NODE_URL);
  expect(byte).toBe(NETWORK_BYTE);
});

it('Get char code by index', async () => {
  const code = await tools.blocks.getNetworkCode();
  expect(code).toBe(CHAIN_ID);
});

it('Get char code by func', async () => {
  const code = await getNetworkCode(NODE_URL);
  expect(code).toBe(CHAIN_ID);
});
