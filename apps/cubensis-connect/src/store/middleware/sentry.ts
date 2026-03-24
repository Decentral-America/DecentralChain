import { addBreadcrumb, setTag } from '@sentry/browser';
import { type AppMiddleware } from '../../popup/store/types';
import { ACTION } from '../actions/constants';

export const sentryBreadcrumbs: AppMiddleware = () => (next) => (action) => {
  addBreadcrumb({
    category: 'redux.action',
    data: {
      'action.type': action.type,
    },
    type: 'info',
  });

  switch (action.type) {
    case ACTION.UPDATE_CURRENT_NETWORK:
      setTag('network', action.payload);

      addBreadcrumb({
        category: 'network-change',
        level: 'info',
        message: `Change network to ${action.payload}`,
        type: 'user',
      });
      break;
    case ACTION.UPDATE_SELECTED_ACCOUNT:
      addBreadcrumb({
        category: 'account-change',
        level: 'info',
        message: 'Change active account',
        type: 'user',
      });
      break;
  }

  return next(action);
};
