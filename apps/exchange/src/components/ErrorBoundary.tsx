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
  alignItems: 'center',
  background: '#1a1a1a',
  color: '#ffffff',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '2rem',
};

const errorCardStyle: React.CSSProperties = {
  background: '#2a2a2a',
  border: '2px solid #3a3a3a',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  maxWidth: '600px',
  padding: '3rem',
  textAlign: 'center',
  width: '100%',
};

const errorIconStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'rgba(244, 67, 54, 0.2)',
  borderRadius: '50%',
  display: 'flex',
  fontSize: '3rem',
  height: '80px',
  justifyContent: 'center',
  margin: '0 auto 2rem',
  width: '80px',
};

const errorTitleStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '1.75rem',
  fontWeight: 600,
  margin: '0 0 1rem',
};

const errorMessageStyle: React.CSSProperties = {
  color: '#cccccc',
  fontSize: '1rem',
  lineHeight: 1.6,
  margin: '0 0 2rem',
};

const errorDetailsStyle: React.CSSProperties = {
  background: '#1a1a1a',
  borderRadius: '8px',
  fontFamily: "'Monaco', 'Courier New', monospace",
  fontSize: '0.875rem',
  margin: '2rem 0',
  padding: '1rem',
  textAlign: 'left',
};

const errorDetailsSummaryStyle: React.CSSProperties = {
  color: '#cccccc',
  cursor: 'pointer',
  fontWeight: 500,
  marginBottom: '1rem',
};

const errorStackStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #3a3a3a',
  borderRadius: '4px',
  color: '#f44336',
  fontSize: '0.75rem',
  lineHeight: 1.5,
  margin: 0,
  overflowX: 'auto',
  padding: '1rem',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  justifyContent: 'center',
};

const buttonPrimaryStyle: React.CSSProperties = {
  background: '#2196F3',
  border: 'none',
  borderRadius: '8px',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 500,
  padding: '0.75rem 2rem',
  transition: 'all 0.2s',
};

const buttonSecondaryStyle: React.CSSProperties = {
  background: '#2a2a2a',
  border: '2px solid #3a3a3a',
  borderRadius: '8px',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 500,
  padding: '0.75rem 2rem',
  transition: 'all 0.2s',
};

const helpTextStyle: React.CSSProperties = {
  color: '#999999',
  fontSize: '0.875rem',
  margin: '2rem 0 0',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: undefined,
      errorInfo: undefined,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      hasError: true,
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
      error: undefined,
      errorInfo: undefined,
      hasError: false,
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
              <p style={{ ...errorMessageStyle, color: 'inherit', fontWeight: 500 }}>
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
