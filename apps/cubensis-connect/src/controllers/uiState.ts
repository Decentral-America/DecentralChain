import { createStore } from 'zustand/vanilla';
import type { UiState } from '#store/reducers/stateTypes';

import type { ExtensionStorage } from '../storage/storage';

export class UiStateController {
  private store;

  constructor({ extensionStorage }: { extensionStorage: ExtensionStorage }) {
    this.store = createStore(() =>
      extensionStorage.getInitState({
        uiState: {},
      }),
    );
    extensionStorage.subscribe(this.store);
  }

  getUiState() {
    return this.store.getState().uiState;
  }

  setUiState(uiState: UiState) {
    this.store.setState({ uiState });
    return this.getUiState();
  }
}
