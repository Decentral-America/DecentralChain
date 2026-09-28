/**
 * Main Layout
 * Modern container for authenticated routes with responsive navigation
 */

import {
  AccountBalanceWallet,
  AccountCircle,
  AddCircleOutlined,
  Badge,
  ContentCopy,
  Logout,
  NotificationsNoneOutlined,
  Settings,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
} from '@mui/material';
import { Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { TransactionNotificationsMonitor } from '@/components/notifications/TransactionNotificationsMonitor';
import { RouteLoadingFallback } from '@/components/RouteLoadingFallback';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { usePageTracking } from '@/hooks/useAnalytics';
import { useRoutePerformance } from '@/hooks/usePerformanceMonitoring';
import { useRouteStateTracking } from '@/hooks/useRouteStateTracking';
import { AppLauncher } from '@/layouts/shell/AppLauncher';
import { AppTopBar, NetworkTag, RoundAction } from '@/layouts/shell/AppTopBar';
import { logger } from '@/lib/logger';

/**
 * Application chrome height. The main content offsets by exactly this much, so
 * the two values must stay in sync — a mismatch either hides content behind the
 * bar or leaves a gap under it.
 */
export const MainLayout = () => {
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
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
    void logout();
    handleUserMenuClose();
  };

  return (
    <Box
      sx={{
        // The Apple-neutral ground every card sits on.
        bgcolor: 'background.default',
        boxSizing: 'border-box',
        /*
         * The ground is the viewport, exactly: the application never scrolls
         * as a document. Only the content column scrolls — the frame of a
         * desktop app, not a page.
         */
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* Listens for incoming transactions */}
      <TransactionNotificationsMonitor />

      {/*
        The shell: the chrome and the routed content on the ground itself, so
        the top bar spans the whole application. There is no separate rounded
        surface — and so no hairline around one to keep in step with the mode;
        cards carry their own surfaces on the ground.
      */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          // Fills the fixed ground; the column below it does the scrolling.
          height: '100%',
          // The top bar floats over the column so content scrolls beneath it.
          position: 'relative',
        }}
      >
        <AppTopBar
          onOpenLauncher={() => setLauncherOpen(true)}
          actions={
            <>
              <NetworkTag network={config.network} />

              <RoundAction label="Messages" onClick={() => navigate('/desktop/messages')}>
                <NotificationsNoneOutlined />
              </RoundAction>

              <RoundAction label="Settings" onClick={() => navigate('/desktop/settings')}>
                <Settings />
              </RoundAction>

              {user ? (
                <RoundAction filled label="Account" onClick={handleUserMenuOpen}>
                  <AccountCircle />
                </RoundAction>
              ) : null}
            </>
          }
        />

        {/*
          The content column is the one scroller. The top bar floats over it
          and the column pads its top by the bar's height, so content slides
          under the bar's translucent material while a page that fits the
          shell (`fit`) still resolves 100% to the space below the bar.
        */}
        <Box
          component="main"
          sx={{
            /*
             * The one scroll container in the application. `minHeight: 0` is
             * what lets a flex child shrink below its content and actually
             * scroll — without it the column grows and the scrollbar never
             * appears.
             */
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            /*
             * The same gutter the top bar uses, so a page title lands directly
             * under the wordmark. Vertical padding belongs to PageFrame: a page
             * that fits the shell exactly cannot do so if the column it sits in
             * adds height underneath it.
             */
            pt: '72px',
            px: { lg: 4, xs: 2 },
          }}
        >
          {/* Only the content column suspends; the shell stays put. */}
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>

      {user ? (
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          slotProps={{ paper: { sx: { maxWidth: 320, mt: 1, width: 280 } } }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Your Address
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
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
              <AddCircleOutlined fontSize="small" />
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
      ) : null}

      <AppLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        pathname={location.pathname}
      />

      <CreateAliasModal
        open={createAliasOpen}
        onClose={() => setCreateAliasOpen(false)}
        onSuccess={(newAlias) => {
          setAliasSuccess(true);
          logger.debug(`[MainLayout] Alias created successfully: ${newAlias}`);
        }}
      />

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
