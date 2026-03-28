import { createSlice } from '@reduxjs/toolkit';

import {
  allowOriginDone,
  autoOriginDone,
  deleteOriginDone,
  disallowOriginDone,
  pendingOrigin,
} from '../actions/permissions';

interface PermissionsUiState {
  /** True while a permission operation is in-flight (shows loading spinner). */
  pending: boolean;
  /** True briefly after an origin is allowed (shows success notification). */
  allowed: boolean;
  /** True briefly after an origin is disallowed (shows success notification). */
  disallowed: boolean;
  /** True briefly after an origin is deleted (shows success notification). */
  deleted: boolean;
}

const initialState: PermissionsUiState = {
  allowed: false,
  deleted: false,
  disallowed: false,
  pending: false,
};

const permissionsUiStateSlice = createSlice({
  extraReducers: (builder) => {
    builder
      .addCase(pendingOrigin, (state, action) => {
        state.pending = action.payload;
      })
      .addCase(allowOriginDone, (state, action) => {
        state.allowed = action.payload != null;
      })
      .addCase(autoOriginDone, (state, action) => {
        state.allowed = action.payload != null;
      })
      .addCase(disallowOriginDone, (state, action) => {
        state.disallowed = action.payload != null;
      })
      .addCase(deleteOriginDone, (state, action) => {
        state.deleted = action.payload != null;
      });
  },
  initialState,
  name: 'permissionsUiState',
  reducers: {},
});

export const permissionsUiState = permissionsUiStateSlice.reducer;
