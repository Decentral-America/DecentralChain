/**
 * ReceiveAssetModalModern Component
 *
 * The address as a QR on a white plate, the address itself in full, and one
 * copy button. The warning about sending other assets stays, as a calm tinted
 * note rather than a banner.
 */

import {
  Alert,
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
import { useTheme } from '@mui/material/styles';
import { Check, Copy, X } from 'lucide-react';
import type React from 'react';
import { QRCodeCard } from '@/components/premium/QRCodeCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
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
  // `useClipboard` rather than a bare `navigator.clipboard` call: it falls back
  // to a selection copy where the async clipboard API is unavailable.
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        Receive {assetName}
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ alignItems: 'center', pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Scan the code or copy the address below to receive {assetName.toLowerCase()}.
          </Typography>

          {user?.address ? (
            <QRCodeCard
              value={user.address}
              size={184}
              level="H"
              label="QR code for your address"
            />
          ) : null}

          {/*
            A well, so `surface.sunken` — and it has to be a *mode-aware*
            well. MUI's grey ramp carries no mode dimension (`grey.50` is
            `#fafafa` in both), so it behaved as a fixed light fill under the
            paper's mode-aware ink: the user's own address, invisible in dark
            mode. A mode-invariant token under mode-aware ink is the same
            defect as a hex literal.
          */}
          <Card
            sx={{
              bgcolor: t.surface.sunken,
              border: '1px solid',
              borderColor: t.border.subtle,
              borderRadius: '12px',
              boxShadow: 'none',
              px: 2,
              py: 1.5,
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              component="code"
              sx={{
                color: 'text.primary',
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: 'break-all',
              }}
            >
              {user?.address || 'No address available'}
            </Typography>
          </Card>

          <Button
            variant="contained"
            fullWidth
            onClick={handleCopyAddress}
            disabled={!user?.address}
            startIcon={isCopied ? <Check size={18} /> : <Copy size={18} />}
          >
            {isCopied ? 'Address copied' : 'Copy address'}
          </Button>

          <Alert severity="warning" sx={{ width: '100%' }}>
            Only send {assetName} to this address. Sending other assets may result in permanent
            loss.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
