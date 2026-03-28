/**
 * DepositAddress Component
 * Displays gateway deposit address with QR code and copy-to-clipboard functionality
 * Used for showing external blockchain addresses where users send assets to bridge to DecentralChain
 */

import { CheckCircle, ContentCopy } from '@mui/icons-material';
import { Alert, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from '@/components/display/QRCode';
import { logger } from '@/lib/logger';

interface DepositAddressProps {
  /** External blockchain address (e.g., BTC address) */
  address: string;
  /** Name of the asset being deposited */
  assetName: string;
  /** Optional callback when address is copied */
  onCopy?: () => void;
}

/**
 * DepositAddress component for displaying gateway deposit addresses
 * Features QR code generation, copy-to-clipboard, and responsive design
 */
export const DepositAddress: React.FC<DepositAddressProps> = ({ address, assetName, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Reset copied state when address changes
  useEffect(() => {
    setCopied(false);
    setQrError(false);
  }, []);

  /**
   * Handle copy address to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      onCopy?.();

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy address:', error);
    }
  };

  /**
   * Handle QR code generation errors
   */
  const handleQrError = () => {
    setQrError(true);
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        p: { sm: 3, xs: 2 },
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Send {assetName} to this address
      </Typography>

      {/* QR Code */}
      {!qrError && address && (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            display: 'inline-block',
            mb: 2,
            p: 2,
          }}
        >
          <QRCodeCanvas
            value={address}
            size={256}
            level="M"
            includeMargin={false}
            style={{
              height: 'auto',
              maxWidth: '100%',
            }}
            onError={handleQrError}
          />
        </Box>
      )}

      {/* QR Code Error */}
      {qrError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          QR code generation failed. You can still copy the address below.
        </Alert>
      )}

      {/* Address Display with Copy Button */}
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'background.default',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
          p: 1.5,
        }}
      >
        <Typography
          component="code"
          sx={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: { sm: '0.85rem', xs: '0.75rem' },
            minWidth: 0,
            textAlign: 'left',
            wordBreak: 'break-all',
          }}
        >
          {address}
        </Typography>

        <Tooltip title={copied ? 'Copied!' : 'Copy address'} arrow>
          <IconButton
            onClick={handleCopy}
            size="small"
            color={copied ? 'success' : 'primary'}
            sx={{ flexShrink: 0 }}
          >
            {copied ? <CheckCircle /> : <ContentCopy />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Additional Information */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Scan the QR code or copy the address above
      </Typography>
    </Box>
  );
};
