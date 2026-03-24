import { useDispatch, useSelector } from 'react-redux';

import { type AccountsDispatch, type AccountsState } from './types';

export const useAccountsSelector = useSelector.withTypes<AccountsState>();
export const useAccountsDispatch = useDispatch.withTypes<AccountsDispatch>();
