import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { NftConfig } from '../../constants';
import { DEFAULT_MAIN_CONFIG } from '../../constants';

const nftConfigSlice = createSlice({
  initialState: DEFAULT_MAIN_CONFIG.nfts as NftConfig,
  name: 'nftConfig',
  reducers: {
    updateNftConfig: (_state, action: PayloadAction<NftConfig>) => action.payload,
  },
});
export const nftConfig = nftConfigSlice.reducer;
export const { updateNftConfig } = nftConfigSlice.actions;
