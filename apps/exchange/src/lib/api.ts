import { HttpError, type HttpResponse, type RequestConfig } from '@/api/client';
import { logger } from '@/lib/logger';
import { getRetryDelay, shouldRetry } from './errorHandler';

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (error: unknown, retryCount: number) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  baseDelay: 1000,
  maxRetries: 3,
  onRetry: () => {},
};

/**
 * Execute a fetch request with retry logic
 */
async function fetchWithRetry<T = unknown>(
  url: string,
  init: RequestInit & { timeout?: number },
  retryConfig: RetryConfig = {},
  retryCount = 0,
): Promise<HttpResponse<T>> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  try {
    const { timeout = 30000, ...fetchInit } = init;
    const res = await fetch(url, {
      ...fetchInit,
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = await res.text();
      }
      throw new HttpError(res.status, res.statusText, errorData);
    }

    const data = (await res.json()) as T;
    return { data, headers: res.headers, status: res.status, statusText: res.statusText };
  } catch (error) {
    if (shouldRetry(error, retryCount, config.maxRetries)) {
      const nextCount = retryCount + 1;
      config.onRetry(error, nextCount);

      const delay = getRetryDelay(retryCount, config.baseDelay);

      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `Retrying request (attempt ${nextCount}/${config.maxRetries}) after ${delay}ms:`,
          url,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry<T>(url, init, retryConfig, nextCount);
    }
    throw error;
  }
}

/**
 * Build a full URL from base + path + params
 */
function buildUrl(baseURL: string, path: string, params?: Record<string, unknown>): string {
  let url = path.startsWith('http') ? path : baseURL + path;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        searchParams.set(key, String(val));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
  }
  return url;
}

const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Make a request with retry support
 */
export const makeRequest = async <T = unknown>(
  config: RequestConfig & { baseURL?: string },
  retryConfig?: RetryConfig,
): Promise<T> => {
  const baseURL = config.baseURL ?? DEFAULT_BASE_URL;
  const url = buildUrl(baseURL, config.url ?? '', config.params);
  const method = config.method ?? 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  const init: RequestInit & { timeout?: number } = {
    headers,
    method,
    timeout: config.timeout ?? 30000,
  };

  if (config.data !== undefined && method !== 'GET') {
    init.body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
  }

  const response = await fetchWithRetry<T>(url, init, retryConfig);
  return response.data;
};

/**
 * Convenience methods with retry support
 */
export const api = {
  delete: <T = unknown>(url: string, config?: RequestConfig, retryConfig?: RetryConfig) =>
    makeRequest<T>({ ...config, method: 'DELETE', url }, retryConfig),
  get: <T = unknown>(url: string, config?: RequestConfig, retryConfig?: RetryConfig) =>
    makeRequest<T>({ ...config, method: 'GET', url }, retryConfig),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    retryConfig?: RetryConfig,
  ) => makeRequest<T>({ ...config, data, method: 'PATCH', url }, retryConfig),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    retryConfig?: RetryConfig,
  ) => makeRequest<T>({ ...config, data, method: 'POST', url }, retryConfig),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    retryConfig?: RetryConfig,
  ) => makeRequest<T>({ ...config, data, method: 'PUT', url }, retryConfig),
};
