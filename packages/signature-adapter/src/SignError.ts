import { type ERRORS } from './constants';

export class SignError extends Error {
  public readonly code: ERRORS;

  constructor(message: string, code: ERRORS, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.code = code;

    Object.setPrototypeOf(this, SignError.prototype);
  }
}
