import { createAction } from '@reduxjs/toolkit';

import type { NetworkName } from '../../networks/types';
import type { PopupThunkAction } from '../../popup/store/types';
import Background from '../../ui/services/Background';

export function setNetwork(network: NetworkName): PopupThunkAction<Promise<void>> {
  return async () => {
    await Background.setNetwork(network);
  };
}

// Command actions — intercepted by BackgroundMW, do not update Redux state directly.
// The background service stores the value and pushes back the corresponding update action.
export const setCustomNode = createAction<{ network: NetworkName; node: string | null }>(
  'network/setCustomNode',
);
export const setCustomCode = createAction<{ network: NetworkName; code: string | null }>(
  'network/setCustomCode',
);
export const setCustomMatcher = createAction<{ network: NetworkName; matcher: string | null }>(
  'network/setCustomMatcher',
);
export const setLocale = createAction<string>('locale/set');
export const setIdle = createAction<string>('remoteConfig/setIdle');
