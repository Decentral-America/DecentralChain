import type * as joi from 'joi';
import { type AppError, type ValidationErrorInfo } from '../../errorHandling';
import { HttpResponse } from './types';

const isJoiValidationError = (
  errMeta: ValidationErrorInfo['meta'],
): errMeta is joi.ValidationError =>
  typeof errMeta !== 'undefined' && Array.isArray(errMeta.details);

export const handleError = (error: AppError): HttpResponse => {
  return error.matchWith({
    Db: () => HttpResponse.InternalServerError(),
    Init: () => HttpResponse.InternalServerError(),
    Parse: (errorInfo) =>
      HttpResponse.BadRequest([
        {
          message: errorInfo.error.message,
          ...errorInfo.meta,
        },
      ]),
    Resolver: () => HttpResponse.InternalServerError(),
    Timeout: () => HttpResponse.TimeoutOccured(),
    Validation: (errorInfo) => {
      const errorInfoMeta = errorInfo.meta;
      if (isJoiValidationError(errorInfoMeta)) {
        return HttpResponse.BadRequest(
          errorInfoMeta.details.map((error) => ({
            message: error.message,
          })),
        );
      } else if (errorInfoMeta !== undefined) {
        return HttpResponse.BadRequest([
          {
            message: errorInfo.error.message,
            ...errorInfoMeta,
          },
        ]);
      } else {
        return HttpResponse.BadRequest();
      }
    },
  });
};
