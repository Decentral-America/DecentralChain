/**
 * DepositAddress Component
 * Displays gateway deposit address with QR code and copy-to-clipboard functionality
 * Used for showing external blockchain addresses where users send assets to bridge to DecentralChain
 *
 * The QR sits on a white plate that stays white in dark mode so it scans from
 * any screen; the address sits in a grey well with the copy action beside it.
 */

import { Box, Typography } from '@mui/material';
import { ClipboardButton } from '@/components/premium/ClipboardButton';
import { QRCodeCard } from '@/components/premium/QRCodeCard';

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
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mx: 'auto',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 600 }}>
        Send {assetName} to this address
      </Typography>

      {address ? (
        <QRCodeCard
          value={address}
          size={184}
          label={`QR code for the ${assetName} deposit address`}
        />
      ) : null}

      {/* Address with copy action */}
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'action.hover',
          borderRadius: '12px',
          display: 'flex',
          gap: 1,
          maxWidth: 440,
          pl: 1.75,
          pr: 1,
          py: 1,
          width: '100%',
        }}
      >
        <Typography
          component="code"
          sx={{
            color: 'text.primary',
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.5,
            minWidth: 0,
            textAlign: 'left',
            wordBreak: 'break-all',
          }}
        >
          {address}
        </Typography>
        <ClipboardButton
          value={address}
          label="Copy address"
          copiedLabel="Copied"
          {...(onCopy ? { onCopied: onCopy } : {})}
        />
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Scan the QR code or copy the address above
      </Typography>
    </Box>
  );
};
