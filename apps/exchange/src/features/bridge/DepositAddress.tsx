/**
 * DepositAddress Component
 * Displays gateway deposit address with QR code and copy-to-clipboard functionality
 * Used for showing external blockchain addresses where users send assets to bridge to DecentralChain
 */

import { CheckCircle, ContentCopy } from '@mui/icons-material';
import { Alert, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { QRCodeCanvas as QRCodeCanvasBase } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

// React 19 type compatibility cast
const QRCodeCanvas = QRCodeCanvasBase as unknown as React.ComponentType<Record<string, unknown>>;

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
        textAlign: 'center',
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Send {assetName} to this address
      </Typography>

      {/* QR Code */}
      {!qrError && address && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            display: 'inline-block',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <QRCodeCanvas
            value={address}
            size={256}
            level="M"
            includeMargin={false}
            style={{
              maxWidth: '100%',
              height: 'auto',
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
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 1.5,
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          flexWrap: 'wrap',
        }}
      >
        <Typography
          component="code"
          sx={{
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            wordBreak: 'break-all',
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
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
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Scan the QR code or copy the address above
      </Typography>
    </Box>
  );
};
