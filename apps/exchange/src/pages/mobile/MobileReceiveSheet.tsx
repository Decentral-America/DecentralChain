import { Alert, Box, Typography } from '@mui/material';
import { QRCodeSVG as QRCodeSVGBase } from 'qrcode.react';
import type React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { MobileButton } from '@/components/mobile/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { mobileRadius, mobileSurface, mobileText } from '@/styles/mobileTokens';

// React 19 type compatibility cast, matching the existing QR usage in the app.
const QRCodeSVG = QRCodeSVGBase as unknown as React.ComponentType<Record<string, unknown>>;

/**
 * Receive sheet.
 *
 * Shows the connected wallet's real address as a scannable code plus a copy
 * action. Presented as a bottom sheet so the user keeps their place on the
 * screen behind it.
 */
export function MobileReceiveSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { copyToClipboard, isCopied } = useClipboard();

  const address = user?.address ?? '';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Receive"
      description="Share this address to receive DCC and any issued asset on DecentralChain."
    >
      {address ? (
        <>
          {/* Codes scan most reliably dark on light, so the plate stays white in dark mode. */}
          <Box
            sx={{
              bgcolor: 'var(--color-pure-white)',
              borderRadius: mobileRadius.card,
              boxShadow: '0 0 0 1px var(--border-default)',
              mb: 2.5,
              mt: 1,
              mx: 'auto',
              p: 2,
              width: 'fit-content',
            }}
          >
            <QRCodeSVG value={address} size={196} level="H" includeMargin={false} />
          </Box>

          <Typography sx={{ color: mobileText.secondary, fontSize: 13, mb: 0.75, ml: 0.5 }}>
            Your address
          </Typography>
          <Box
            sx={{
              bgcolor: mobileSurface.chip,
              borderRadius: mobileRadius.md,
              /*
               * The sheet above already pins its ink, so this repeats it —
               * deliberately. This well holds the user's own wallet address:
               * the one string on the mobile shell where getting the ink wrong
               * costs money, not just legibility. It carries its own fill
               * (`mobileSurface.chip`), so it states its own ink rather than
               * depending on an ancestor that a later refactor could restyle.
               * It was `#f5f4ff` on `#F7F8FA` — 1.03:1 — in dark mode.
               */
              color: mobileText.primary,
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1.5,
              mb: 2.5,
              // Addresses are long unbroken strings and must wrap, not overflow.
              overflowWrap: 'anywhere',
              px: 1.75,
              py: 1.5,
            }}
          >
            {address}
          </Box>

          <MobileButton onClick={() => copyToClipboard(address)}>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
              <Icon name={isCopied ? 'check' : 'copy'} size={18} strokeWidth={2} />
              {isCopied ? 'Copied' : 'Copy address'}
            </Box>
          </MobileButton>
        </>
      ) : (
        <Alert severity="warning">No wallet is connected.</Alert>
      )}

      <Box sx={{ height: 8 }} />
    </BottomSheet>
  );
}
