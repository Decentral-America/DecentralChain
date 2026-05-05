import { type AppError } from '../../errorHandling';
import { HttpResponse } from './types';

export const handleError = (error: AppError): HttpResponse =>
  error.matchWith({
    Db: () => HttpResponse.InternalServerError(),
    Init: () => HttpResponse.InternalServerError(),
    Parse: (errorInfo) => HttpResponse.BadRequest([{ message: errorInfo.error.message }]),
    Resolver: () => HttpResponse.InternalServerError(),
    Timeout: () => HttpResponse.TimeoutOccured(),
    Validation: (errorInfo) => HttpResponse.BadRequest([{ message: errorInfo.error.message }]),
  });
