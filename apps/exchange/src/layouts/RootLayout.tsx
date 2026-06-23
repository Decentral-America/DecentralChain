/**
 * Root Layout
 * Wrapper for all routes that provides a router Outlet with error boundary scope.
 * GlobalKeyboardShortcuts lives in AuthBoundaryLayout (requires useAuth).
 */
import { Outlet } from 'react-router';

export const RootLayout = () => <Outlet />;
