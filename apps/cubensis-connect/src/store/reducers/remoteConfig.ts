import { createReducer, type PayloadAction } from '@reduxjs/toolkit';
import { type StorageLocalState } from 'storage/storage';

import { ACTION } from '../actions/constants';

export const config = createReducer(
  {} as StorageLocalState['config'] | Record<never, unknown>,
  (builder) => {
    builder.addCase(
      ACTION.REMOTE_CONFIG.SET_CONFIG,
      (_, action) =>
        (action as unknown as PayloadAction<StorageLocalState['config'] | Record<never, unknown>>)
          .payload,
    );
  },
);
