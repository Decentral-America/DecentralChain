/**
 * Application Sidebar
 * Modern sidebar with gradient pills, watchlist, and upgrade card
 */

import {
  AccountBalanceWallet,
  Apps,
  ArrowForward,
  Badge,
  CurrencyBitcoin,
  HelpOutline,
  Inventory2Outlined,
  KeyboardArrowDown,
  Mail,
  MoreHoriz,
  QueryStats,
  ReceiptLong,
  SettingsOutlined,
  ShowChart,
  SwapHoriz,
  Timeline,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

// Logo component (Decentral Exchange branding)
const Logo = () => (
  <Box
    component="img"
    src="/assets/decentralexchange.svg"
    alt="Decentral Exchange"
    sx={{
      height: 28,
      width: 'auto',
      maxWidth: '100%',
      ml: 1,
    }}
  />
);

// Section label component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    sx={{
      color: '#98A2B3',
      fontWeight: 700,
      letterSpacing: 0.3,
      textTransform: 'none',
      mb: 1.25,
      mt: 3,
      display: 'block',
    }}
  >
    {children}
  </Typography>
);

// Dot badge for notifications
const DotBadge = ({ value }: { value: number }) => (
  <Box
    sx={{
      ml: 1,
      width: 24,
      height: 24,
      borderRadius: '50%',
      backgroundColor: '#16A34A',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {value}
  </Box>
);

// Navigation item component
interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  to: string;
  active?: boolean;
  endAdornment?: React.ReactNode;
}

const NavItem = ({ label, icon, to, active, endAdornment }: NavItemProps) => (
  <ListItem disablePadding sx={{ mb: 0.5 }}>
    <ListItemButton
      component={NavLink as unknown as React.ComponentType<Record<string, unknown>>}
      to={to}
      sx={{
        height: 48,
        px: 1.25,
        borderRadius: 1.75,
        transition: 'background-color .15s ease, color .15s ease',
        ...(active
          ? {
              background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
              '&, & .MuiListItemIcon-root, & .MuiTypography-root': {
                color: '#fff',
              },
            }
          : {
              '&:hover': { backgroundColor: '#F5F7FA' },
            }),
      }}
    >
      <ListItemIcon sx={{ minWidth: 34, color: active ? '#fff' : '#374151' }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 16, fontWeight: 600 }} />
      {endAdornment}
    </ListItemButton>
  </ListItem>
);

// Watchlist header
const WatchlistHeader = () => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, mt: 2.5 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <KeyboardArrowDown fontSize="small" sx={{ color: 'text.secondary' }} />
      <Typography fontSize={14} fontWeight={700}>
        My Watchlist
      </Typography>
    </Stack>
    <IconButton size="small">
      <MoreHoriz fontSize="small" />
    </IconButton>
  </Stack>
);

// Watchlist item
interface WatchItemProps {
  iconBg: string;
  icon: React.ReactNode;
  name: string;
  ticker: string;
  price: string;
  change: string;
}

const WatchItem = ({ iconBg, icon, name, ticker, price, change }: WatchItemProps) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
    <Avatar sx={{ width: 32, height: 32, bgcolor: iconBg }}>{icon}</Avatar>
    <Box sx={{ flexGrow: 1 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
        {name}(
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {ticker}
        </Box>
        )
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>${price}</Typography>
        <Box
          sx={{
            bgcolor: 'rgba(124,58,237,0.12)',
            color: '#7C3AED',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {change}
          </Typography>
        </Box>
      </Stack>
    </Box>
  </Stack>
);

// Profile row
const ProfileRow = () => (
  <Box sx={{ mt: 2.5, mb: 1 }}>
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: '#16A34A' }}>U</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>DCC User</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          @dccuser
        </Typography>
      </Box>
      <KeyboardArrowDown fontSize="small" sx={{ color: 'text.secondary' }} />
    </Stack>
  </Box>
);

// Upgrade Pro card
const UpgradeProCard = () => (
  <Box sx={{ position: 'sticky', bottom: 16, pt: 2 }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: 'linear-gradient(180deg, #424A57 0%, #1F2630 100%)',
        color: '#fff',
        boxShadow: '0 8px 20px rgba(2,6,23,.25), inset 0 1px 0 rgba(255,255,255,.16)',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          background: 'rgba(255,255,255,.08)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '20px',
        }}
      >
        👑
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
          Upgrade Pro!
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Unlock Advanced Features
        </Typography>
      </Box>
      <IconButton size="small" sx={{ color: '#fff' }}>
        <ArrowForward />
      </IconButton>
    </Stack>
  </Box>
);

