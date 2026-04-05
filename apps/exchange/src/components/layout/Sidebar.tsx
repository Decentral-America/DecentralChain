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
      maxWidth: '100%',
      ml: 1,
      width: 'auto',
    }}
  />
);

// Section label component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    sx={{
      color: '#98A2B3',
      display: 'block',
      fontWeight: 700,
      letterSpacing: 0.3,
      mb: 1.25,
      mt: 3,
      textTransform: 'none',
    }}
  >
    {children}
  </Typography>
);

// Dot badge for notifications
const DotBadge = ({ value }: { value: number }) => (
  <Box
    sx={{
      alignItems: 'center',
      backgroundColor: '#16A34A',
      borderRadius: '50%',
      color: '#fff',
      display: 'inline-flex',
      fontSize: 12,
      fontWeight: 700,
      height: 24,
      justifyContent: 'center',
      ml: 1,
      width: 24,
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
        borderRadius: 1.75,
        height: 48,
        px: 1.25,
        transition: 'background-color .15s ease, color .15s ease',
        ...(active
          ? {
              '&, & .MuiListItemIcon-root, & .MuiTypography-root': {
                color: '#fff',
              },
              background: 'linear-gradient(180deg, #5940d4 0%, #3d26be 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }
          : {
              '&:hover': { backgroundColor: '#F5F7FA' },
            }),
      }}
    >
      <ListItemIcon sx={{ color: active ? '#fff' : '#374151', minWidth: 34 }}>{icon}</ListItemIcon>
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
    <Avatar sx={{ bgcolor: iconBg, height: 32, width: 32 }}>{icon}</Avatar>
    <Box sx={{ flexGrow: 1 }}>
      <Typography sx={{ color: 'text.primary', fontSize: 15, fontWeight: 600 }}>
        {name}(
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {ticker}
        </Box>
        )
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>${price}</Typography>
        <Box
          sx={{
            bgcolor: 'rgba(124,58,237,0.12)',
            borderRadius: 1,
            color: '#7C3AED',
            px: 0.75,
            py: 0.25,
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
  <Box sx={{ mb: 1, mt: 2.5 }}>
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Avatar sx={{ bgcolor: '#16A34A', height: 36, width: 36 }}>U</Avatar>
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
  <Box sx={{ bottom: 16, position: 'sticky', pt: 2 }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        background: 'linear-gradient(180deg, #424A57 0%, #1F2630 100%)',
        borderRadius: 2,
        boxShadow: '0 8px 20px rgba(2,6,23,.25), inset 0 1px 0 rgba(255,255,255,.16)',
        color: '#fff',
        p: 1.5,
      }}
    >
      <Box
        sx={{
          background: 'rgba(255,255,255,.08)',
          borderRadius: 2,
          display: 'grid',
          fontSize: '20px',
          height: 40,
          placeItems: 'center',
          width: 40,
        }}
      >
        👑
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
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
          backgroundColor: '#fff',
          borderRight: '1px solid #EEF2F7',
          boxSizing: 'border-box',
          overflow: 'auto',
          p: 2.5,
          width: 300,
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

      <Divider sx={{ borderColor: '#EEF2F7', my: 2.5 }} />

      <SectionLabel>Trading</SectionLabel>
      <List dense disablePadding>
        <NavItem
          active={isActive('/desktop/dex')}
          label="Trading"
          icon={<ShowChart />}
          to="/desktop/dex"
        />
        <NavItem
          active={isActive('/desktop/bridge')}
          label="Bridge"
          icon={<AccountBalanceWallet />}
          to="/desktop/bridge"
        />
      </List>

      <Divider sx={{ borderColor: '#EEF2F7', my: 2.5 }} />

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

      <Divider sx={{ borderColor: '#EEF2F7', my: 2.5 }} />

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
