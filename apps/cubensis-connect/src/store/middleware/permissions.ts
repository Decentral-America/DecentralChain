import type { Action } from '@reduxjs/toolkit';

import type { AppMiddleware } from '../../popup/store/types';
import background from '../../ui/services/Background';
import {
  allowOrigin as allowOriginAction,
  allowOriginDone,
  autoOriginDone,
  deleteOrigin as deleteOriginAction,
  deleteOriginDone,
  disableOrigin,
  disallowOriginDone,
  pendingOrigin,
  setAutoOrigin as setAutoOriginAction,
} from '../actions/permissions';

let _timer: ReturnType<typeof setTimeout>;

const _permissionMW =
  (
    matchAction: { match: (a: Action) => boolean },
    method: keyof typeof background,
    actionCb: (payload: unknown) => Action,
  ): AppMiddleware =>
  (store) =>
  (next) =>
  (action) => {
    if (!matchAction.match(action)) {
      return next(action);
    }
    store.dispatch(pendingOrigin(true));
    (background[method] as (p: unknown) => Promise<unknown>)(action.payload)
      .then(() => {
        clearTimeout(_timer);
        store.dispatch(actionCb(action.payload));
        store.dispatch(pendingOrigin(false));
        _timer = setTimeout(() => {
          store.dispatch(actionCb(null));
        }, 1000);
      })
      .catch(() => store.dispatch(pendingOrigin(false)));
  };

export const allowOrigin = _permissionMW(allowOriginAction, 'allowOrigin', allowOriginDone);

export const setAutoOrigin = _permissionMW(setAutoOriginAction, 'setAutoSign', autoOriginDone);

export const disAllowOrigin = _permissionMW(disableOrigin, 'disableOrigin', disallowOriginDone);

export const deleteOrigin = _permissionMW(deleteOriginAction, 'deleteOrigin', deleteOriginDone);
