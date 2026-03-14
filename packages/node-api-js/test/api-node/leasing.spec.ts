// import {NODE_URL, STATE} from '../_state';
import { create } from '../../src';
import { type ILeaseInfo } from '../../src/api-node/leasing';
import { MASTER_ACCOUNT, NODE_URL } from '../_state';

const api: ReturnType<typeof create> = create(NODE_URL);
const largeNumbeConvertHeader = {
  headers: { Accept: 'application/json;large-significand-format=string' },
};

const checkLeasing = (object: ILeaseInfo) => {
  expect(object).toMatchObject({
    amount: expect.isStringOrNumber(),
    cancelHeight: expect.isNullableNumber(),
    cancelTransactionId: expect.isNullableString(),
    height: expect.any(Number),
    id: expect.any(String),
    originTransactionId: expect.any(String),
    recipient: expect.any(String),
    sender: expect.any(String),
    status: expect.any(String),
  });
};

it('Leasing info', async () => {
  const activeLeasing = await api.leasing.fetchActive(MASTER_ACCOUNT.ADDRESS);
  if (activeLeasing.length > 0) {
    const id = activeLeasing[0].id;
    const leaseInfo = await api.leasing.fetchLeasingInfo([id]);
    expect(leaseInfo).toBeInstanceOf(Array);
    leaseInfo.forEach(checkLeasing);
  }
});

it('Leasing info, long as string', async () => {
  const activeLeasing = await api.leasing.fetchActive(MASTER_ACCOUNT.ADDRESS);
  if (activeLeasing.length > 0) {
    const id = activeLeasing[0].id;
    const leaseInfo = await api.leasing.fetchLeasingInfo([id], largeNumbeConvertHeader);
    expect(leaseInfo).toBeInstanceOf(Array);
    leaseInfo.forEach(checkLeasing);
  }
});

it('Leasing active', async () => {
  const info = await api.leasing.fetchActive(MASTER_ACCOUNT.ADDRESS);
  expect(info).toBeInstanceOf(Array);
  info.forEach(checkLeasing);
});

it('Leasing active, long as string', async () => {
  const info = await api.leasing.fetchActive(MASTER_ACCOUNT.ADDRESS, largeNumbeConvertHeader);
  expect(info).toBeInstanceOf(Array);
  info.forEach(checkLeasing);
});
