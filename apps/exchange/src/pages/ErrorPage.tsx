/**
 * Route Error Boundary Page
 * Rendered by React Router v7 when a route loader, action, or component throws.
 * Prevents a white screen of death from propagating to the entire app.
 */
import type React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

// Session key prevents infinite reload loops: only one auto-reload per session.
const CHUNK_RELOAD_KEY = 'exc_chunk_reload';

/**
 * Detect stale-deployment chunk 404s.
 * Chrome: "Failed to fetch dynamically imported module: ..."
 * Safari/WebKit: "Importing a module script failed."
 */
function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('dynamically imported module') || msg.includes('module script failed');
}

export const ErrorPage: React.FC = () => {
  const error = useRouteError();

  // When a lazy chunk 404s (stale HTML after a fresh deployment), silently
  // reload once. The fresh HTML will reference the correct new chunk hashes.
  if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
    return null;
  }
  // Non-chunk error: clear the flag so a future chunk error can trigger again.
  if (!isChunkLoadError(error)) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try refreshing the page.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message = 'The page you are looking for does not exist.';
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: '#0f0f1a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '48px' }}>⚠</div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{title}</h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0, maxWidth: '400px' }}>{message}</p>
      <button
        type="button"
        onClick={() => window.location.assign('/')}
        style={{
          backgroundColor: '#5a81ea',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          marginTop: '8px',
          padding: '12px 24px',
        }}
      >
        Go to Home
      </button>
    </div>
  );
};
