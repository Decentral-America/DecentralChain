/**
 * API Client Configuration
 * Fetch-based HTTP client with error handling
 */
import { config } from '@/config';
import { logger } from '@/lib/logger';

/**
 * API Error Response
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * HTTP Error thrown on non-ok responses
 */
export class HttpError extends Error {
  status: number;
  statusText: string;
  data: unknown;
  code?: string;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * Request configuration
 */
export interface RequestConfig {
  method?: string;
  url?: string;
  params?: Record<string, unknown> | undefined;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP Response wrapper
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Validate that a base URL uses HTTPS in production.
 * SECURITY: Financial API calls MUST use HTTPS to prevent MitM attacks.
 */
function validateBaseURL(url: string): string {
  if (!url) {
    throw new Error('API client: baseURL is required');
  }

  const isProd = import.meta.env.PROD;
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

  if (isProd && !isLocalhost && !url.startsWith('https://')) {
    throw new Error(
      `SECURITY: API base URL must use HTTPS in production. Got: ${url.slice(0, 30)}...`,
    );
  }

  return url;
}

/**
 * Fetch-based HTTP Client
 */
class FetchClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, options?: { timeout?: number; headers?: Record<string, string> }) {
    this.baseURL = validateBaseURL(baseURL);
    this.timeout = options?.timeout ?? 30000;
    this.defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  }

  private buildUrl(reqConfig: RequestConfig): string {
    let url = reqConfig.url ?? '';
    if (!url.startsWith('http')) {
      url = this.baseURL + url;
    }

    if (reqConfig.params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(reqConfig.params)) {
        if (val !== undefined && val !== null) {
          searchParams.set(key, String(val));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
    }

    return url;
  }

  private async handleErrorResponse(res: Response, url: string): Promise<never> {
    let errorData: unknown;
    try {
      errorData = await res.json();
    } catch {
      errorData = await res.text();
    }

    const apiError: ApiError = {
      details: errorData,
      message: (errorData as { message?: string })?.message || res.statusText,
      status: res.status,
    };

    if (res.status !== 404) {
      logger.error('[API Error]', {
        details: apiError.details,
        message: apiError.message,
        status: res.status,
        url,
      });
    }

    if (res.status === 401) {
      logger.warn('Unauthorized request - authentication required');
    } else if (res.status === 500) {
      logger.error('Server error:', url);
    }

    throw new HttpError(res.status, res.statusText, errorData);
  }

  async request<T = unknown>(reqConfig: RequestConfig): Promise<HttpResponse<T>> {
    const url = this.buildUrl(reqConfig);
    const headers = { ...this.defaultHeaders, ...reqConfig.headers };
    const method = reqConfig.method ?? 'GET';

    const init: RequestInit = {
      headers,
      method,
      signal: AbortSignal.timeout(reqConfig.timeout ?? this.timeout),
    };

    if (reqConfig.data !== undefined && method !== 'GET') {
      init.body =
        typeof reqConfig.data === 'string' ? reqConfig.data : JSON.stringify(reqConfig.data);
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Request] ${method} ${url}`);
    }

    const res = await fetch(url, init);

    if (!res.ok) {
      await this.handleErrorResponse(res, url);
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Response] ${url}`, res.status);
    }

    const data = (await res.json()) as T;
    return { data, headers: res.headers, status: res.status, statusText: res.statusText };
  }

  get<T = unknown>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, data, method: 'POST', url });
  }

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, data, method: 'PUT', url });
  }
}

/**
 * Main DCC Node API Client
 * For blockchain data and transactions
 */
export const nodeClient = new FetchClient(config.nodeUrl);

/**
 * Data Service API Client
 * For historical data, market info, etc.
 */
export const apiClient = new FetchClient(config.apiUrl);

/**
 * Matcher API Client
 * For DEX order matching
 * Uses local proxy in development to avoid CORS issues
 */
export const matcherClient = new FetchClient(
  process.env.NODE_ENV === 'development' ? '/matcher' : config.matcherUrl,
);

/**
 * Generic API request helper
 */
export async function apiRequest<T = unknown>(
  client: FetchClient,
  endpoint: string,
  options?: RequestConfig,
): Promise<T> {
  const response = await client.request<T>({
    url: endpoint,
    ...options,
  });
  return response.data;
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(
  client: FetchClient,
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<T> {
  return apiRequest<T>(client, endpoint, { method: 'GET', params });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(
  client: FetchClient,
  endpoint: string,
  data?: unknown,
): Promise<T> {
  return apiRequest<T>(client, endpoint, { data, method: 'POST' });
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(
  client: FetchClient,
  endpoint: string,
  data?: unknown,
): Promise<T> {
  return apiRequest<T>(client, endpoint, { data, method: 'PUT' });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(client: FetchClient, endpoint: string): Promise<T> {
  return apiRequest<T>(client, endpoint, { method: 'DELETE' });
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}
