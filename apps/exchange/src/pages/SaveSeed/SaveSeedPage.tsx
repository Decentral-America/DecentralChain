/**
 * SaveSeed Page
 * Allows users to view and backup their seed phrase after password authentication
 * Modern Material UI implementation matching Angular saveSeed module functionality
 */

import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Fade,
  keyframes,
  MenuItem,
  Slide,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as ds from 'data-service';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { NetworkConfig } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { SeedBackup } from '@/features/auth/SeedBackup';
import { logger } from '@/lib/logger';

// Animations
const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  animation: `${gradientShift} 15s ease infinite`,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  overflow: 'hidden',
  padding: theme.spacing(3),
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FloatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'size', 'top', 'left'].includes(prop as string),
})<{ delay: number; size: number; top: string; left: string }>(
  ({ theme, delay, size, top, left }) => ({
    animation: `${float} ${6 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    backdropFilter: 'blur(10px)',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(31, 90, 246, 0.1), rgba(90, 129, 255, 0.1))'
        : 'linear-gradient(135deg, rgba(31, 90, 246, 0.05), rgba(90, 129, 255, 0.05))',
    border: `1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(31, 90, 246, 0.1)'
    }`,
    borderRadius: '30%',
    height: size,
    left,
    position: 'absolute',
    top,
    width: size,
    zIndex: 0,
  }),
);

const GlowOrb = styled(Box, {
  shouldForwardProp: (prop) => !['color', 'top', 'left', 'size'].includes(prop as string),
})<{ color: string; top: string; left: string; size: number }>(({ color, top, left, size }) => ({
  animation: `${pulse} 4s ease-in-out infinite`,
  background: `radial-gradient(circle, ${color}40 0%, ${color}00 70%)`,
  borderRadius: '50%',
  filter: 'blur(40px)',
  height: size,
  left,
  position: 'absolute',
  top,
  width: size,
  zIndex: 0,
}));

const ContentWrapper = styled(Container)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background:
    theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(31, 90, 246, 0.2)'
      : '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(31, 90, 246, 0.1)',
  maxWidth: '800px !important',
  padding: theme.spacing(4),
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(3),
  },
}));

const AccountCard = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2.5),
}));

const AccountAvatar = styled(Box)(({ theme: _theme }) => ({
  alignItems: 'center',
  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
  borderRadius: '50%',
  color: '#fff',
  display: 'flex',
  flexShrink: 0,
  fontSize: '1.25rem',
  fontWeight: 700,
  height: 48,
  justifyContent: 'center',
  width: 48,
}));

interface User {
  address: string;
  name?: string;
  publicKey?: string;
  userType?: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  encryptedSeed?: string;
}

export const SaveSeedPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { getActiveState } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // State
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [seed, setSeed] = useState<string>('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedUser = userList.find((u) => u.address === selectedAddress);
  const needPassword =
    !selectedUser?.userType || ['seed', 'privateKey'].includes(selectedUser.userType);

  const loadUserList = useCallback(async () => {
    try {
      // Get users from localStorage
      const usersData = localStorage.getItem('dcc_users');
      if (usersData) {
        const users: User[] = JSON.parse(usersData);
        setUserList(users);
        if (users.length > 0) {
          setSelectedAddress(users[0]?.address ?? '');
        }
      }
    } catch (error) {
      logger.error('Error loading users:', error);
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    // Load user list from storage
    void loadUserList();
  }, [loadUserList]);

  useEffect(() => {
    if (password) {
      setShowPasswordError(false);
      setNetworkError(false);
    }
  }, [password]);

  const handleShowSeed = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setShowPasswordError(false);
    setNetworkError(false);

    try {
      // Import data-service for seed decryption
      // This matches the Angular implementation exactly

      const userSettings = {}; // Get from storage if needed
      const activeUser = {
        ...selectedUser,
        networkByte: NetworkConfig.networkByte, // Computed from mainnet.json code
        password,
        publicKey: selectedUser.publicKey || '',
        settings: userSettings,
        userType: selectedUser.userType || 'seed', // Default to seed
      };

      // Get signature API (same as Angular)
      const api = ds.signature.getDefaultSignatureApi(activeUser);

      // Check if adapter is available
      const isAvailable = await api.isAvailable(true);

      if (!isAvailable) {
        throw new Error('Adapter not available');
      }

      // Verify address matches
      if (needPassword) {
        const address = await api.getAddress();
        if (address !== activeUser.address) {
          throw new Error('Wrong address');
        }
      }

      // Login and get seed
      await ds.app.login({ address: activeUser.address, publicKey: activeUser.publicKey || '' });
      const seedPhrase = await ds.signature.getSignatureApi().getSeed();

      setSeed(seedPhrase);
      setIsRevealed(true);
    } catch (error) {
      logger.error('Error revealing seed:', error);
      setPassword('');
      setShowPasswordError(true);

      // Check if it's a network error
      if (selectedUser?.userType === 'seed') {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setPassword('');
    setIsRevealed(false);
    setSeed('');
    // Logout
    ds.app.logOut();
  };

  const handleComplete = () => {
    const targetRoute = getActiveState('wallet');
    void navigate(targetRoute);
  };

  if (userList.length === 0) {
    return (
      <PageContainer>
        <FloatingShape delay={0} size={200} top="10%" left="5%" />
        <FloatingShape delay={1.5} size={150} top="60%" left="80%" />
        <FloatingShape delay={3} size={180} top="75%" left="10%" />

        <GlowOrb
          color={theme.palette.mode === 'dark' ? '#1f5af6' : '#5a81ff'}
          top="20%"
          left="15%"
          size={300}
        />
        <GlowOrb
          color={theme.palette.mode === 'dark' ? '#5a81ff' : '#1f5af6'}
          top="70%"
          left="75%"
          size={350}
        />

        <Fade in={isVisible} timeout={600}>
          <Slide direction="up" in={isVisible} timeout={800}>
            <ContentWrapper>
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Lock sx={{ color: 'text.secondary', fontSize: 64, mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  No Accounts Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  You don&apos;t have any accounts with seed phrases to backup. Please create or
                  import an account first.
                </Typography>
                <Button variant="primary" onClick={() => navigate('/signup')}>
                  Create Account
                </Button>
              </Box>
            </ContentWrapper>
          </Slide>
        </Fade>
      </PageContainer>
    );
  }

  if (isRevealed && seed) {
    return (
      <PageContainer>
        <FloatingShape delay={0} size={200} top="10%" left="5%" />
        <FloatingShape delay={1.5} size={150} top="60%" left="80%" />

        <GlowOrb
          color={theme.palette.mode === 'dark' ? '#1f5af6' : '#5a81ff'}
          top="20%"
          left="15%"
          size={300}
        />

        <Fade in={true} timeout={600}>
          <Slide direction="up" in={true} timeout={800}>
            <ContentWrapper>
              <SeedBackup seedPhrase={seed} onComplete={handleComplete} />
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button variant="secondary" onClick={handleBackToList}>
                  Back to Account Selection
                </Button>
              </Box>
            </ContentWrapper>
          </Slide>
        </Fade>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FloatingShape delay={0} size={200} top="10%" left="5%" />
      <FloatingShape delay={1.5} size={150} top="60%" left="80%" />
      <FloatingShape delay={3} size={180} top="75%" left="10%" />

      <GlowOrb
        color={theme.palette.mode === 'dark' ? '#1f5af6' : '#5a81ff'}
        top="20%"
        left="15%"
        size={300}
      />
      <GlowOrb
        color={theme.palette.mode === 'dark' ? '#5a81ff' : '#1f5af6'}
        top="70%"
        left="75%"
        size={350}
      />

      <Fade in={isVisible} timeout={600}>
        <Slide direction="up" in={isVisible} timeout={800}>
          <ContentWrapper>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: 1 }}>
                Backup Seed Phrase
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Select an account and enter your password to view and backup your seed phrase.
              </Typography>

              {showPasswordError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <AlertTitle>Authentication Failed</AlertTitle>
                  {networkError
                    ? 'Network error occurred. Please check your connection and try again.'
                    : 'Incorrect password. Please try again.'}
                </Alert>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Select Account
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  disabled={userList.length <= 1}
                >
                  {userList.map((user) => (
                    <MenuItem key={user.address} value={user.address}>
                      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
                        <Box
                          sx={{
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #1f5af6, #5a81ff)',
                            borderRadius: '50%',
                            color: '#fff',
                            display: 'flex',
                            fontWeight: 700,
                            height: 32,
                            justifyContent: 'center',
                            width: 32,
                          }}
                        >
                          {user.name?.[0]?.toUpperCase() || user.address[0]?.toUpperCase()}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name || 'Account'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${user.address.slice(0, 8)}...${user.address.slice(-6)}`}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {selectedUser && (
                <AccountCard>
                  <AccountAvatar>
                    {selectedUser.name?.[0]?.toUpperCase() ||
                      selectedUser.address[0]?.toUpperCase()}
                  </AccountAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedUser.name || 'Account'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`${selectedUser.address.slice(0, 12)}...${selectedUser.address.slice(-8)}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {selectedUser.userType || 'seed'}
                    </Typography>
                  </Box>
                </AccountCard>
              )}

              {needPassword && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && password) {
                        void handleShowSeed();
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <Box
                          sx={{ alignItems: 'center', cursor: 'pointer', display: 'flex' }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Box>
                      ),
                    }}
                  />
                </Box>
              )}

              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Security Warning</AlertTitle>
                Never share your seed phrase with anyone. Anyone with access to your seed phrase can
                access and steal your funds. Make sure you&apos;re in a private location before
                revealing your seed phrase.
              </Alert>

              <Button
                variant="primary"
                fullWidth
                size="large"
                onClick={handleShowSeed}
                disabled={needPassword && !password}
                sx={{ mb: 2 }}
              >
                {loading ? 'Verifying...' : 'Reveal Seed Phrase'}
              </Button>

              <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </Box>
          </ContentWrapper>
        </Slide>
      </Fade>
    </PageContainer>
  );
};
