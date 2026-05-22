import { type IncomingHttpHeaders } from 'node:http';
import { type Context, type Hono } from 'hono';
import {
  DEFAULT_BAD_REQUEST_MESSAGE,
  DEFAULT_INTERNAL_SERVER_ERROR_MESSAGE,
  DEFAULT_NOT_FOUND_MESSAGE,
  DEFAULT_TIMEOUT_OCCURRED_MESSAGE,
} from '../../errorHandling';
import { type ValuesOf } from '../../types/generic';
import { defaultStringify } from './utils';

export type HttpRequest<Params extends string[] = string[]> = {
  params?: Record<ValuesOf<Params>, string>;
  query?: Record<string, string | string[]>;
  headers: IncomingHttpHeaders;
};

export type EventBus = {
  emit: (name: string, data: unknown) => void;
};

export type AppVariables = {
  eventBus: EventBus;
  postBodyQuery?: string;
  requestId?: string;
};

export type AppEnv = { Variables: AppVariables };
export type AppContext = Context<AppEnv>;
export type AppHono = Hono<AppEnv>;

const headersWithContentType = {
  'Content-Type': 'application/json; charset=utf-8',
};
export class HttpResponse {
  readonly status: number;
  readonly body?: string;
  readonly headers?: Record<string, string>;

  private constructor(status: number, body?: string, headers?: Record<string, string>) {
    this.status = status;
    if (body !== undefined) this.body = body;
    if (headers !== undefined) this.headers = headers;
  }

  public static Ok(body?: string, headers?: Record<string, string>) {
    return new HttpResponse(200, body, headers);
  }

  public static BadRequest(meta?: { message: string }[], headers?: Record<string, string>) {
    return new HttpResponse(
      400,
      defaultStringify({
        message: DEFAULT_BAD_REQUEST_MESSAGE,
        meta,
      }),
      {
        ...headersWithContentType,
        ...headers,
      },
    );
  }

  public static NotFound(headers?: Record<string, string>) {
    return new HttpResponse(
      404,
      defaultStringify({
        message: DEFAULT_NOT_FOUND_MESSAGE,
      }),
      {
        ...headersWithContentType,
        ...headers,
      },
    );
  }

  public static InternalServerError(headers?: Record<string, string>) {
    return new HttpResponse(
      500,
      defaultStringify({
        message: DEFAULT_INTERNAL_SERVER_ERROR_MESSAGE,
      }),
      {
        ...headersWithContentType,
        ...headers,
      },
    );
  }

  public static TimeoutOccured(headers?: Record<string, string>) {
    return new HttpResponse(
      504,
      defaultStringify({
        message: DEFAULT_TIMEOUT_OCCURRED_MESSAGE,
      }),
      {
        ...headersWithContentType,
        ...headers,
      },
    );
  }

  public static ServiceUnavailable(body?: string, headers?: Record<string, string>) {
    return new HttpResponse(503, body, {
      ...headersWithContentType,
      ...headers,
    });
  }

  withHeaders(headers: Record<string, string>): HttpResponse {
    return new HttpResponse(this.status, this.body, headers);
  }
}
