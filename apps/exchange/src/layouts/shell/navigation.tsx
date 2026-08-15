import {
  AccountBalanceWallet,
  AddCircleOutlined,
  Apps,
  Badge,
  BarChart,
  Inventory2Outlined,
  ManageAccounts,
  NotificationsNoneOutlined,
  QueryStats,
  ReceiptLong,
  Settings,
  ShowChart,
  SwapHoriz,
  Timeline,
} from '@mui/icons-material';
import { type ReactElement } from 'react';

/**
 * The application's navigation model, in one place.
 *
 * Two surfaces read from it and they answer different questions. The top tabs
 * are "which part of the product am I in" — four destinations, always visible,
 * the ones worth a click from anywhere. The launcher is "everything there is",
 * grouped by what the destinations are for.
 *
 * Both are generated from this list so a route can never appear in one and be
 * missing from the other.
 */

export interface Destination {
  path: string;
  label: string;
  icon: ReactElement;
  /** One line saying what the screen does — shown on the launcher card. */
  description: string;
  /** Matches the route exactly rather than by prefix. */
  exact?: boolean;
}

/** Wallet surfaces — what you hold and what has happened to it. */
const WALLET: Destination[] = [
  {
    description: 'Your balances and activity at a glance',
    exact: true,
    icon: <Apps />,
    label: 'Dashboard',
    path: '/desktop/wallet',
  },
  {
    description: 'Every asset this wallet holds',
    icon: <Inventory2Outlined />,
    label: 'Portfolio',
    path: '/desktop/wallet/portfolio',
  },
  {
    description: 'The full history of this address',
    icon: <ReceiptLong />,
    label: 'Transactions',
    path: '/desktop/wallet/transactions',
  },
  {
    description: 'Delegate DCC to a node and earn',
    icon: <Timeline />,
    label: 'Leasing',
    path: '/desktop/wallet/leasing',
  },
  {
    description: 'Readable names for your address',
    icon: <Badge />,
    label: 'Aliases',
    path: '/desktop/wallet/aliases',
  },
  {
    description: 'Add, switch or remove accounts on this device',
    icon: <ManageAccounts />,
    label: 'Account manager',
    path: '/desktop/wallet/account-manager',
  },
];

/** Places where an order or a transfer is actually made. */
const MARKETS: Destination[] = [
  {
    description: 'The order book, live',
    icon: <ShowChart />,
    label: 'Trade',
    path: '/desktop/dex',
  },
  {
    description: 'One asset for another, at the best rate',
    icon: <SwapHoriz />,
    label: 'Swap',
    path: '/desktop/swap',
  },
  {
    description: 'Move assets across chains',
    icon: <AccountBalanceWallet />,
    label: 'Bridge',
    path: '/desktop/bridge',
  },
  {
    description: 'Price overview across markets',
    icon: <BarChart />,
    label: 'Markets',
    path: '/desktop/markets',
  },
  {
    description: 'Live order book and market depth',
    icon: <ReceiptLong />,
    label: 'Order book',
    path: '/desktop/orderbook',
  },
];

/** Everything else that acts on the account. */
const TOOLS: Destination[] = [
  {
    description: 'Issue an asset on DecentralChain',
    icon: <AddCircleOutlined />,
    label: 'Create token',
    path: '/desktop/create-token',
  },
  {
    description: 'Activity and performance over time',
    icon: <QueryStats />,
    label: 'Analytics',
    path: '/desktop/analytics',
  },
  {
    description: 'Notifications from the network',
    icon: <NotificationsNoneOutlined />,
    label: 'Messages',
    path: '/desktop/messages',
  },
  {
    description: 'Preferences, security and session',
    icon: <Settings />,
    label: 'Settings',
    path: '/desktop/settings',
  },
];

/** The launcher's shelves — every destination there is, grouped by purpose. */
export const LAUNCHER_GROUPS: { title: string; items: Destination[] }[] = [
  { items: WALLET, title: 'Wallet' },
  { items: MARKETS, title: 'Markets' },
  { items: TOOLS, title: 'Tools' },
];

/**
 * The top tabs. Four destinations and then the launcher: the places worth a
 * click from anywhere, with everything else one press away.
 */
export const TOP_TABS: Destination[] = [
  WALLET[0] as Destination,
  WALLET[1] as Destination,
  MARKETS[0] as Destination,
  MARKETS[1] as Destination,
];

/** Whether a destination is the one currently open. */
export function isCurrent(destination: Destination, pathname: string): boolean {
  if (destination.exact) {
    return pathname === destination.path || pathname === `${destination.path}/`;
  }
  return pathname === destination.path || pathname.startsWith(`${destination.path}/`);
}
