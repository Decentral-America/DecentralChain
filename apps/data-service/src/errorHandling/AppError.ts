/** Local re-declaration — removes the folktale dependency on Matchable. */
interface Matchable {
  matchWith<C>(pattern: AppErrorPattern<C>): C;
}

export type ErrorMetaInfo = Record<string, unknown>;

export type ErrorType = keyof AppErrorPattern<any>;

export type CommonErrorInfo = {
  readonly error: Error;
  readonly type: ErrorType;
};

export type ErrorInfo = CommonErrorInfo & {
  readonly meta?: ErrorMetaInfo | undefined;
};

export type ValidationErrorInfo = CommonErrorInfo & {
  readonly meta?: ErrorMetaInfo | undefined;
};

export type AppErrorPattern<C> = {
  Db: (e: ErrorInfo) => C;
  Init: (e: ErrorInfo) => C;
  Resolver: (e: ErrorInfo) => C;
  Validation: (e: ValidationErrorInfo) => C;
  Parse: (e: ErrorInfo) => C;
  Timeout: (e: ErrorInfo) => C;
};

const ensureError = (e: Error | string): Error => (e instanceof Error ? e : new Error(e));

function createErrorInfo(
  type: ErrorType,
  error: Error,
  meta?: ErrorMetaInfo,
): ErrorInfo | ValidationErrorInfo {
  return { error, meta, type };
}

// @todo more specific error types (e.g. resolver error is not informative about what really happened)
export abstract class AppError implements Matchable {
  public abstract readonly type: ErrorInfo['type'];
  public abstract readonly error: ErrorInfo['error'];

  public abstract matchWith<C>(pattern: AppErrorPattern<C>): C;

  public static Db(error: Error | string, meta?: ErrorMetaInfo): DbError {
    return new DbError(error, meta);
  }
  public static Init(error: Error | string, meta?: ErrorMetaInfo) {
    return new InitError(error, meta);
  }
  public static Resolver(error: Error | string, meta?: ErrorMetaInfo) {
    return new ResolverError(error, meta);
  }
  public static Validation(error: Error | string, meta?: ErrorMetaInfo) {
    return new ValidationError(error, meta);
  }
  public static Parse(error: Error | string, meta?: ErrorMetaInfo) {
    return new ParseError(error, meta);
  }
  public static Timeout(error: Error | string, meta?: ErrorMetaInfo) {
    return new Timeout(error, meta);
  }
}

export class InitError extends AppError {
  public readonly type = 'Init';
  public readonly error: ErrorInfo['error'];
  public readonly meta: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorMetaInfo) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Init(createErrorInfo(this.type, this.error, this.meta));
  }
}

export class ResolverError extends AppError implements ErrorInfo {
  public readonly type = 'Resolver';
  public readonly error: ErrorInfo['error'];
  public readonly meta?: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorMetaInfo) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Resolver(
      this.meta === undefined
        ? createErrorInfo(this.type, this.error)
        : createErrorInfo(this.type, this.error, this.meta),
    );
  }
}

export class DbError extends AppError implements ErrorInfo {
  public readonly type = 'Db';
  public readonly error: ErrorInfo['error'];
  public readonly meta?: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorMetaInfo) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Db(
      this.meta === undefined
        ? createErrorInfo(this.type, this.error)
        : createErrorInfo(this.type, this.error, this.meta),
    );
  }
}

export class ValidationError extends AppError {
  public readonly type = 'Validation';
  public readonly error: ErrorInfo['error'];
  public readonly meta?: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorInfo['meta']) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Validation(createErrorInfo(this.type, this.error, this.meta));
  }
}

export class ParseError extends AppError implements ErrorInfo {
  public readonly type = 'Parse';
  public readonly error: ErrorInfo['error'];
  public readonly meta?: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorMetaInfo) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Parse(
      this.meta === undefined
        ? createErrorInfo(this.type, this.error)
        : createErrorInfo(this.type, this.error, this.meta),
    );
  }
}

export class Timeout extends AppError implements ErrorInfo {
  public readonly type = 'Timeout';
  public readonly error: ErrorInfo['error'];
  public readonly meta?: ErrorInfo['meta'];

  constructor(error: Error | string, meta?: ErrorMetaInfo) {
    super();
    this.error = ensureError(error);
    this.meta = meta;
  }

  public matchWith<C>(pattern: AppErrorPattern<C>): C {
    return pattern.Timeout(
      this.meta === undefined
        ? createErrorInfo(this.type, this.error)
        : createErrorInfo(this.type, this.error, this.meta),
    );
  }
}
