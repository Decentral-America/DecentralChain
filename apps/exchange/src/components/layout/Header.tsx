/**
 * Application Header
 * Top navigation bar with user info, network status, and quick actions
 */
import { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';

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
        console.error('Failed to copy address:', err);
      }
    }
  };

  const handleViewWallet = () => {
    navigate('/desktop/wallet');
    handleMenuClose();
  };

  const handleManageAliases = () => {
    navigate('/desktop/wallet/aliases');
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
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
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
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: { width: 280, mt: 1 },
                }}
              >
                {/* Address Info */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    Your Address
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
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
