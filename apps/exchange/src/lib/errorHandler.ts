import { HttpError } from '@/api/client';
import { logger } from '@/lib/logger';

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
  if (error instanceof HttpError) {
    const response = error.data as ApiErrorResponse | undefined;
    const status = error.status;
    const message = response?.message || response?.error || error.message || 'Request failed';

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

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error - please check your connection';
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'Request timeout - please try again';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Handle API error with toast notification
 */
export const handleApiError = (
  error: unknown,
  showToastFn: (message: string, type: 'error') => void,
  options: ErrorHandlerOptions = {},
): string => {
  const { showToast = true, customMessage, logError = true } = options;

  // Log error in development
  if (logError && process.env.NODE_ENV === 'development') {
    logger.error('API Error:', error);
  }

  // biome-ignore lint/nursery/useNullishCoalescing: empty string customMessage means no override — fall through to generated message
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
  return error instanceof TypeError && error.message === 'Failed to fetch';
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  return error instanceof HttpError && error.status === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  return error instanceof HttpError && (error.status === 422 || error.status === 400);
};

/**
 * Get validation errors from API response
 */
export const getValidationErrors = (error: unknown): Record<string, string[]> | null => {
  if (error instanceof HttpError) {
    const response = error.data as ApiErrorResponse | undefined;
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
  maxRetries: number = 3,
): boolean => {
  if (retryCount >= maxRetries) {
    return false;
  }

  // Retry on network errors
  if (isNetworkError(error)) {
    return true;
  }

  // Retry on server errors (5xx) but not client errors (4xx)
  if (error instanceof HttpError) {
    return error.status >= 500 && error.status < 600;
  }

  return false;
};

/**
 * Get retry delay with exponential backoff
 */
export const getRetryDelay = (retryCount: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * 2 ** retryCount, 10000); // Max 10 seconds
};
