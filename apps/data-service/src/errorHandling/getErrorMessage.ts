import { cond, path, T } from 'ramda';

import { AppError } from '.';

const getErrorMessage = cond([
  [(e) => e instanceof AppError, path(['error', 'message'])],
  [(e) => e instanceof Error, path(['message'])],
  [T, (e) => String(e)],
]);

export default getErrorMessage;
