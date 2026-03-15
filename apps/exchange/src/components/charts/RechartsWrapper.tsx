/**
 * RechartsWrapper - Fixes Recharts v3 infinite loop with React 18
 *
 * The issue: Recharts v3 uses an internal Redux-style subscription system
 * that calls setState during render when data updates. Combined with React
 * Query's refetchInterval, this creates an infinite re-render loop.
 *
 * The fix: Isolate Recharts in a separate component boundary with error
 * recovery, and use a key-based remounting strategy to break the cycle.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface RechartsWrapperProps {
  children: ReactNode;
  /** Unique key to force remount when data changes */
  dataKey?: string | number;
}

interface RechartsWrapperState {
  hasError: boolean;
  errorCount: number;
}

/**
 * Error boundary wrapper that catches Recharts infinite loop errors
 * and recovers by remounting the component tree
 */
export class RechartsWrapper extends Component<RechartsWrapperProps, RechartsWrapperState> {
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(props: RechartsWrapperProps) {
    super(props);
    this.state = {
      errorCount: 0,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RechartsWrapperState> | null {
    // Only catch "Maximum update depth exceeded" errors from Recharts
    if (error.message.includes('Maximum update depth exceeded')) {
      return { hasError: true };
    }
    // Re-throw other errors
    throw error;
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message.includes('Maximum update depth exceeded')) {
      logger.warn('[RechartsWrapper] Caught Recharts infinite loop, recovering...', {
        componentStack: errorInfo.componentStack,
        error: error.message,
      });

      // Increment error count
      this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));

      // Auto-recover after a short delay
      this.resetTimer = setTimeout(() => {
        this.setState({ hasError: false });
      }, 50);
    }
  }

  override componentDidUpdate(prevProps: RechartsWrapperProps) {
    // Reset error state when data changes (via dataKey prop)
    if (prevProps.dataKey !== this.props.dataKey && this.state.hasError) {
      this.setState({ errorCount: 0, hasError: false });
    }
  }

  override componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  override render() {
    if (this.state.hasError) {
      // Show loading state during recovery
      return (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '300px',
          }}
        >
          Refreshing chart...
        </div>
      );
    }

    // Use key prop to force remount when data changes
    return <div key={this.props.dataKey}>{this.props.children}</div>;
  }
}
