import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import * as middleware from '../../store/middleware';
import { reducer } from './reducer';
import type { AppMiddleware } from './types';

const appMiddleware: AppMiddleware[] = Object.values(middleware) as AppMiddleware[];

export function createPopupStore() {
  const store = configureStore({
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(
        ...appMiddleware,
        ...(process.env.NODE_ENV === 'development' ? [createLogger({ collapsed: true })] : []),
      ) as ReturnType<typeof getDefault>,
    reducer,
  });

  if (import.meta.hot) {
    import.meta.hot.accept('./reducer', () => {
      store.replaceReducer(reducer);
    });
  }

  return store;
}
