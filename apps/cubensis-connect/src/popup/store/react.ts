import { useDispatch, useSelector } from 'react-redux';

import { type PopupDispatch, type PopupState } from './types';

export const usePopupSelector = useSelector.withTypes<PopupState>();
export const usePopupDispatch = useDispatch.withTypes<PopupDispatch>();
