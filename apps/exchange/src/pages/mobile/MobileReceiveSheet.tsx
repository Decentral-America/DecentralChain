import { Box, Typography } from '@mui/material';
import { QRCodeSVG as QRCodeSVGBase } from 'qrcode.react';
import type React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { MobileButton } from '@/components/mobile/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { mobileRadius, mobileStatus, mobileSurface, mobileText } from '@/styles/mobileTokens';

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
    <BottomSheet open={open} onClose={onClose}>
      <Typography
        component="h2"
        sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 0.5 }}
      >
        Receive
      </Typography>
      <Typography sx={{ color: mobileText.secondary, fontSize: 14, mb: 3 }}>
        Share this address to receive DCC and any issued asset on DecentralChain.
      </Typography>

      {address ? (
        <>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: mobileSurface.card,
              border: `1px solid ${mobileSurface.border}`,
              borderRadius: mobileRadius.card,
              display: 'flex',
              justifyContent: 'center',
              mb: 2.5,
              p: 2.5,
            }}
          >
            <QRCodeSVG value={address} size={180} level="H" includeMargin={false} />
          </Box>

          <Typography sx={{ color: mobileText.secondary, fontSize: 13, mb: 1 }}>
            Your address
          </Typography>
          <Box
            sx={{
              bgcolor: mobileSurface.sunken,
              border: `1px solid ${mobileSurface.border}`,
              borderRadius: mobileRadius.md,
              /*
               * The sheet above already pins its ink, so this repeats it —
               * deliberately. This well holds the user's own wallet address:
               * the one string on the mobile shell where getting the ink wrong
               * costs money, not just legibility. It carries its own fixed fill
               * (`mobileSurface.sunken`), so it states its own ink rather than
               * depending on an ancestor that a later refactor could restyle.
               * It was `#f5f4ff` on `#F7F8FA` — 1.03:1 — in dark mode.
               */
              color: mobileText.primary,
              fontSize: 14,
              mb: 2.5,
              // Addresses are long unbroken strings and must wrap, not overflow.
              overflowWrap: 'anywhere',
              px: 2,
              py: 1.75,
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
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ color: mobileStatus.warning, fontSize: 14 }}>
            No wallet is connected.
          </Typography>
        </Box>
      )}

      <Box sx={{ height: 16 }} />
    </BottomSheet>
  );
}
