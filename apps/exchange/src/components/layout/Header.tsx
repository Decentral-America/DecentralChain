/**
 * Application Header
 * Top navigation bar with user info, network status, and quick actions
 */

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import BadgeIcon from '@mui/icons-material/Badge';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { logger } from '@/lib/logger';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  height: 64px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserButton = styled(Box)`
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

export const Header = () => {
  const { user, logout } = useAuth();
  const config = useConfig();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createAliasOpen, setCreateAliasOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyAddress = async () => {
    if (user?.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        handleMenuClose();
      } catch (err) {
        logger.error('Failed to copy address:', err);
      }
    }
  };

  const handleViewWallet = () => {
    void navigate('/desktop/wallet');
    handleMenuClose();
  };

  const handleManageAliases = () => {
    void navigate('/desktop/wallet/aliases');
    handleMenuClose();
  };

  const handleCreateAlias = () => {
    setCreateAliasOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <HeaderContainer>
        <HeaderLeft>
          <h3>DecentralChain</h3>
          <Chip
            label={config.network}
            size="small"
            color={config.network === 'mainnet' ? 'success' : 'warning'}
          />
        </HeaderLeft>
        <HeaderRight>
          {user && (
            <>
              <UserButton onClick={handleMenuOpen}>
                <Avatar sx={{ bgcolor: 'primary.main', height: 32, width: 32 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Stack spacing={0}>
                  <Typography variant="body2" fontWeight={600}>
                    {user.name || 'Account'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {formatAddress(user.address || '')}
                  </Typography>
                </Stack>
              </UserButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  horizontal: 'right',
                  vertical: 'bottom',
                }}
                transformOrigin={{
                  horizontal: 'right',
                  vertical: 'top',
                }}
                PaperProps={{
                  sx: { mt: 1, width: 280 },
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
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Copy Address</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleViewWallet}>
                  <ListItemIcon>
                    <AccountBalanceWalletIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>My Wallet</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleCreateAlias}>
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Create Alias</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleManageAliases}>
                  <ListItemIcon>
                    <BadgeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Manage Aliases</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </HeaderRight>
      </HeaderContainer>

      {/* Create Alias Modal */}
      <CreateAliasModal open={createAliasOpen} onClose={() => setCreateAliasOpen(false)} />
    </>
  );
};
