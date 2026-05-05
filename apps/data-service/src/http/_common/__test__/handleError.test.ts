import {
  AppError,
  DEFAULT_BAD_REQUEST_MESSAGE,
  DEFAULT_INTERNAL_SERVER_ERROR_MESSAGE,
  DEFAULT_TIMEOUT_OCCURRED_MESSAGE,
} from '../../../errorHandling';
import { handleError } from '../handleError';

describe('handleError', () => {
  const assertHttpResponse = (code: number, message: string, meta?: any) => (x: any) => {
    expect(x).toHaveProperty('status', code);
    expect(x).toHaveProperty(
      'body',
      JSON.stringify(meta !== undefined ? { message, meta } : { message }),
    );
    expect(x).toHaveProperty('headers');
  };

  const assertInternalServerErrorHttpResponse = assertHttpResponse(
    500,
    DEFAULT_INTERNAL_SERVER_ERROR_MESSAGE,
  );
  const assertTimeoutErrorHttpResponse = assertHttpResponse(504, DEFAULT_TIMEOUT_OCCURRED_MESSAGE);
  const assertBadRequestErrorHttpResponseWithMeta = (meta: any[]) =>
    assertHttpResponse(400, DEFAULT_BAD_REQUEST_MESSAGE, meta);

  describe('internal server error handling', () => {
    it('should handle Init, Db, Resolver errors and return valid InternalServerError httpResponse', () => {
      assertInternalServerErrorHttpResponse(handleError(AppError.Init('init error')));
      assertInternalServerErrorHttpResponse(handleError(AppError.Db('db error')));
      assertInternalServerErrorHttpResponse(handleError(AppError.Resolver('resolver error')));
    });
  });

  describe('timeout error handling', () => {
    it('should handle Timeout error and return valid TimeoutOccured httpResponse', () => {
      assertTimeoutErrorHttpResponse(handleError(AppError.Timeout('timeout error')));
    });
  });

  describe('bad request', () => {
    describe('parse error', () => {
      it('should handle Parse error and return valid BadRequest httpResponse', () => {
        const parseErrorMessage = 'parse error';
        assertBadRequestErrorHttpResponseWithMeta([
          {
            message: parseErrorMessage,
          },
        ])(handleError(AppError.Parse(parseErrorMessage)));
      });
    });

    describe('validation error handling', () => {
      it('should handle Validation error with message only', () => {
        assertBadRequestErrorHttpResponseWithMeta([{ message: 'validation error' }])(
          handleError(AppError.Validation('validation error')),
        );
      });

      it('should handle Validation error with meta and return message from error', () => {
        const meta = { message: 'error description' };
        assertBadRequestErrorHttpResponseWithMeta([{ message: 'validation error' }])(
          handleError(AppError.Validation('validation error', meta)),
        );
      });
    });
  });
});
