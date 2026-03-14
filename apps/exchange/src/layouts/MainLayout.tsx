/**
 * Main Layout
 * Modern container for authenticated routes with responsive navigation
 */
import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  styled,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  AccountCircle,
  Apps,
  Inventory2Outlined,
  ReceiptLong,
  Timeline,
  ShowChart,
  QueryStats,
  AddCircleOutline,
  SwapHoriz,
  AccountBalanceWallet,
  Badge,
  ContentCopy,
  Logout,
} from '@mui/icons-material';
import { usePageTracking } from '@/hooks/useAnalytics';
import { TransactionNotificationsMonitor } from '@/components/notifications/TransactionNotificationsMonitor';
import { useRoutePerformance } from '@/hooks/usePerformanceMonitoring';
import { useRouteStateTracking } from '@/hooks/useRouteStateTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';

const DRAWER_WIDTH = 260;

// Styled AppBar - clean white design
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.paper,
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

// Styled Drawer - white sidebar with padding
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    background: theme.palette.background.paper,
    borderRight: 'none',
    boxShadow: 'none',
    paddingLeft: 0,
    paddingTop: 0,
  },
}));

// Logo container
const LogoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 0, 5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

// Styled NavLink with active state
const StyledNavLink = styled(NavLink)(() => ({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  width: '100%',
}));

// Main content area
const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3, 1),
  marginTop: '64px', // Height of AppBar
  minHeight: '100vh',
  background: '#F9FAFB',
  overflowY: 'auto',
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
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
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
    label: 'Main Menu',
    items: [
      { path: '/desktop/wallet', label: 'Dashboard', icon: <Apps /> },
      { path: '/desktop/wallet/portfolio', label: 'Portfolio', icon: <Inventory2Outlined /> },
      { path: '/desktop/wallet/transactions', label: 'Transactions', icon: <ReceiptLong /> },
      { path: '/desktop/wallet/leasing', label: 'Leasing', icon: <Timeline /> },
      { path: '/desktop/wallet/aliases', label: 'Aliases', icon: <Badge /> },
    ],
  },
  {
    label: 'Trading',
    items: [
      { path: '/desktop/dex', label: 'Trading', icon: <ShowChart /> },
      { path: '/desktop/swap', label: 'Swap', icon: <SwapHoriz /> },
      { path: '/desktop/bridge', label: 'Bridge', icon: <AccountBalanceWallet /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/desktop/create-token', label: 'Create Token', icon: <AddCircleOutline /> },
      { path: '/desktop/analytics', label: 'Analytics', icon: <QueryStats /> },
    ],
  },
  {
    label: 'General',
    items: [{ path: '/desktop/settings', label: 'Settings', icon: <Settings /> }],
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
        console.error('Failed to copy address:', err);
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
          console.error('Fallback copy failed:', fallbackErr);
        }
      }
    }
  };

  const handleCreateAlias = () => {
    setCreateAliasOpen(true);
    handleUserMenuClose();
  };

  const handleManageAliases = () => {
    navigate('/desktop/wallet/aliases');
    handleUserMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const drawer = (
    <Box sx={{ px: 3, pt: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <LogoBox>
        <Box
          component="img"
          src="/assets/decentralexchange.svg"
          alt="Decentral Exchange"
          sx={{
            height: 28,
            width: 'auto',
            maxWidth: '100%',
          }}
        />
      </LogoBox>

      {/* User Profile Section */}
      <Box
        sx={{
          mx: 2,
          mb: 4,
          p: 1.5,
          borderRadius: '10px',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
          }}
        >
          {user?.address ? user.address.substring(0, 2).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
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
      <Box sx={{ px: 1, pt: 2 }}>
        {navSections.map((section, sectionIdx) => (
          <Box key={section.label} sx={{ mb: sectionIdx < navSections.length - 1 ? 2.5 : 0 }}>
            {/* Section Label */}
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 1,
                display: 'block',
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
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
                          borderRadius: '10px',
                          transition: 'all 0.2s ease',
                          mb: 1.5,
                          '&.Mui-selected': {
                            background: 'linear-gradient(135deg, #5940d4 0%, #7c5dfa 100%)',
                            color: 'white',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4a35c0 0%, #6b4ce8 100%)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                            '& .MuiListItemText-primary': {
                              color: 'white',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(89, 64, 212, 0.08)',
                          },
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
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.9rem',
                            color: isActive ? 'white' : 'inherit',
                          }}
                        />
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: 'error.main',
                              color: 'white',
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
              sx={{ mr: 2, color: 'text.primary' }}
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
                height: 24,
                width: 'auto',
                flexGrow: 1,
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
              mr: 2,
              height: 28,
            }}
          />

          {/* User Info */}
          {user && (
            <>
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: '#ECFDF5',
                  },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <AccountCircle />
                </Avatar>
                <Stack spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
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
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: { width: { xs: 'calc(100vw - 32px)', sm: 280 }, maxWidth: 320, mt: 1 },
                }}
              >
                {/* Address Info */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
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

                <MenuItem onClick={() => { navigate('/desktop/wallet'); handleUserMenuClose(); }}>
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
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                background: theme.palette.background.paper,
                paddingLeft: 0,
                paddingTop: 0,
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
          console.log(`[MainLayout] Alias created successfully: ${newAlias}`);
        }}
      />

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setAliasSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Alias created successfully! It will appear in your alias list momentarily.
        </Alert>
      </Snackbar>
    </Box>
  );
};
