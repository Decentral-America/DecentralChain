import { AxiosError } from 'axios';

/**
 * API Error Response Interface
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

/**
 * Error Handler Options
 */
export interface ErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  logError?: boolean;
}

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;

    // Response errors (4xx, 5xx)
    if (error.response) {
      const status = error.response.status;

      // Try to get message from response
      const message = response?.message || response?.error || error.message || 'Request failed';

      // Handle specific status codes
      switch (status) {
        case 400:
          return response?.errors
            ? Object.values(response.errors).flat().join(', ')
            : message || 'Bad request - please check your input';
        case 401:
          return 'Unauthorized - please log in again';
        case 403:
          return 'Forbidden - you do not have permission';
        case 404:
          return 'Resource not found';
        case 409:
          return message || 'Conflict - resource already exists';
        case 422:
          return message || 'Validation failed';
        case 429:
          return 'Too many requests - please try again later';
        case 500:
          return 'Internal server error - please try again';
        case 502:
          return 'Bad gateway - service temporarily unavailable';
        case 503:
          return 'Service unavailable - please try again later';
        case 504:
          return 'Gateway timeout - request took too long';
        default:
          return message;
      }
    }

    // Request errors (network issues)
    if (error.request) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout - please try again';
      }
      if (error.code === 'ERR_NETWORK') {
        return 'Network error - please check your connection';
      }
      return 'Network error - please check your connection';
    }

    // Setup errors
    return error.message || 'Request setup error';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return 'An unexpected error occurred';
};

/**
 * Handle API error with toast notification
 */
export const handleApiError = (
  error: unknown,
  showToastFn: (message: string, type: 'error') => void,
  options: ErrorHandlerOptions = {}
): string => {
  const { showToast = true, customMessage, logError = true } = options;

  // Log error in development
  if (logError && process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Get error message
  const errorMessage = customMessage || getErrorMessage(error);

  // Show toast notification
  if (showToast) {
    showToastFn(errorMessage, 'error');
  }

  return errorMessage;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !!error.request && !error.response;
  }
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
};

/**
 * Get validation errors from API response
 */
export const getValidationErrors = (error: unknown): Record<string, string[]> | null => {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;
    return response?.errors || null;
  }
  return null;
};

/**
 * Retry helper for failed requests
 */
export const shouldRetry = (
  error: unknown,
  retryCount: number,
  maxRetries: number = 3
): boolean => {
  if (retryCount >= maxRetries) {
    return false;
  }

  if (error instanceof AxiosError) {
    // Retry on network errors
    if (isNetworkError(error)) {
      return true;
    }

    // Retry on server errors (5xx) but not client errors (4xx)
    const status = error.response?.status;
    if (status && status >= 500 && status < 600) {
      return true;
    }
  }

  return false;
};

/**
 * Get retry delay with exponential backoff
 */
export const getRetryDelay = (retryCount: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, retryCount), 10000); // Max 10 seconds
};
