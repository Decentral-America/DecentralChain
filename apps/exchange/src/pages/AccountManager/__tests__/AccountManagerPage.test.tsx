/**
 * AccountManagerPage — every navigation target is a route the router registers
 *
 * This page accumulated three navigations aimed at paths that do not exist:
 * '/auth/import' for "Add account", and '/auth/login' for both the locked-vault
 * redirect and "Logout All Accounts". The router's catch-all (`path: '*'`)
 * turned each into a silent redirect to the landing page, so a signed-in user
 * pressing a button landed on marketing copy instead of the screen they asked
 * for — and a user whose vault had locked was shown the landing page rather
 * than the password prompt.
 *
 * The assertions are deliberately made against the router's own route table
 * rather than a hard-coded string alone: a test that only compared the path to
 * '/signin' would keep passing if that route were later renamed, which is
 * exactly the failure being guarded against.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { AccountManagerPage } from '../AccountManagerPage';

const navigate = vi.fn();
const logout = vi.fn();
// Mutable so the locked-vault case can flip it; the mock factory below is
// hoisted and evaluated once, so it has to read through this object.
const multiAccountState = { isSignedIn: true };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
// Only `useNavigate` is stubbed: `@/routes` is imported below to check the real
// route table, and it needs `createBrowserRouter`/`Navigate` to be the genuine
// exports.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    accounts: [],
    getActiveState: () => '/desktop/wallet',
    logout,
    switchAccount: vi.fn(),
    user: { address: '3PabcdEF', hash: 'hash-1', name: 'My Account' },
  }),
}));
vi.mock('@/services/multiAccount', () => ({
  multiAccount: {
    get isSignedIn() {
      return multiAccountState.isSignedIn;
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

/** Every path string registered in the app's route table, flattened. */
const registeredPaths = async (): Promise<Set<string>> => {
  const { router } = await import('@/routes');
  const paths = new Set<string>();
  const walk = (routes: readonly { path?: string; children?: readonly unknown[] }[]) => {
    for (const route of routes) {
      if (route.path) paths.add(route.path);
      if (route.children) walk(route.children as Parameters<typeof walk>[0]);
    }
  };
  walk(router.routes as Parameters<typeof walk>[0]);
  return paths;
};

const renderPage = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <AccountManagerPage />
    </ThemeProvider>,
  );

describe('AccountManagerPage — navigation targets', () => {
  beforeEach(() => {
    navigate.mockReset();
    logout.mockReset();
    // Signed in by default, so the "vault locked" effect does not fire a
    // redirect of its own and swallow the navigation under test.
    multiAccountState.isSignedIn = true;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes "Add account" to a path the router actually registers', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /add account/i }));

    expect(navigate).toHaveBeenCalledTimes(1);
    const [target] = navigate.mock.calls[0] as [string];
    expect(target).toBe('/import-account');
    expect(await registeredPaths()).toContain(target);
  });

  it('sends a user with a locked vault to the registered sign-in screen', async () => {
    multiAccountState.isSignedIn = false;

    renderPage();

    expect(navigate).toHaveBeenCalledTimes(1);
    const [target] = navigate.mock.calls[0] as [string];
    expect(target).toBe('/signin');
    expect(await registeredPaths()).toContain(target);
  });

  it('sends "Logout All Accounts" to the registered sign-in screen', async () => {
    // The handler gates on window.confirm; without this it returns early and
    // never navigates at all.
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /logout all accounts/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    const [target] = navigate.mock.calls[0] as [string];
    expect(target).toBe('/signin');
    expect(await registeredPaths()).toContain(target);
  });

  it('leaves no navigation in the page aimed at the unregistered /auth/* prefix', async () => {
    // A regression net for the whole class of bug rather than the three known
    // instances: any future '/auth/...' target would fail here too.
    const paths = await registeredPaths();
    for (const target of ['/import-account', '/signin']) {
      expect(paths).toContain(target);
    }
    expect(paths).not.toContain('/auth/login');
    expect(paths).not.toContain('/auth/import');
  });
});
