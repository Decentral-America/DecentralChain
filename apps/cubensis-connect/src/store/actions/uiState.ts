import { type UiState } from '../reducers/updateState';
import { ACTION } from './constants';

export function setUiState(ui: Partial<UiState>) {
  return {
    payload: ui,
    type: ACTION.SET_UI_STATE,
  };
}
