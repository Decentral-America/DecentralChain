import { Box, ButtonBase, Divider, Drawer, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { AssetMark } from '@/components/mobile/primitives';
import { useAuth } from '@/contexts/AuthContext';
import {
  mobileAccent,
  mobileRadius,
  mobileStatus,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

/**
 * Navigation drawer.
 *
 * The tab bar carries the four destinations people use constantly; everything
 * else the product can do lives here. Without it the secondary features —
 * swap, bridge, analytics, token creation, the order book — are unreachable on
 * mobile, since a phone has no room for a persistent sidebar.
 */

interface MenuItem {
  icon: IconName;
  label: string;
  to: string;
  description?: string;
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backgroundImage: 'none',
            bgcolor: mobileSurface.canvas,
            /*
             * Fixed fill, so the ink is fixed with it. The drawer's own rows
             * all name a colour, but the account name at the top did not, and
             * inherited MUI's mode-aware `text.primary` through `CssBaseline`:
             * `#f5f4ff` on `#F4F5F7`, 1.00:1 in dark — the wallet's own name,
             * invisible, in the shell's primary navigation drawer.
             */
            color: mobileText.primary,
            // Leaves the underlying screen partly visible, as a drawer should.
            maxWidth: '92vw',
            width: 320,
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pb: 'calc(env(safe-area-inset-bottom) + 12px)',
          pt: 'calc(env(safe-area-inset-top) + 12px)',
        }}
      >
        {/* Identity */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, px: 2, py: 1.5 }}>
          <AssetMark size={44} bg={mobileAccent.wash}>
            <Box sx={{ color: mobileAccent.base, fontSize: 15 }}>
              {address ? address.slice(0, 2).toUpperCase() : 'DX'}
            </Box>
          </AssetMark>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
              {user?.name || 'My wallet'}
            </Typography>
            <Typography
              sx={{
                color: mobileText.muted,
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {address ? `${address.slice(0, 10)}…${address.slice(-6)}` : 'Not connected'}
            </Typography>
          </Box>
          <ButtonBase
            aria-label="Close menu"
            onClick={onClose}
            sx={{ borderRadius: '50%', color: mobileText.muted, height: 44, width: 44 }}
          >
            <Icon name="close" size={20} strokeWidth={2} />
          </ButtonBase>
        </Box>

        <Divider sx={{ borderColor: mobileSurface.border }} />

        {/* Destinations */}
        {/* Scrolling the destination list must not chain to the page behind the drawer. */}
        <Box sx={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', px: 1.5, py: 1 }}>
          {GROUPS.map((group) => (
            <Box key={group.title} sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  color: mobileText.muted,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  px: 1,
                  py: 1,
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </Typography>

              {group.items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <ButtonBase
                    key={item.to}
                    onClick={() => go(item.to)}
                    sx={{
                      bgcolor: active ? mobileAccent.wash : 'transparent',
                      borderRadius: mobileRadius.md,
                      color: active ? mobileAccent.base : mobileText.primary,
                      display: 'flex',
                      gap: 1.5,
                      justifyContent: 'flex-start',
                      minHeight: 46,
                      px: 1,
                      width: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        color: active ? mobileAccent.base : mobileText.secondary,
                        flexShrink: 0,
                        lineHeight: 0,
                      }}
                    >
                      <Icon name={item.icon} size={19} strokeWidth={1.8} />
                    </Box>
                    <Typography sx={{ fontSize: 15, fontWeight: active ? 600 : 500 }}>
                      {item.label}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: mobileSurface.border }} />

        <Box sx={{ px: 1.5, py: 1 }}>
          <ButtonBase
            onClick={() => {
              onClose();
              void logout();
              void navigate('/');
            }}
            sx={{
              borderRadius: mobileRadius.md,
              color: mobileStatus.danger,
              display: 'flex',
              gap: 1.5,
              justifyContent: 'flex-start',
              minHeight: 46,
              px: 1,
              width: '100%',
            }}
          >
            <Box sx={{ flexShrink: 0, lineHeight: 0 }}>
              <Icon name="logout" size={19} strokeWidth={1.8} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 500 }}>Sign out</Typography>
          </ButtonBase>
        </Box>
      </Box>
    </Drawer>
  );
}
