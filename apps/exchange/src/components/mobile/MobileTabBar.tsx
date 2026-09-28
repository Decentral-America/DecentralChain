import { ChartCandlestick, House, Repeat, Sprout, User } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { MobileMenuDrawer } from '@/components/mobile/MobileMenuDrawer';
import { TabBar, type TabBarItem } from '@/components/premium/TabBar';
import { mobileLayout } from '@/styles/mobileTokens';

/**
 * Bottom tab bar.
 *
 * Five labelled destinations on a translucent material bar. Labels are shown
 * rather than icons alone: the destinations here are not universally
 * recognisable glyphs, and an unlabelled bar forces people to guess. Trade is
 * an ordinary tab rather than a raised button: every tab is one tap, so none
 * needs to shout.
 *
 * The final slot opens the navigation sheet instead of linking to a screen —
 * a phone has no room for the persistent sidebar the desktop uses, so
 * everything beyond these four lives behind it.
 *
 * The bar is fixed and clears the home indicator via a safe-area inset;
 * MobileLayout reserves the same height at the bottom of the scroll area.
 */

type TabKey = 'portfolio' | 'swap' | 'trade' | 'earn' | 'profile';

type Tab = {
  key: Exclude<TabKey, 'profile'>;
  to: string;
  label: string;
  icon: typeof House;
};

const TABS: Tab[] = [
  { icon: House, key: 'portfolio', label: 'Portfolio', to: '/desktop/wallet' },
  { icon: Repeat, key: 'swap', label: 'Swap', to: '/desktop/swap' },
  { icon: ChartCandlestick, key: 'trade', label: 'Trade', to: '/desktop/dex' },
  { icon: Sprout, key: 'earn', label: 'Earn', to: '/desktop/wallet/leasing' },
];

/**
 * Which tab each route belongs to. Explicit rather than prefix-matched:
 * `/desktop/wallet` is a prefix of Earn's route, and a prefix rule lit
 * Portfolio on screens it does not own. A route missing here lights no tab.
 */
const ROUTE_TAB: Record<string, TabKey> = {
  '/desktop/bridge': 'swap',
  '/desktop/dex': 'trade',
  '/desktop/markets': 'trade',
  '/desktop/orderbook': 'trade',
  '/desktop/settings': 'profile',
  '/desktop/swap': 'swap',
  '/desktop/wallet': 'portfolio',
  '/desktop/wallet/aliases': 'portfolio',
  '/desktop/wallet/leasing': 'earn',
  '/desktop/wallet/portfolio': 'portfolio',
  '/desktop/wallet/transactions': 'portfolio',
};

function tabForPath(pathname: string): TabKey | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  // The trading screen takes a pair in the path (/desktop/dex/:amount/:price).
  if (path.startsWith('/desktop/dex/')) return 'trade';
  return ROUTE_TAB[path];
}

export function MobileTabBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const current = tabForPath(location.pathname);

  const items: TabBarItem[] = [
    ...TABS.map((tab) => ({
      active: !menuOpen && current === tab.key,
      icon: tab.icon,
      key: tab.to,
      label: tab.label,
      to: tab.to,
    })),
    {
      // Profile opens the navigation sheet; it reads as selected while that
      // sheet is open or on Settings, and nowhere else.
      active: menuOpen || current === 'profile',
      'aria-expanded': menuOpen,
      'aria-haspopup': 'dialog' as const,
      'aria-label': 'Profile and more',
      icon: User,
      key: 'profile',
      label: 'Profile',
      onClick: () => setMenuOpen(true),
    },
  ];

  return (
    <>
      <TabBar items={items} height={mobileLayout.tabBarHeight} />
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
