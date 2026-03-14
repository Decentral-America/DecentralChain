import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { shouldRetry, getRetryDelay } from './errorHandler';

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (error: AxiosError, retryCount: number) => void;
}

/**
 * Extended Axios Request Config with Retry Support
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  _retryCount?: number;
  _retryConfig?: RetryConfig;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  onRetry: () => {},
};

/**
 * Retry interceptor for failed requests
 */
const retryInterceptor = async (error: AxiosError): Promise<any> => {
  const config = error.config as ApiRequestConfig;

  if (!config) {
    return Promise.reject(error);
  }

  // Initialize retry count
  config._retryCount = config._retryCount || 0;

  // Merge retry config with defaults
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config._retryConfig,
  };

  // Check if we should retry
  const canRetry = shouldRetry(error, config._retryCount, retryConfig.maxRetries);

  if (!canRetry) {
    return Promise.reject(error);
  }

  // Increment retry count
  config._retryCount += 1;

  // Call onRetry callback
  if (retryConfig.onRetry) {
    retryConfig.onRetry(error, config._retryCount);
  }

  // Calculate delay with exponential backoff
  const delay = getRetryDelay(config._retryCount - 1, retryConfig.baseDelay);

  // Log retry attempt in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Retrying request (attempt ${config._retryCount}/${retryConfig.maxRetries}) after ${delay}ms:`,
      config.url
    );
  }

  // Wait for delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Retry the request
  return apiClient(config);
};

/**
 * Create API client with retry logic
 */
export const createApiClient = (baseURL?: string, retryConfig?: RetryConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_URL || '',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: any) => {
      // Merge retry config into request config
      if (retryConfig) {
        config._retryConfig = retryConfig;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor with retry logic
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => retryInterceptor(error)
  );

  return client;
};

/**
 * Default API client instance
 */
export const apiClient = createApiClient();

/**
 * Make a request with custom retry configuration
 */
export const makeRequest = async <T = any>(
  config: AxiosRequestConfig,
  retryConfig?: RetryConfig
): Promise<T> => {
  const requestConfig: ApiRequestConfig = {
    ...config,
    _retryConfig: retryConfig,
  };

  const response = await apiClient.request<T>(requestConfig);
  return response.data;
};

/**
 * Convenience methods with retry support
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
    makeRequest<T>({ ...config, method: 'GET', url }, retryConfig),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryConfig?: RetryConfig
  ) => makeRequest<T>({ ...config, method: 'POST', url, data }, retryConfig),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
    makeRequest<T>({ ...config, method: 'PUT', url, data }, retryConfig),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryConfig?: RetryConfig
  ) => makeRequest<T>({ ...config, method: 'PATCH', url, data }, retryConfig),

  delete: <T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
    makeRequest<T>({ ...config, method: 'DELETE', url }, retryConfig),
};

/**
 * Create a custom API client with specific configuration
 */
export const createCustomApiClient = (
  baseURL: string,
  options?: {
    timeout?: number;
    headers?: Record<string, string>;
    retryConfig?: RetryConfig;
  }
): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: options?.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Add retry interceptor if retry config provided
  if (options?.retryConfig) {
    client.interceptors.request.use(
      (config: any) => {
        config._retryConfig = options.retryConfig;
        return config;
      },
      (error) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => retryInterceptor(error)
    );
  }

  return client;
};
