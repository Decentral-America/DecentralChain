// @ts-nocheck
import { AppError, type AppErrorPattern, type ErrorInfo } from './AppError';

const errorTypes: (keyof AppErrorPattern<any>)[] = [
  'Init',
  'Resolver',
  'Db',
  'Validation',
  'Timeout',
];

const throwFn = () => {
  throw new Error('Should not happen');
};
const throwPattern: AppErrorPattern<never> = {
  Db: throwFn,
  Init: throwFn,
  Parse: throwFn,
  Resolver: throwFn,
  Timeout: throwFn,
  Validation: throwFn,
};

describe('AppError', () => {
  errorTypes.forEach((type) => {
    it(`${type} should be created from message`, () => {
      AppError[type]('Error message', { info: 'some-info' }).matchWith({
        ...throwPattern,
        [type]: (err: ErrorInfo) => {
          expect(err.error.message).toEqual('Error message');
          expect(err.meta).not.toBeUndefined();
          if (err.meta) expect(err.meta.info).toEqual('some-info');
        },
      });
    });

    it(`${type} should be created Error object`, () => {
      AppError[type](new Error('Error message'), {
        info: 'some-info',
      }).matchWith({
        ...throwPattern,
        [type]: (err: ErrorInfo) => {
          expect(err.error.message).toEqual('Error message');
          expect(err.meta).not.toBeUndefined();
          if (err.meta) expect(err.meta.info).toEqual('some-info');
        },
      });
    });
  });
});
