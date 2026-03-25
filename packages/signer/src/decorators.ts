import { type ErrorHandler } from './helpers.js';
import { type IConsole } from './logger.js';
import { ERRORS, SignerError } from './SignerError.js';
import { type SignerOptions } from './types/index.js';

type TSigner = {
  currentProvider: { user: unknown } | null | undefined;
  _logger: IConsole;
  _handleError: ErrorHandler;
  _options: SignerOptions;
};

const getErrorHandler = (signer: TSigner): ErrorHandler => {
  return signer._handleError;
};

export function ensureProvider<This extends TSigner, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  const methodName = String(context.name);
  return function (this: This, ...args: Args): Return {
    if (!this.currentProvider) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.ENSURE_PROVIDER, [methodName]);
      throw error;
    }
    return target.call(this, ...args);
  };
}

export function catchProviderError<This extends TSigner, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  return function (this: This, ...args: Args): Return {
    const result = target.call(this, ...args);
    if (!(result instanceof Promise)) {
      return result;
    }
    return result.catch((e: unknown) => {
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
    }) as unknown as Return;
  };
}

export function checkAuth<This extends TSigner, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  const methodName = String(context.name);
  return function (this: This, ...args: Args): Return {
    if (this.currentProvider?.user == null) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.NOT_AUTHORIZED, [methodName]);
      throw error;
    }
    return target.call(this, ...args);
  };
}
