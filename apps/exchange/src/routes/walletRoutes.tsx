/**
 * Wallet Module Routes
 * Defines routes for wallet dashboard, portfolio, transactions, leasing, aliases,
 * and account management
 */
import { type RouteObject } from 'react-router';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { ResponsiveScreen } from '@/layouts/ResponsiveScreen';
import { lazyPage } from './lazyPage';

// The wallet shell and both landing screens are deferred like every other
// screen here. They were previously static so that signing in never showed a
// spinner, but `walletRoutes` is reached through `routes/index.tsx`, which the
// entry chunk imports — so "static" meant Dashboard (809 lines) and Wallet were
// bundled into the entry and downloaded by every landing-page visitor who never
// signs in. They now load alongside ProtectedRoute and ResponsiveAppLayout,
// which are themselves lazy, so the sign-in path fetches them in parallel.
const Wallet = lazyPage(() => import('@/pages/Wallet'), 'Wallet');
const Dashboard = lazyPage(() => import('@/pages/Dashboard'), 'Dashboard');
const MobileHome = lazyPage(() => import('@/pages/mobile/MobileHome'), 'MobileHome');

// The concrete file, not the barrel — the barrel re-exports every wallet
// feature and would put all of them inside the portfolio chunk.
const Portfolio = lazyPage(() => import('@/features/wallet/Portfolio'), 'Portfolio');
const LeasingModern = lazyPage(() => import('@/features/wallet/LeasingModern'), 'LeasingModern');
const TransactionsModern = lazyPage(
  () => import('@/features/wallet/TransactionsModern'),
  'TransactionsModern',
);
const AliasManagement = lazyPage(() => import('@/pages/AliasManagement'), 'AliasManagement');
const AccountManagerPage = lazyPage(() => import('@/pages/AccountManager'), 'AccountManagerPage');
const MobilePortfolio = lazyPage(() => import('@/pages/mobile/MobilePortfolio'), 'MobilePortfolio');

/**
 * Wallet routes structure:
 * - /desktop/wallet : Main wallet dashboard overview
 *   - /desktop/wallet/portfolio : Portfolio overview with asset balances
 *   - /desktop/wallet/transactions : Transaction history and details
 *   - /desktop/wallet/leasing : Leasing management (stake/lease DCC)
 *   - /desktop/wallet/aliases : Alias management (create and view aliases)
 *   - /desktop/wallet/account-manager : Multi-account management
 *
 * Each screen renders through `ResponsiveScreen`: the dashboard and portfolio
 * get their own purpose-built mobile screens, everything else reuses its
 * desktop component wrapped in `MobilePageShell` for the mobile chrome.
 */
export const walletRoutes: RouteObject = {
  children: [
    // Dashboard overview at /desktop/wallet.
    {
      element: <ResponsiveScreen mobile={<MobileHome />} desktop={<Dashboard />} />,
      index: true,
    },
    {
      element: <ResponsiveScreen mobile={<MobilePortfolio />} desktop={<Portfolio />} />,
      path: 'portfolio',
    },
    {
      element: (
        <ResponsiveScreen
          mobile={
            <MobilePageShell
              title="Transactions"
              subtitle="Every transfer, order and lease on this account."
            >
              <TransactionsModern />
            </MobilePageShell>
          }
          desktop={<TransactionsModern />}
        />
      ),
      path: 'transactions',
    },
    {
      element: (
        <ResponsiveScreen
          mobile={
            <MobilePageShell
              title="Leasing"
              subtitle="Delegate DCC to a node and earn network rewards."
            >
              <LeasingModern />
            </MobilePageShell>
          }
          desktop={<LeasingModern />}
        />
      ),
      path: 'leasing',
    },
    {
      element: (
        <ResponsiveScreen
          mobile={
            <MobilePageShell
              title="Aliases"
              subtitle="Human-readable names that point at your address."
            >
              <AliasManagement />
            </MobilePageShell>
          }
          desktop={<AliasManagement />}
        />
      ),
      path: 'aliases',
    },
    {
      element: (
        <ResponsiveScreen
          mobile={
            <MobilePageShell
              title="Account manager"
              subtitle="Add, switch or remove accounts on this device."
            >
              <AccountManagerPage />
            </MobilePageShell>
          }
          desktop={<AccountManagerPage />}
        />
      ),
      path: 'account-manager',
    },
  ],
  element: <Wallet />,
  path: 'wallet',
};
