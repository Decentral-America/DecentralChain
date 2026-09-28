import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { AssetMark } from '@/components/mobile/primitives';
import { GroupedList, ListRow } from '@/components/premium/GroupedList';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Navigation sheet.
 *
 * The tab bar carries the destinations people use constantly; everything else
 * the product can do lives here. Without it the secondary features — bridge,
 * analytics, token creation, the order book — are unreachable on mobile,
 * since a phone has no room for a persistent sidebar.
 *
 * Presented as a tall bottom sheet of grouped lists, the way iOS presents an
 * account menu, so it can be flicked away with the thumb that opened it.
 */

interface MenuItem {
  icon: IconName;
  label: string;
  to: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    items: [
      { icon: 'wallet', label: 'Portfolio', to: '/desktop/wallet/portfolio' },
      { icon: 'clipboard', label: 'Transactions', to: '/desktop/wallet/transactions' },
      { icon: 'trending', label: 'Leasing', to: '/desktop/wallet/leasing' },
      { icon: 'user', label: 'Aliases', to: '/desktop/wallet/aliases' },
    ],
    title: 'Wallet',
  },
  {
    items: [
      { icon: 'swap', label: 'Trade', to: '/desktop/dex' },
      { icon: 'refresh', label: 'Swap', to: '/desktop/swap' },
      { icon: 'externalLink', label: 'Bridge', to: '/desktop/bridge' },
      { icon: 'chart', label: 'Order book', to: '/desktop/orderbook' },
      { icon: 'search', label: 'Markets', to: '/desktop/markets' },
    ],
    title: 'Trading',
  },
  {
    items: [
      { icon: 'chart', label: 'Analytics', to: '/desktop/analytics' },
      { icon: 'add', label: 'Create token', to: '/desktop/create-token' },
      { icon: 'info', label: 'Messages', to: '/desktop/messages' },
      { icon: 'settings', label: 'Settings', to: '/desktop/settings' },
    ],
    title: 'Tools',
  },
];

/** A 30px tinted glyph tile, the iOS Settings row mark. */
function RowGlyph({ name, active }: { name: IconName; active: boolean }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        alignItems: 'center',
        bgcolor: active ? 'primary.main' : 'var(--surface-lavender)',
        borderRadius: '8px',
        // The accent's own ink on the filled tile: white in light mode, black on
        // the light dark-mode indigo, where white would be 3.71:1.
        color: active ? 'primary.contrastText' : 'var(--color-indigo-ink)',
        display: 'flex',
        flexShrink: 0,
        height: 30,
        justifyContent: 'center',
        transition: 'background-color 160ms var(--ease), color 160ms var(--ease)',
        width: 30,
      }}
    >
      <Icon name={name} size={17} strokeWidth={2} />
    </Box>
  );
}

export function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const address = user?.address ?? '';
  const go = (to: string) => {
    onClose();
    void navigate(to);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="Menu"
      closeLabel="Close menu"
      grouped
      maxHeightRatio={0.92}
    >
      {/* Identity */}
      <GroupedList>
        <ListRow
          leading={
            <AssetMark size={48} tone="accent">
              {address ? address.slice(0, 2).toUpperCase() : 'DX'}
            </AssetMark>
          }
          leadingWidth={48}
          title={user?.name || 'My wallet'}
          subtitle={address ? `${address.slice(0, 10)}…${address.slice(-6)}` : 'Not connected'}
        />
      </GroupedList>

      {GROUPS.map((group) => (
        <GroupedList key={group.title} title={group.title} quiet>
          {group.items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <ListRow
                key={item.to}
                leading={<RowGlyph name={item.icon} active={active} />}
                leadingWidth={30}
                title={item.label}
                {...(active ? { tone: 'accent' as const } : {})}
                onClick={() => go(item.to)}
              />
            );
          })}
        </GroupedList>
      ))}

      <GroupedList>
        <ListRow
          title="Sign out"
          tone="danger"
          chevron={false}
          onClick={() => {
            onClose();
            void logout();
            void navigate('/');
          }}
        />
      </GroupedList>

      <Box sx={{ height: 8 }} />
    </BottomSheet>
  );
}
