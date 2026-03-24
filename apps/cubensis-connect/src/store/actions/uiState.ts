// setUiState is a command action — BackgroundMW merges it with current uiState,
// dispatches updateUiState, and persists via Background.setUiState.
import { createAction } from '@reduxjs/toolkit';

import { type UiState } from '../reducers/updateState';

export const setUiState = createAction<Partial<UiState>>('uiState/set');
