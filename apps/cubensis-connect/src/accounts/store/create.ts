import { applyMiddleware, createStore, type Middleware, type Reducer } from 'redux';
import { createLogger } from 'redux-logger';
import { type ThunkDispatch, thunk } from 'redux-thunk';

import * as middleware from '../../store/middleware';
import { type AppAction } from '../../store/types';
import { reducer } from './reducer';
import { type AccountsState } from './types';

export function createAccountsStore() {
  const typedReducer = reducer as unknown as Reducer<AccountsState, AppAction>;
  const typedMiddleware = Object.values(middleware) as Middleware<
    Record<never, unknown>,
    AccountsState,
    ThunkDispatch<AccountsState, undefined, AppAction>
  >[];

  const store = createStore<
    AccountsState,
    AppAction,
    { dispatch: ThunkDispatch<AccountsState, undefined, AppAction> },
    Record<never, unknown>
  >(
    typedReducer,
    applyMiddleware(
      thunk,
      ...typedMiddleware,
      ...(process.env.NODE_ENV === 'development' ? [createLogger({ collapsed: true })] : []),
    ),
  );

  if (import.meta.hot) {
    import.meta.hot.accept('./reducer', () => {
      store.replaceReducer(typedReducer);
    });
  }

  return store;
}
