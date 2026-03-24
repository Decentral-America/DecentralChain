import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_MAIN_CONFIG, type NftConfig } from '../../constants';

const nftConfigSlice = createSlice({
  initialState: DEFAULT_MAIN_CONFIG.nfts as NftConfig,
  name: 'nftConfig',
  reducers: {
    updateNftConfig: (_state, action: PayloadAction<NftConfig>) => action.payload,
  },
});
export const nftConfig = nftConfigSlice.reducer;
export const { updateNftConfig } = nftConfigSlice.actions;
