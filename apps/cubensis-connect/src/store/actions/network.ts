import { type NetworkName } from '../../networks/types';
import { type PopupThunkAction } from '../../popup/store/types';
import Background from '../../ui/services/Background';
import { ACTION } from './constants';

export function setNetwork(network: NetworkName): PopupThunkAction<Promise<void>> {
  return async () => {
    await Background.setNetwork(network);
  };
}

export const setCustomNode = (payload: { network: NetworkName; node: string | null }) => {
  return {
    payload,
    type: ACTION.CHANGE_NODE,
  };
};

export const setCustomCode = (payload: { network: NetworkName; code: string | null }) => {
  return {
    payload,
    type: ACTION.CHANGE_NETWORK_CODE,
  };
};

export const setCustomMatcher = (payload: { network: NetworkName; matcher: string | null }) => {
  return {
    payload,
    type: ACTION.CHANGE_MATCHER,
  };
};
