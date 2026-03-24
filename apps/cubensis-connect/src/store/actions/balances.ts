// Command action — intercepted by BackgroundMW to trigger a balance refresh.
import { createAction } from '@reduxjs/toolkit';

export const getBalances = createAction('balances/refresh');
