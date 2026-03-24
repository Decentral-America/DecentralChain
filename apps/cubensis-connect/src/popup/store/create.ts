import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import * as middleware from '../../store/middleware';
import { reducer } from './reducer';

export function createPopupStore() {
  const store = configureStore({
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(
        ...(Object.values(middleware) as any[]),
        ...(process.env.NODE_ENV === 'development' ? [createLogger({ collapsed: true })] : []),
      ) as any,
    reducer,
  });

  if (import.meta.hot) {
    import.meta.hot.accept('./reducer', () => {
      store.replaceReducer(reducer);
    });
  }

  return store;
}
