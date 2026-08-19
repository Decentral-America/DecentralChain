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
import { darken, useTheme } from '@mui/material/styles';
import type React from 'react';
import { QRCodeSVG } from '@/components/display/QRCode';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { palette } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

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
  const t = tokens(useTheme().palette.mode);

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
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 1,
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                background: tokens('light').intent.success,
                borderRadius: '50%',
                display: 'flex',
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
            >
              {/*
                Fixed badge — now a solid `tokens('light').intent.success`
                fill (same role `SendAssetModalModern`'s success-view badge
                uses) instead of the old cyan-to-emerald two-stop gradient,
                so no raw hex remains here. The fill is a solid intent
                colour, not the fixed-white/near-black badges elsewhere in
                this file, so its ink is `intent.onSuccess` (5.34:1) — the
                token built for exactly this fill — not `text.primary`
                (3.42:1), which was the semantic error task-8's Fix round 1
                caught here.
              */}
              <ReceiveIcon sx={{ color: tokens('light').intent.onSuccess, fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Receive {assetName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack
          spacing={3}
          sx={{
            alignItems: 'center',
            mt: 2,
          }}
        >
          {/* Info text */}
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            Scan the QR code or copy the address below to receive {assetName.toLowerCase()}
          </Typography>

          {/* QR Code */}
          <Box
            sx={{
              // Fixed white regardless of mode — a QR code needs a light
              // ground behind its dark modules to stay scannable; a
              // dark-mode surface here would put dark modules on a dark
              // background. Same reasoning as `QRCode.tsx`'s own defaults.
              bgcolor: palette.pureWhite,
              borderRadius: 3,
              boxShadow: 3,
              display: 'inline-block',
              p: 3,
            }}
          >
            <QRCodeSVG value={user?.address || ''} size={200} level="H" includeMargin={false} />
          </Box>

          {/* Address */}
          {/*
            A well, so `surface.sunken` — and it has to be a *mode-aware*
            well. This was `bgcolor: 'grey.50'` / `borderColor: 'grey.200'`,
            which reads like a theme token but is not one: MUI's grey ramp
            carries no mode dimension (`grey.50` is `#fafafa` in both), so it
            behaved as a fixed light fill. The address `Typography` inside
            declares no `color`, inheriting the paper's mode-aware
            `text.primary` — 17.48:1 in light, 1.04:1 in dark. The user's own
            address, invisible. A mode-invariant token under mode-aware ink is
            the same defect as a hex literal.
          */}
          <Card
            sx={{
              bgcolor: t.surface.sunken,
              border: '1px solid',
              borderColor: t.border.subtle,
              p: 2,
              width: '100%',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                textAlign: 'center',
                wordBreak: 'break-all',
              }}
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
                background: darken(tokens('light').intent.success, 0.15),
              },
              background: tokens('light').intent.success,
              // Fixed background needs fixed ink: `variant="contained"`
              // otherwise takes MUI's mode-aware `primary.contrastText`,
              // which on this fixed fill measures 5.34:1 in light mode but
              // only 3.42:1 in dark (computed, not observed) — a regression
              // this task's own flattening would have introduced. `onSuccess`
              // is the token built for exactly this fill.
              color: tokens('light').intent.onSuccess,
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
