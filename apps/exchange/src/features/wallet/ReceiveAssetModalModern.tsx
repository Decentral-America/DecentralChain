/**
 * ReceiveAssetModalModern Component
 * Modern MUI-based modal showing user's address and QR code for receiving assets
 */

import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CallReceived as ReceiveIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import type React from 'react';
import { QRCodeSVG } from '@/components/display/QRCode';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';

export interface ReceiveAssetModalModernProps {
  isOpen: boolean;
  onClose: () => void;
  assetName?: string;
}

/**
 * ReceiveAssetModalModern component
 */
export const ReceiveAssetModalModern: React.FC<ReceiveAssetModalModernProps> = ({
  isOpen,
  onClose,
  assetName = 'assets',
}) => {
  const { user } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();

  /**
   * Handle copy address
   */
  const handleCopyAddress = () => {
    if (user?.address) {
      copyToClipboard(user.address);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                alignItems: 'center',
                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                borderRadius: '50%',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
            >
              <ReceiveIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Receive {assetName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} alignItems="center" sx={{ mt: 2 }}>
          {/* Info text */}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Scan the QR code or copy the address below to receive {assetName.toLowerCase()}
          </Typography>

          {/* QR Code */}
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: 3,
              display: 'inline-block',
              p: 3,
            }}
          >
            <QRCodeSVG value={user?.address || ''} size={200} level="H" includeMargin={false} />
          </Box>

          {/* Address */}
          <Card
            sx={{
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              p: 2,
              width: '100%',
            }}
          >
            <Typography
              variant="body2"
              fontFamily="monospace"
              textAlign="center"
              sx={{ wordBreak: 'break-all' }}
            >
              {user?.address || 'No address available'}
            </Typography>
          </Card>

          {/* Copy Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleCopyAddress}
            disabled={!user?.address}
            startIcon={<CopyIcon />}
            sx={{
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #0891B2 100%)',
              },
              background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
            }}
          >
            {isCopied ? '✓ Copied!' : 'Copy Address'}
          </Button>

          {/* Success message */}
          {isCopied && <Alert severity="success">Address copied to clipboard!</Alert>}

          {/* Warning text */}
          <Alert severity="warning" sx={{ width: '100%' }}>
            <Typography variant="body2">
              <strong>Important:</strong> Only send {assetName} to this address. Sending other
              assets may result in permanent loss.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
