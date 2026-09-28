import {
  ArrowLeftRight,
  AtSign,
  Bell,
  BookOpenText,
  ChartCandlestick,
  ChartColumn,
  ChartLine,
  ChartPie,
  CirclePlus,
  HandCoins,
  LayoutGrid,
  ReceiptText,
  Settings,
  UserCog,
  Waypoints,
} from 'lucide-react';
import { type ReactElement } from 'react';
import { type AppTileHue } from '@/theme/tokens/semantic';

export interface Destination {
  path: string;
  label: string;
  /**
   * A Lucide line glyph sized `1em`, so whatever renders it sets its size
   * through `font-size` — the launcher tile's plate does, as it did for the
   * Material glyphs these replaced.
   */
  icon: ReactElement;
  /** One line saying what the screen does — the launcher tile's tooltip. */
  description: string;
  /** Which `appTile` hue identifies this destination in the launcher. */
  hue: AppTileHue;
  /** Matches the route exactly rather than by prefix. */
  exact?: boolean;
}

/*
 * Destinations are named consts rather than members of group arrays.
 *
 * `TOP_TABS` used to reach into those arrays positionally — `WALLET[0] as
 * Destination` — which meant reordering a group silently retitled the top bar,
 * and needed four casts to convince TypeScript the indexes were populated.
 * Named consts remove both problems: the tabs and the grid reference the same
 * objects by name, and identity is assertable.
 */

const DASHBOARD: Destination = {
  description: 'Your balances and activity at a glance',
  exact: true,
  hue: 'indigo',
  icon: <LayoutGrid size="1em" />,
  label: 'Dashboard',
  path: '/desktop/wallet',
};

const PORTFOLIO: Destination = {
  description: 'Every asset this wallet holds',
  hue: 'violet',
  icon: <ChartPie size="1em" />,
  label: 'Portfolio',
  path: '/desktop/wallet/portfolio',
};

const TRANSACTIONS: Destination = {
  description: 'The full history of this address',
  hue: 'slate',
  icon: <ReceiptText size="1em" />,
  label: 'Transactions',
  path: '/desktop/wallet/transactions',
};

const LEASING: Destination = {
  description: 'Delegate DCC to a node and earn',
  hue: 'teal',
  icon: <HandCoins size="1em" />,
  label: 'Leasing',
  path: '/desktop/wallet/leasing',
};

const ALIASES: Destination = {
  description: 'Readable names for your address',
  hue: 'violet',
  icon: <AtSign size="1em" />,
  label: 'Aliases',
  path: '/desktop/wallet/aliases',
};

const ACCOUNT_MANAGER: Destination = {
  description: 'Add, switch or remove accounts on this device',
  hue: 'green',
  icon: <UserCog size="1em" />,
  label: 'Account manager',
  path: '/desktop/wallet/account-manager',
};

const TRADE: Destination = {
  description: 'The order book, live',
  hue: 'green',
  icon: <ChartCandlestick size="1em" />,
  label: 'Trade',
  path: '/desktop/dex',
};

const SWAP: Destination = {
  description: 'One asset for another, at the best rate',
  hue: 'teal',
  icon: <ArrowLeftRight size="1em" />,
  label: 'Swap',
  path: '/desktop/swap',
};

const BRIDGE: Destination = {
  description: 'Move assets across chains',
  hue: 'rose',
  icon: <Waypoints size="1em" />,
  label: 'Bridge',
  path: '/desktop/bridge',
};

const MARKETS: Destination = {
  description: 'Price overview across markets',
  hue: 'blue',
  icon: <ChartLine size="1em" />,
  label: 'Markets',
  path: '/desktop/markets',
};

const ORDER_BOOK: Destination = {
  description: 'Live order book and market depth',
  hue: 'amber',
  icon: <BookOpenText size="1em" />,
  label: 'Order book',
  path: '/desktop/orderbook',
};

const CREATE_TOKEN: Destination = {
  description: 'Issue an asset on DecentralChain',
  hue: 'amber',
  icon: <CirclePlus size="1em" />,
  label: 'Create token',
  path: '/desktop/create-token',
};

const ANALYTICS: Destination = {
  description: 'Activity and performance over time',
  hue: 'blue',
  icon: <ChartColumn size="1em" />,
  label: 'Analytics',
  path: '/desktop/analytics',
};

const MESSAGES: Destination = {
  description: 'Notifications from the network',
  hue: 'slate',
  icon: <Bell size="1em" />,
  label: 'Messages',
  path: '/desktop/messages',
};

const SETTINGS: Destination = {
  description: 'Preferences, security and session',
  hue: 'indigo',
  icon: <Settings size="1em" />,
  label: 'Settings',
  path: '/desktop/settings',
};

/**
 * The launcher grid — every destination, most-used first.
 *
 * The order is also the hue arrangement: seven hues are used twice and `rose`
 * once, positioned so no repeated pair touches at 3, 4 or 7 columns, the three
 * counts the grid pins itself to. `navigation.test.ts` holds that.
 */
export const LAUNCHER_TILES: Destination[] = [
  DASHBOARD,
  TRADE,
  SWAP,
  PORTFOLIO,
  MARKETS,
  TRANSACTIONS,
  ORDER_BOOK,
  BRIDGE,
  LEASING,
  ALIASES,
  ACCOUNT_MANAGER,
  CREATE_TOKEN,
  ANALYTICS,
  MESSAGES,
  SETTINGS,
];

/**
 * The only column counts `LAUNCHER_TILES`' hue arrangement is collision-free
 * at, keyed by breakpoint.
 *
 * This is the single source both `AppLauncher`'s `gridTemplateColumns` and
 * `navigation.test.ts`'s adjacency check build from — so changing a count
 * here is the only way to change it anywhere, and the two can no longer
 * silently drift apart the way two independently hardcoded copies could.
 */
export const LAUNCHER_COLUMNS = { md: 7, sm: 4, xs: 3 } as const;

/**
 * The top tabs. Four destinations and then the launcher: the places worth a
 * click from anywhere, with everything else one press away.
 */
export const TOP_TABS: Destination[] = [DASHBOARD, PORTFOLIO, TRADE, SWAP];

/** Whether a destination is the one currently open. */
export function isCurrent(destination: Destination, pathname: string): boolean {
  if (destination.exact) {
    return pathname === destination.path || pathname === `${destination.path}/`;
  }
  return pathname === destination.path || pathname.startsWith(`${destination.path}/`);
}
