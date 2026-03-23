import { ContentCopy as CopyIcon, Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { QRCodeSVG as QRCodeSVGBase } from 'qrcode.react';
import { useState } from 'react';

// React 19 type compatibility cast
const QRCodeSVG = QRCodeSVGBase as unknown as React.ComponentType<Record<string, unknown>>;

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SendAssetModalModern } from '@/features/wallet/SendAssetModalModern';
import { useClipboard } from '@/hooks/useClipboard';

/**
 * QRReceive Component
 * Landing page section with Send/Receive tabs
 * Shows QR code for authenticated users, prompts login for guests
 */
export default function QRReceive() {
  const [tab, setTab] = useState(0); // 0 = Send, 1 = Receive
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const { user } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();
  const navigate = useNavigate();

  /**
   * Handle copy address
   */
  const handleCopyAddress = () => {
    if (user?.address) {
      copyToClipboard(user.address);
    }
  };

  /**
   * Handle Send button click
   */
  const handleSendClick = () => {
    if (!user) {
      // Redirect to sign in if not authenticated
      void navigate('/sign-in');
      return;
    }
    // Open send modal for authenticated users
    setSendModalOpen(true);
  };

  /**
   * Handle Receive tab - no action needed, just show QR
   */
  const renderContent = () => {
    // Send Tab (tab === 0)
    if (tab === 0) {
      return (
        <Stack spacing={3} alignItems="center">
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Send DCC or other assets to any address on the network
          </Typography>

          {user ? (
            <>
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSendClick}
                sx={{
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #66407d 100%)',
                  },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                }}
                fullWidth
              >
                Open Send Modal
              </Button>
              <Typography variant="caption" color="text.secondary">
                Logged in as: {user.address.slice(0, 8)}...{user.address.slice(-6)}
              </Typography>
            </>
          ) : (
            <Alert severity="info" sx={{ width: '100%' }}>
              Please{' '}
              <Button size="small" onClick={() => navigate('/sign-in')}>
                Sign In
              </Button>{' '}
              to send assets
            </Alert>
          )}
        </Stack>
      );
    }

    // Receive Tab (tab === 1)
    return (
      <Stack spacing={3} alignItems="center">
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          Scan the QR code or copy your address to receive assets
        </Typography>

        {user ? (
          <>
            {/* QR Code */}
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                display: 'inline-block',
                p: 2,
              }}
            >
              <QRCodeSVG value={user.address || ''} size={160} level="H" includeMargin={false} />
            </Box>

            {/* Address Display */}
            <Card
              variant="outlined"
              sx={{
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                width: '100%',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Your Address
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                      {user.address}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleCopyAddress}
                      color={isCopied ? 'success' : 'default'}
                      sx={{ flexShrink: 0 }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {isCopied && (
                    <Typography variant="caption" color="success.main">
                      Address copied!
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Typography variant="caption" color="text.secondary">
              Network: DecentralExchange Mainnet
            </Typography>
          </>
        ) : (
          <Alert severity="info" sx={{ width: '100%' }}>
            Please{' '}
            <Button size="small" onClick={() => navigate('/sign-in')}>
              Sign In
            </Button>{' '}
            to view your receive address
          </Alert>
        )}
      </Stack>
    );
  };

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 8, xs: 6 } }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, maxWidth: 400, mx: 'auto' }}>
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              centered
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  minWidth: 120,
                },
              }}
            >
              <Tab label="Send" />
              <Tab label="Receive" />
            </Tabs>

            {/* Tab Content */}
            {renderContent()}
          </CardContent>
        </Card>
      </Container>

      {/* Send Asset Modal */}
      {user && (
        <SendAssetModalModern
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          assetId="DCC"
          assetName="DCC"
          assetDecimals={8}
          availableBalance="0"
        />
      )}
    </Box>
  );
}
