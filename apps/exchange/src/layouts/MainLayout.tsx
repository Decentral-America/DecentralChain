/**
 * Main Layout
 * Modern container for authenticated routes with responsive navigation
 */

import {
  AccountBalanceWallet,
  AccountCircle,
  AddCircleOutline,
  Apps,
  Badge,
  ContentCopy,
  Inventory2Outlined,
  Logout,
  Menu as MenuIcon,
  QueryStats,
  ReceiptLong,
  Settings,
  ShowChart,
  Timeline,
} from '@mui/icons-material';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  styled,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { TransactionNotificationsMonitor } from '@/components/notifications/TransactionNotificationsMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { usePageTracking } from '@/hooks/useAnalytics';
import { useRoutePerformance } from '@/hooks/usePerformanceMonitoring';
import { useRouteStateTracking } from '@/hooks/useRouteStateTracking';
import { logger } from '@/lib/logger';

const DRAWER_WIDTH = 260;

// Styled AppBar - clean white design
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
}));

// Styled Drawer - white sidebar with padding
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    background: theme.palette.background.paper,
    borderRight: 'none',
    boxShadow: 'none',
    boxSizing: 'border-box',
    paddingLeft: 0,
    paddingTop: 0,
    width: DRAWER_WIDTH,
  },
  flexShrink: 0,
  width: DRAWER_WIDTH,
}));

// Logo container
const LogoBox = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(0, 0, 5),
}));

// Styled NavLink with active state
const StyledNavLink = styled(NavLink)(() => ({
  color: 'inherit',
  display: 'block',
  textDecoration: 'none',
  width: '100%',
}));

// Main content area
const MainContent = styled(Box)<{ component?: React.ElementType }>(({ theme }) => ({
  background: '#F9FAFB',
  flexGrow: 1,
  marginTop: '64px', // Height of AppBar
  minHeight: '100vh',
  overflowY: 'auto',
  padding: theme.spacing(3, 1),
  [theme.breakpoints.down('sm')]: {
    marginTop: '56px', // Smaller toolbar on mobile
    padding: theme.spacing(1.5, 0.5),
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2, 1),
  },
  // Custom scrollbar
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
  },
}));

