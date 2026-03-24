import { createReducer, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_MAIN_CONFIG, type NftConfig } from '../../constants';
import { ACTION } from '../actions/constants';

export const nftConfig = createReducer(DEFAULT_MAIN_CONFIG.nfts as NftConfig, (builder) => {
  builder.addCase(
    ACTION.UPDATE_NFT_CONFIG,
    (_, action) => (action as unknown as PayloadAction<NftConfig>).payload,
  );
});
