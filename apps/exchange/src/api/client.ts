/**
 * API Client Configuration
 * Axios-based HTTP client with interceptors and error handling
 */
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { config } from '@/config';

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
 * Create API client with base configuration
 */
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  /**
   * Request Interceptor
   * Add any request modifications here (auth tokens, etc.)
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Log requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error: AxiosError) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handle responses and errors globally
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful responses in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${response.config.url}`, response.status);
      }
      return response;
    },
    (error: AxiosError) => {
      // Format error for consistent handling
      const apiError: ApiError = {
        message: error.message || 'An unknown error occurred',
        status: error.response?.status,
        code: error.code,
        details: error.response?.data,
      };

      // Log errors (skip 404s as they're often expected)
      if (apiError.status !== 404) {
        console.error('[API Error]', {
          url: error.config?.url,
          status: apiError.status,
          message: apiError.message,
          details: apiError.details,
        });
      }

      // Handle specific error codes
      if (apiError.status === 401) {
        // Unauthorized - could trigger logout or token refresh
        console.warn('Unauthorized request - authentication required');
      } else if (apiError.status === 500) {
        console.error('Server error:', error.config?.url);
      } else if (apiError.code === 'ECONNABORTED') {
        console.error('Request timeout:', error.config?.url);
      } else if (apiError.code === 'ERR_NETWORK') {
        console.error('Network error - check your connection');
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

/**
 * Main DCC Node API Client
 * For blockchain data and transactions
 */
export const nodeClient = createApiClient(config.nodeUrl);

/**
 * Data Service API Client
 * For historical data, market info, etc.
 */
export const apiClient = createApiClient(config.apiUrl);

/**
 * Matcher API Client
 * For DEX order matching
 * Uses local proxy in development to avoid CORS issues
 */
export const matcherClient = createApiClient(
  process.env.NODE_ENV === 'development' ? '/matcher' : config.matcherUrl
);

/**
 * Generic API request helper
 * @param client - Axios client instance
 * @param endpoint - API endpoint
 * @param options - Axios request config
 * @returns Promise with response data
 */
export async function apiRequest<T = unknown>(
  client: AxiosInstance,
  endpoint: string,
  options?: AxiosRequestConfig
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
  client: AxiosInstance,
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>(client, endpoint, { method: 'GET', params });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(
  client: AxiosInstance,
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(client, endpoint, { method: 'POST', data });
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(
  client: AxiosInstance,
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(client, endpoint, { method: 'PUT', data });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(client: AxiosInstance, endpoint: string): Promise<T> {
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
