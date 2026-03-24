import { createReducer } from '@reduxjs/toolkit';

import { DEFAULT_MAIN_CONFIG, type NftConfig } from '../../constants';
import { ACTION } from '../actions/constants';
import { typedPayload } from '../types';

export const nftConfig = createReducer(DEFAULT_MAIN_CONFIG.nfts as NftConfig, (builder) => {
  builder.addCase(ACTION.UPDATE_NFT_CONFIG, (_, action) => typedPayload(action));
});
