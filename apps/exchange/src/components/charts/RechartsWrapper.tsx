/**
 * RechartsWrapper - Fixes Recharts v3 infinite loop with React 18+
 *
 * The issue: Recharts v3 uses an internal Redux-style subscription system
 * that calls setState during render when data updates. Combined with React
 * Query's refetchInterval, this creates an infinite re-render loop.
 *
 * The fix: Isolate Recharts in a separate ErrorBoundary with auto-recovery.
 * Non-Recharts errors propagate to the parent boundary.
 */
import { type ReactNode, useEffect } from 'react';
import { ErrorBoundary, type FallbackProps, getErrorMessage } from 'react-error-boundary';
import { logger } from '@/lib/logger';

export interface RechartsWrapperProps {
  children: ReactNode;
  /** Unique key to force remount when data changes */
  dataKey?: string | number;
}

const recoveryStyle = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '300px',
} as const;

/**
 * Fallback rendered while Recharts recovers from an infinite loop.
 * Throws non-Recharts errors so they propagate to the parent boundary.
 */
function RechartsRecoveryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = getErrorMessage(error);

  // Non-Recharts errors must propagate — parent boundary handles them
  if (!message?.includes('Maximum update depth exceeded')) {
    throw error;
  }

  // Auto-recover after a single tick to break the render cycle
  useEffect(() => {
    const timer = setTimeout(resetErrorBoundary, 50);
    return () => {
      clearTimeout(timer);
    };
  }, [resetErrorBoundary]);

  return <div style={recoveryStyle}>Refreshing chart...</div>;
}

function handleRechartsError(error: unknown) {
  const message = getErrorMessage(error);
  if (message?.includes('Maximum update depth exceeded')) {
    logger.warn('[RechartsWrapper] Caught Recharts infinite loop, recovering...', {
      error: message,
    });
  }
}

/**
 * Wraps Recharts charts to prevent infinite re-render loops from propagating.
 * Automatically remounts when `dataKey` changes.
 */
export function RechartsWrapper({ children, dataKey }: RechartsWrapperProps) {
  return (
    <ErrorBoundary
      FallbackComponent={RechartsRecoveryFallback}
      resetKeys={[dataKey]}
      onError={handleRechartsError}
    >
      {/* key forces remount when dataKey changes, breaking stale render cycles */}
      <div key={dataKey}>{children}</div>
    </ErrorBoundary>
  );
}
