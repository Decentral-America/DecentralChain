import { ACTION } from './constants';

export const setAddresses = (payload: Record<string, string>) => ({
  payload,
  type: ACTION.SET_ADDRESSES,
});

export const setAddress = (payload: { address: string; name: string }) => ({
  payload,
  type: ACTION.SET_ADDRESS,
});

export const removeAddress = (payload: { address: string }) => ({
  payload,
  type: ACTION.REMOVE_ADDRESS,
});
