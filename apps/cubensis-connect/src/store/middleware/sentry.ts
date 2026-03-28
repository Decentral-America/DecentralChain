import { addBreadcrumb, setTag } from '@sentry/browser';

import type { AppMiddleware } from '../../popup/store/types';
import { updateCurrentNetwork, updateSelectedAccount } from '../reducers/updateState';

export const sentryBreadcrumbs: AppMiddleware = () => (next) => (action) => {
  addBreadcrumb({
    category: 'redux.action',
    data: {
      'action.type': action.type,
    },
    type: 'info',
  });

  if (updateCurrentNetwork.match(action)) {
    setTag('network', action.payload);

    addBreadcrumb({
      category: 'network-change',
      level: 'info',
      message: `Change network to ${action.payload}`,
      type: 'user',
    });
  } else if (updateSelectedAccount.match(action)) {
    addBreadcrumb({
      category: 'account-change',
      level: 'info',
      message: 'Change active account',
      type: 'user',
    });
  }

  return next(action);
};
