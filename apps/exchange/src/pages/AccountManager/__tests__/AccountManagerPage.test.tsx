/**
 * AccountManagerPage — "Add account" destination
 *
 * "Add account" used to navigate to '/auth/import', which is not registered in
 * `src/routes`. The router's catch-all (`path: '*'`) turned that into a silent
 * redirect to the landing page, so a signed-in user pressing the button landed
 * on marketing copy instead of the import form.
 *
 * The assertion is deliberately made against the router's own route table
 * rather than a hard-coded string: a test that only compared the path to
 * '/import-account' would keep passing if that route were later renamed, which
 * is exactly the failure being guarded against.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/themes';
import { AccountManagerPage } from '../AccountManagerPage';

const navigate = vi.fn();

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
    logout: vi.fn(),
    switchAccount: vi.fn(),
    user: { address: '3PabcdEF', hash: 'hash-1', name: 'My Account' },
  }),
}));
// Signed in, so the "vault locked" effect does not fire a redirect of its own
// and swallow the navigation under test.
vi.mock('@/services/multiAccount', () => ({ multiAccount: { isSignedIn: true } }));
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

describe('AccountManagerPage — add account', () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it('routes "Add account" to a path the router actually registers', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <AccountManagerPage />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /add account/i }));

    expect(navigate).toHaveBeenCalledTimes(1);
    const [target] = navigate.mock.calls[0] as [string];
    expect(target).toBe('/import-account');
    expect(await registeredPaths()).toContain(target);
  });
});
