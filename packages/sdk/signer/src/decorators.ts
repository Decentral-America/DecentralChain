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

/**
 * Guard for **synchronous** methods. Throws synchronously when no provider is
 * set, which is the correct contract for methods that return a non-Promise value
 * (e.g. `on`, `once`, `off`).
 */
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

/**
 * Guard for **async** methods. Returns `Promise.reject` instead of throwing
 * synchronously, so callers only need a single `.catch()` / `await` try-catch
 * — not both a synchronous `try` block AND a rejection handler.
 *
 * Type-constrained to `Return extends Promise<unknown>` so the compiler rejects
 * accidental use on sync methods at build time.
 */
export function ensureProviderAsync<
  This extends TSigner,
  Args extends unknown[],
  Return extends Promise<unknown>,
>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  const methodName = String(context.name);
  return function (this: This, ...args: Args): Return {
    if (!this.currentProvider) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.ENSURE_PROVIDER, [methodName]);
      return Promise.reject(error) as Return;
    }
    return target.call(this, ...args);
  };
}

/**
 * Wraps async provider calls to intercept and log unexpected errors.
 * Type-constrained to `Return extends Promise<unknown>` — compile-time
 * enforcement that this decorator is only applied to async methods.
 * No runtime `instanceof Promise` branching needed.
 */
export function catchProviderError<
  This extends TSigner,
  Args extends unknown[],
  Return extends Promise<unknown>,
>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  return function (this: This, ...args: Args): Return {
    return target.call(this, ...args).catch((e: unknown) => {
      if (e instanceof Error && e.message === 'User rejection!') {
        return Promise.reject(e);
      }

      if (e instanceof SignerError) {
        return Promise.reject(e);
      }

      const handler = getErrorHandler(this);
      const error = handler(ERRORS.PROVIDER_INTERNAL, [(e as Error)?.message ?? String(e)]);

      this._logger?.error(error);

      return Promise.reject(e);
    }) as Return;
  };
}

/**
 * Auth guard for **async** methods. Returns `Promise.reject` instead of
 * throwing synchronously, preserving a uniform async error contract for callers.
 * Type-constrained to `Return extends Promise<unknown>`.
 */
export function checkAuthAsync<
  This extends TSigner,
  Args extends unknown[],
  Return extends Promise<unknown>,
>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext,
): (this: This, ...args: Args) => Return {
  const methodName = String(context.name);
  return function (this: This, ...args: Args): Return {
    if (this.currentProvider?.user == null) {
      const handler = getErrorHandler(this);
      const error = handler(ERRORS.NOT_AUTHORIZED, [methodName]);
      return Promise.reject(error) as Return;
    }
    return target.call(this, ...args);
  };
}