// Navigation item type
type NavItem = {
  path: string;
  label: string;
  icon: React.ReactElement;
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

// Navigation items grouped by section
const navSections: NavSection[] = [
  {
    items: [
      { icon: <Apps />, label: 'Dashboard', path: '/desktop/wallet' },
      { icon: <Inventory2Outlined />, label: 'Portfolio', path: '/desktop/wallet/portfolio' },
      { icon: <ReceiptLong />, label: 'Transactions', path: '/desktop/wallet/transactions' },
      { icon: <Timeline />, label: 'Leasing', path: '/desktop/wallet/leasing' },
      { icon: <Badge />, label: 'Aliases', path: '/desktop/wallet/aliases' },
    ],
    label: 'Main Menu',
  },
  {
    items: [
      { icon: <ShowChart />, label: 'Trading', path: '/desktop/dex' },
      { icon: <AccountBalanceWallet />, label: 'Bridge', path: '/desktop/bridge' },
    ],
    label: 'Trading',
  },
  {
    items: [
      { icon: <AddCircleOutline />, label: 'Create Token', path: '/desktop/create-token' },
      { icon: <QueryStats />, label: 'Analytics', path: '/desktop/analytics' },
    ],
    label: 'Tools',
  },
  {
    items: [{ icon: <Settings />, label: 'Settings', path: '/desktop/settings' }],
    label: 'General',
  },
];

export const MainLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [createAliasOpen, setCreateAliasOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [aliasSuccess, setAliasSuccess] = useState(false);

  const { user, logout } = useAuth();
  const config = useConfig();

  // Track page views and route performance
  usePageTracking();
  useRoutePerformance();

  // Track route changes for restoration on next login
  // Matches Angular: User.applyState() lines 601-604
  useRouteStateTracking({ enabled: !!user });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleCopyAddress = async () => {
    if (user?.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        setCopySuccess(true);
        handleUserMenuClose();
      } catch (err) {
        logger.error('Failed to copy address:', err);
        // Fallback for older browsers
        try {
          const textArea = document.createElement('textarea');
          textArea.value = user.address;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopySuccess(true);
          handleUserMenuClose();
        } catch (fallbackErr) {
          logger.error('Fallback copy failed:', fallbackErr);
        }
      }
    }
  };

  const handleCreateAlias = () => {
    setCreateAliasOpen(true);
    handleUserMenuClose();
  };

  const handleManageAliases = () => {
    void navigate('/desktop/wallet/aliases');
    handleUserMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 4, px: 3 }}>
      {/* Logo */}
      <LogoBox>
        <Box
          component="img"
          src="/assets/decentralexchange.svg"
          alt="Decentral Exchange"
          sx={{
            height: 28,
            maxWidth: '100%',
            width: 'auto',
          }}
        />
      </LogoBox>

      {/* User Profile Section */}
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: '10px',
          display: 'flex',
          gap: 1.5,
          mb: 4,
          mx: 2,
          p: 1.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            height: 40,
            width: 40,
          }}
        >
          {user?.address ? user.address.substring(0, 2).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.address ? `${user.address.substring(0, 8)}...` : 'User'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            Business Account
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ pt: 2, px: 1 }}>
        {navSections.map((section, sectionIdx) => (
          <Box key={section.label} sx={{ mb: sectionIdx < navSections.length - 1 ? 2.5 : 0 }}>
            {/* Section Label */}
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                px: 1.5,
                py: 1,
                textTransform: 'uppercase',
              }}
            >
              {section.label}
            </Typography>

            {/* Section Items */}
            <List disablePadding>
              {section.items.map((item) => {
                // Special handling for Dashboard to only match exact path
                const isActive =
                  item.path === '/desktop/wallet'
                    ? location.pathname === '/desktop/wallet' ||
                      location.pathname === '/desktop/wallet/'
                    : location.pathname.startsWith(item.path);
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                    <StyledNavLink
                      to={item.path}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                    >
                      <ListItemButton
                        selected={isActive}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(89, 64, 212, 0.08)',
                          },
                          '&.Mui-selected': {
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                            '& .MuiListItemText-primary': {
                              color: 'white',
                            },
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4a35c0 0%, #6b4ce8 100%)',
                            },
                            background: 'linear-gradient(135deg, #5940d4 0%, #7c5dfa 100%)',
                            color: 'white',
                          },
                          borderRadius: '10px',
                          mb: 1.5,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive ? 'white' : 'text.secondary',
                            minWidth: 40,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            color: isActive ? 'white' : 'inherit',
                            fontSize: '0.9rem',
                            fontWeight: isActive ? 600 : 500,
                          }}
                        />
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              bgcolor: 'error.main',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 20,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </StyledNavLink>
                  </ListItem>
                );
              })}
            </List>

            {/* Divider between sections (except last) */}
            {sectionIdx < navSections.length - 1 && <Divider sx={{ my: 1.5, opacity: 0.1 }} />}
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Transaction Notifications Monitor - listens for incoming transactions */}
      <TransactionNotificationsMonitor />

      {/* AppBar */}
      <StyledAppBar position="fixed" elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          {/* Mobile menu icon */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: 'text.primary', mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Title (mobile only) */}
          {isMobile && (
            <Box
              component="img"
              src="/assets/decentralexchange.svg"
              alt="Decentral Exchange"
              sx={{
                flexGrow: 1,
                height: 24,
                width: 'auto',
              }}
            />
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Network Badge */}
          <Chip
            label={config.network}
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              height: 28,
              mr: 2,
            }}
          />

          {/* User Info */}
          {user && (
            <>
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  '&:hover': {
                    backgroundColor: '#ECFDF5',
                  },
                  alignItems: 'center',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 1,
                  padding: '6px 12px',
                  transition: 'background-color 0.2s',
                }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', height: 32, width: 32 }}>
                  <AccountCircle />
                </Avatar>
                <Stack spacing={0} sx={{ display: { sm: 'flex', xs: 'none' } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                    }}
                  >
                    {user.name || 'Account'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {user.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : ''}
                  </Typography>
                </Stack>
              </Box>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  horizontal: 'right',
                  vertical: 'bottom',
                }}
                transformOrigin={{
                  horizontal: 'right',
                  vertical: 'top',
                }}
                PaperProps={{
                  sx: { maxWidth: 320, mt: 1, width: { sm: 280, xs: 'calc(100vw - 32px)' } },
                }}
              >
                {/* Address Info */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Your Address
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    sx={{ wordBreak: 'break-all' }}
                  >
                    {user.address}
                  </Typography>
                </Box>

                <MenuItem onClick={handleCopyAddress}>
                  <ListItemIcon>
                    <ContentCopy fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Copy Address</ListItemText>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    void navigate('/desktop/wallet');
                    handleUserMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <AccountBalanceWallet fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>My Wallet</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleCreateAlias}>
                  <ListItemIcon>
                    <AddCircleOutline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Create Alias</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleManageAliases}>
                  <ListItemIcon>
                    <Badge fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Manage Aliases</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </StyledAppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ flexShrink: { md: 0 }, width: { md: DRAWER_WIDTH } }}>
        {/* Mobile drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                background: theme.palette.background.paper,
                boxSizing: 'border-box',
                paddingLeft: 0,
                paddingTop: 0,
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <StyledDrawer variant="permanent" open>
            {drawer}
          </StyledDrawer>
        )}
      </Box>

      {/* Main Content */}
      <MainContent component="main">
        <Outlet />
      </MainContent>

      {/* Create Alias Modal */}
      <CreateAliasModal
        open={createAliasOpen}
        onClose={() => setCreateAliasOpen(false)}
        onSuccess={(newAlias) => {
          // Show success feedback
          setAliasSuccess(true);
          logger.debug(`[MainLayout] Alias created successfully: ${newAlias}`);
        }}
      />

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
          Address copied to clipboard!
        </Alert>
      </Snackbar>

      {/* Alias Success Snackbar */}
      <Snackbar
        open={aliasSuccess}
        autoHideDuration={5000}
        onClose={() => setAliasSuccess(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <Alert onClose={() => setAliasSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Alias created successfully! It will appear in your alias list momentarily.
        </Alert>
      </Snackbar>
    </Box>
  );
};
