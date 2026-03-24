import { captureException } from '@sentry/browser';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary for the browser extension UI.
 * Catches unhandled React render errors, reports them to Sentry,
 * and displays a compact recovery UI appropriate for the extension popup size.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: unknown): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            alignItems: 'center',
            background: '#1c1c1c',
            color: '#e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            justifyContent: 'center',
            minHeight: '200px',
            padding: '24px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Something went wrong</p>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>
            The error has been reported. Please reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#4d6ef5',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '8px 20px',
            }}
            type="button"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
