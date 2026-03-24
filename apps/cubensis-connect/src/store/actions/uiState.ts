import { type UiState } from '../reducers/updateState';
import { ACTION } from './constants';

export const setUiState = (ui: Partial<UiState>) => ({
  payload: ui,
  type: ACTION.SET_UI_STATE,
});
