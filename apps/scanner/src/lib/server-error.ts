import { isRouteErrorResponse } from 'react-router';

/**
 * How a server-side routing error should be logged. Unmatched URLs and wrong
 * methods are what vulnerability scanners generate all day; logging each as
 * an error stack buried the real errors.
 */
export function classifyServerError(error: unknown, aborted: boolean): 'ignore' | 'info' | 'error' {
  if (aborted) return 'ignore';
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 405)) return 'info';
  return 'error';
}

export function describeRequest(error: unknown, request: Request): string {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return `${request.method} ${new URL(request.url).pathname} -> ${status}`;
}
