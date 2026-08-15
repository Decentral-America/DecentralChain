import { Box, ButtonBase, Typography } from '@mui/material';
import { House, Repeat, Sprout, User } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { MobileMenuDrawer } from '@/components/mobile/MobileMenuDrawer';
import {
  mobileAccent,
  mobileLayout,
  mobileShadow,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

/**
 * Bottom tab bar.
 *
 * Four labelled destinations around a raised trade action. Labels are shown
 * rather than icons alone: the destinations here are not universally
 * recognisable glyphs, and an unlabelled bar forces people to guess.
 *
 * The final slot opens the navigation drawer instead of linking to a screen —
 * a phone has no room for the persistent sidebar the desktop uses, so
 * everything beyond these four lives behind it.
 *
 * The bar is fixed and clears the home indicator via a safe-area inset, so it
 * must be paired with bottom padding on the scroll container (see
 * `mobileLayout.scrollPaddingBottom`).
 */

type Tab = {
  to: string;
  label: string;
  icon: typeof House;
  /** Matches the route exactly rather than by prefix */
  exact?: boolean;
};

const LEFT_TABS: Tab[] = [
  { exact: true, icon: House, label: 'Portfolio', to: '/desktop/wallet' },
  { icon: Repeat, label: 'Swap', to: '/desktop/swap' },
];

const RIGHT_TABS: Tab[] = [{ icon: Sprout, label: 'Earn', to: '/desktop/wallet/leasing' }];

export function MobileTabBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (tab: Tab) =>
    tab.exact
      ? location.pathname === tab.to || location.pathname === `${tab.to}/`
      : location.pathname.startsWith(tab.to);

  const renderTab = (tab: Tab) => {
    const active = isActive(tab);
    const TabIcon = tab.icon;
    return (
      <Box
        key={tab.to}
        component={NavLink}
        to={tab.to}
        aria-label={tab.label}
        aria-current={active ? 'page' : undefined}
        sx={{
          alignItems: 'center',
          color: active ? mobileAccent.base : mobileText.muted,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          height: '100%',
          justifyContent: 'center',
          textDecoration: 'none',
          transition: 'color 150ms ease',
        }}
      >
        <TabIcon size={21} strokeWidth={active ? 2.2 : 1.8} />
        <Typography sx={{ fontSize: 11, fontWeight: active ? 600 : 500, lineHeight: 1 }}>
          {tab.label}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <Box
        component="nav"
        aria-label="Primary"
        sx={{
          bgcolor: mobileSurface.card,
          borderTop: `1px solid ${mobileSurface.border}`,
          bottom: 0,
          boxShadow: mobileShadow.tabBar,
          left: 0,
          pb: 'env(safe-area-inset-bottom)',
          position: 'fixed',
          right: 0,
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            height: mobileLayout.tabBarHeight,
          }}
        >
          {LEFT_TABS.map(renderTab)}

          {/* Raised trade action */}
          <Box
            component={NavLink}
            to="/desktop/dex"
            aria-label="Trade"
            sx={{
              alignItems: 'center',
              display: 'flex',
              // Fills the cell so the touch target is the whole column.
              height: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: mobileAccent.base,
                borderRadius: '50%',
                boxShadow: mobileShadow.accent,
                color: mobileText.onAccent,
                display: 'flex',
                height: 52,
                justifyContent: 'center',
                // Lifts the action clear of the bar without changing its height.
                mt: -3,
                width: 52,
              }}
            >
              <Icon name="swap" size={23} strokeWidth={2.2} />
            </Box>
          </Box>

          {RIGHT_TABS.map(renderTab)}

          {/* Everything else */}
          <ButtonBase
            aria-label="Profile and more"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            sx={{
              color: menuOpen ? mobileAccent.base : mobileText.muted,
              flexDirection: 'column',
              gap: 0.5,
              height: '100%',
              transition: 'color 150ms ease',
              width: '100%',
            }}
          >
            <User size={21} strokeWidth={menuOpen ? 2.2 : 1.8} />
            <Typography sx={{ fontSize: 11, fontWeight: menuOpen ? 600 : 500, lineHeight: 1 }}>
              Profile
            </Typography>
          </ButtonBase>
        </Box>
      </Box>

      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
