import { createReducer } from '@reduxjs/toolkit';
import { type StorageLocalState } from 'storage/storage';

import { ACTION } from '../actions/constants';
import { typedPayload } from '../types';

export const config = createReducer(
  {} as StorageLocalState['config'] | Record<never, unknown>,
  (builder) => {
    builder.addCase(ACTION.REMOTE_CONFIG.SET_CONFIG, (_, action) => typedPayload(action));
  },
);
