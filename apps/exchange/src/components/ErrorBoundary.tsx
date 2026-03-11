import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

// Inline styles to avoid theme dependency (ErrorBoundary must work before ThemeProvider)
const errorContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: '#1a1a1a',
  color: '#ffffff',
};

const errorCardStyle: React.CSSProperties = {
  maxWidth: '600px',
  width: '100%',
  padding: '3rem',
  background: '#2a2a2a',
  border: '2px solid #3a3a3a',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  textAlign: 'center',
};

const errorIconStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  margin: '0 auto 2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(244, 67, 54, 0.2)',
  borderRadius: '50%',
  fontSize: '3rem',
};

const errorTitleStyle: React.CSSProperties = {
  margin: '0 0 1rem',
  fontSize: '1.75rem',
  fontWeight: 600,
  color: '#ffffff',
};

const errorMessageStyle: React.CSSProperties = {
  margin: '0 0 2rem',
  fontSize: '1rem',
  lineHeight: 1.6,
  color: '#cccccc',
};

const errorDetailsStyle: React.CSSProperties = {
  margin: '2rem 0',
  padding: '1rem',
  background: '#1a1a1a',
  borderRadius: '8px',
  textAlign: 'left',
  fontFamily: "'Monaco', 'Courier New', monospace",
  fontSize: '0.875rem',
};

const errorDetailsSummaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: 500,
  color: '#cccccc',
  marginBottom: '1rem',
};

const errorStackStyle: React.CSSProperties = {
  margin: 0,
  padding: '1rem',
  background: '#1a1a1a',
  border: '1px solid #3a3a3a',
  borderRadius: '4px',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  fontSize: '0.75rem',
  lineHeight: 1.5,
  color: '#f44336',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const buttonPrimaryStyle: React.CSSProperties = {
  padding: '0.75rem 2rem',
  fontSize: '1rem',
  fontWeight: 500,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  background: '#2196F3',
  color: '#ffffff',
  transition: 'all 0.2s',
};

const buttonSecondaryStyle: React.CSSProperties = {
  padding: '0.75rem 2rem',
  fontSize: '1rem',
  fontWeight: 500,
  border: '2px solid #3a3a3a',
  borderRadius: '8px',
  cursor: 'pointer',
  background: '#2a2a2a',
  color: '#ffffff',
  transition: 'all 0.2s',
};

const helpTextStyle: React.CSSProperties = {
  margin: '2rem 0 0',
  fontSize: '0.875rem',
  color: '#999999',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Error caught by ErrorBoundary:', error);
    logger.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <div style={errorContainerStyle}>
          <div style={errorCardStyle}>
            <div style={errorIconStyle}>⚠️</div>
            <h1 style={errorTitleStyle}>Oops! Something went wrong</h1>
            <p style={errorMessageStyle}>
              We&apos;re sorry, but something unexpected happened. The error has been logged and
              we&apos;ll look into it.
            </p>

            {this.state.error && (
              <p style={{ ...errorMessageStyle, fontWeight: 500, color: 'inherit' }}>
                {this.state.error.message}
              </p>
            )}

            {this.state.error && this.state.errorInfo && (
              <details style={errorDetailsStyle}>
                <summary style={errorDetailsSummaryStyle}>View technical details</summary>
                <pre style={errorStackStyle}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={buttonGroupStyle}>
              <button type="button" style={buttonPrimaryStyle} onClick={this.handleReset}>
                Try Again
              </button>
              <button type="button" style={buttonSecondaryStyle} onClick={this.handleReload}>
                Reload Page
              </button>
            </div>

            <p style={helpTextStyle}>
              If this problem persists, please contact support or check the console for more
              details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
