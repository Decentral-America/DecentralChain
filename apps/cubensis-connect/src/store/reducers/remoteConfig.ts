import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { StorageLocalState } from '#storage/storage';

const configSlice = createSlice({
  initialState: {} as Partial<StorageLocalState['config']>,
  name: 'config',
  reducers: {
    setRemoteConfig: (_state, action: PayloadAction<Partial<StorageLocalState['config']>>) =>
      action.payload,
  },
});
export const config = configSlice.reducer;
export const { setRemoteConfig } = configSlice.actions;