// Main sidebar component
export const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          width: 300,
          boxSizing: 'border-box',
          p: 2.5,
          borderRight: '1px solid #EEF2F7',
          backgroundColor: '#fff',
          overflow: 'auto',
        },
      }}
    >
      <Logo />

      <SectionLabel>Main Menu</SectionLabel>
      <List dense disablePadding>
        <NavItem
          active={isActive('/desktop/wallet')}
          label="Dashboard"
          icon={<Apps />}
          to="/desktop/wallet"
        />
        <NavItem
          active={isActive('/desktop/portfolio')}
          label="Portfolio"
          icon={<Inventory2Outlined />}
          to="/desktop/wallet/portfolio"
        />
        <NavItem
          active={isActive('/desktop/wallet/transactions')}
          label="Transactions"
          icon={<ReceiptLong />}
          to="/desktop/wallet/transactions"
        />
        <NavItem
          active={isActive('/desktop/wallet/leasing')}
          label="Leasing"
          icon={<Timeline />}
          to="/desktop/wallet/leasing"
        />
        <NavItem
          active={isActive('/desktop/wallet/aliases')}
          label="Aliases"
          icon={<Badge />}
          to="/desktop/wallet/aliases"
        />
      </List>

      <Divider sx={{ my: 2.5, borderColor: '#EEF2F7' }} />

      <SectionLabel>Trading</SectionLabel>
      <List dense disablePadding>
        <NavItem
          active={isActive('/desktop/dex')}
          label="Trading"
          icon={<ShowChart />}
          to="/desktop/dex"
        />
        <NavItem
          active={isActive('/desktop/swap')}
          label="Swap"
          icon={<SwapHoriz />}
          to="/desktop/swap"
        />
        <NavItem
          active={isActive('/desktop/bridge')}
          label="Bridge"
          icon={<AccountBalanceWallet />}
          to="/desktop/bridge"
        />
      </List>

      <Divider sx={{ my: 2.5, borderColor: '#EEF2F7' }} />

      <SectionLabel>Tools</SectionLabel>
      <List dense disablePadding>
        <NavItem
          label="Messages"
          icon={<Mail />}
          to="/desktop/messages"
          endAdornment={<DotBadge value={20} />}
        />
        <NavItem
          active={isActive('/desktop/analytics')}
          label="Analytics"
          icon={<QueryStats />}
          to="/desktop/analytics"
        />
      </List>

      <Divider sx={{ my: 2.5, borderColor: '#EEF2F7' }} />

      <WatchlistHeader />
      <WatchItem
        iconBg="#F7931A"
        icon={<CurrencyBitcoin sx={{ fontSize: 18 }} />}
        name="Bitcoin"
        ticker="BTC"
        price="42,567.10"
        change="+2.19%"
      />
      <WatchItem
        iconBg="#627EEA"
        icon={<Timeline sx={{ fontSize: 18 }} />}
        name="Ethereum"
        ticker="ETH"
        price="2,895.40"
        change="+2.19%"
      />
      <WatchItem
        iconBg="#8A63D2"
        icon={<ShowChart sx={{ fontSize: 18 }} />}
        name="DCC"
        ticker="DCC"
        price="135.22"
        change="+2.19%"
      />

      <SectionLabel>General</SectionLabel>
      <List dense disablePadding>
        <NavItem
          active={isActive('/desktop/settings')}
          label="Settings"
          icon={<SettingsOutlined />}
          to="/desktop/settings"
        />
        <NavItem label="Help Desk" icon={<HelpOutline />} to="/desktop/help" />
      </List>

      <ProfileRow />
      <UpgradeProCard />
    </Drawer>
  );
};
