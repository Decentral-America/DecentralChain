import { type AppAction, type AppActionPayload } from '../types';

export const createAction =
  <TActionType extends AppAction['type']>(type: TActionType) =>
  (payload: AppActionPayload<TActionType>) => ({
    payload,
    type,
  });
