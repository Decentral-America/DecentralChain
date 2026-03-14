/**
 * Root Layout
 * Wrapper for all routes that includes global components requiring router context
 */
import { Outlet } from 'react-router-dom';
import { GlobalKeyboardShortcuts } from '@/components';

export const RootLayout = () => {
  return (
    <>
      <GlobalKeyboardShortcuts />
      <Outlet />
    </>
  );
};
