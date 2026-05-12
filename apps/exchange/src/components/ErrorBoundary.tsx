import type React from 'react';
import { type ReactNode } from 'react';
import {
  type FallbackProps,
  getErrorMessage,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';
import { logger } from '@/lib/logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
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

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = getErrorMessage(error);

  return (
    <div style={errorContainerStyle}>
      <div style={errorCardStyle}>
        <div style={errorIconStyle}>⚠️</div>
        <h1 style={errorTitleStyle}>Oops! Something went wrong</h1>
        <p style={errorMessageStyle}>
          We&apos;re sorry, but something unexpected happened. The error has been logged and
          we&apos;ll look into it.
        </p>

        {message && (
          <p style={{ ...errorMessageStyle, color: 'inherit', fontWeight: 500 }}>{message}</p>
        )}

        <div style={buttonGroupStyle}>
          <button type="button" style={buttonPrimaryStyle} onClick={resetErrorBoundary}>
            Try Again
          </button>
          <button
            type="button"
            style={buttonSecondaryStyle}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>

        <p style={helpTextStyle}>
          If this problem persists, please contact support or check the console for more details.
        </p>
      </div>
    </div>
  );
}

function handleError(error: unknown, info: React.ErrorInfo) {
  logger.error('Error caught by ErrorBoundary:', error);
  logger.error('Error Info:', info.componentStack);
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}
