import { useStore } from 'zustand';

import type { PopupState } from './popupStore';
import { popupStore } from './popupStore';

export type { PopupState };

export const usePopupSelector = <T>(selector: (state: PopupState) => T): T =>
  useStore(popupStore, selector);
