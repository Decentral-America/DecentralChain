import { type ErrorHandler } from './helpers.js';
import { type IConsole } from './logger.js';
import { type Signer } from './Signer.js';
import { ERRORS, SignerError } from './SignerError.js';
import { type SignerOptions } from './types/index.js';

type TSigner = { [Key in keyof Signer]: Signer[Key] } & {
  _logger: IConsole;
  _handleError: ErrorHandler;
  _options: SignerOptions;
};

const getErrorHandler = (signer: TSigner): ErrorHandler => {
  return signer._handleError;
};

export const ensureProvider = (
  _target: Signer,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): void => {
  const origin = descriptor.value;

  descriptor.value = function (this: TSigner, ...args: unknown[]): unknown {
    const provider = this.currentProvider;

    if (!provider) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.ENSURE_PROVIDER, [_propertyKey]);
      throw error;
    }

    return origin.apply(this, args);
  };
};

export const catchProviderError = (
  _target: Signer,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): void => {
  const origin = descriptor.value;

  descriptor.value = function (this: TSigner, ...args: unknown[]): unknown {
    return origin.apply(this, args).catch((e: unknown) => {
      if (e === 'Error: User rejection!') {
        return Promise.reject(e);
      }

      if (e instanceof SignerError) {
        return Promise.reject(e);
      }

      const handler = getErrorHandler(this);
      const error = handler(ERRORS.PROVIDER_INTERNAL, [(e as Error)?.message ?? String(e)]);

      this._logger?.error(error);

      return Promise.reject(e);
    });
  };
};

export const checkAuth = (
  _target: Signer,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): void => {
  const origin = descriptor.value;

  descriptor.value = function (this: TSigner, ...args: unknown[]): unknown {
    if (this.currentProvider?.user == null) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.NOT_AUTHORIZED, [_propertyKey]);
      throw error;
    }

    return origin.apply(this, args);
  };
};
