import { Box, ButtonBase, Skeleton, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import {
  AssetMark,
  MobileAssetRow,
  MobileCard,
  MobileQuickActions,
  MobileSection,
  MobileSectionHeader,
} from '@/components/mobile/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { MobileReceiveSheet } from '@/pages/mobile/MobileReceiveSheet';
import { useMobileWallet } from '@/pages/mobile/useMobileWallet';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';
import { formatAmount } from '@/utils/formatters';

/**
 * Mobile home screen.
 *
 * Branded gradient band, an overlapping balance card with the primary money
 * actions, and the real holdings of the connected wallet. Every figure comes
 * from `useMobileWallet`, which reads the same on-chain sources as the desktop
 * portfolio, so the two can never disagree.
 */

/** Initials shown for an asset that has no logo of its own. */
function initialsFor(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function MobileHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const { assets, availableBalance, baseBalance, isLoading, leased } = useMobileWallet();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const displayName = user?.name || 'there';
  const visibleAssets = assets.slice(0, 5);

  return (
    <Box
      sx={{
        bgcolor: mobileSurface.canvas,
        /*
         * This screen paints its own canvas, so `MobilePageShell`'s move to a
         * mode-aware surface does not reach it. `mobileSurface.canvas` is one
         * fixed `#F4F5F7` in both modes, and anything on it without a colour of
         * its own inherited MUI's mode-aware `text.primary` — `#f5f4ff` on
         * `#F4F5F7` is 1.00:1 in dark, which is what the "Your assets" section
         * heading was. Pinning the ink to the fill is the pairing the rest of
         * `styles/mobileTokens` already assumes.
         */
        color: mobileText.primary,
        minHeight: '100%',
      }}
    >
      <MobileAppBar
        unread
        title={`${greeting}, ${displayName}`}
        subtitle="Your assets. Your keys. Your freedom."
      />

      <MobileSection>
        <MobileCard sx={{ p: 2.5 }}>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.5, mb: 0.5 }}>
            <Typography sx={{ color: mobileText.secondary, fontSize: 14 }}>
              Available balance
            </Typography>
            <ButtonBase
              aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
              onClick={() => setBalanceHidden((v) => !v)}
              sx={{ borderRadius: '50%', color: mobileText.muted, height: 32, width: 32 }}
            >
              <Icon name={balanceHidden ? 'eyeOff' : 'eye'} size={16} strokeWidth={1.8} />
            </ButtonBase>
          </Box>

          <Box sx={{ alignItems: 'baseline', display: 'flex', gap: 1 }}>
            {isLoading ? (
              <Skeleton variant="text" width={180} height={40} />
            ) : (
              <Typography
                sx={{
                  fontSize: 26,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                }}
              >
                {balanceHidden ? '••••••' : `${formatAmount(availableBalance, 8)} DCC`}
              </Typography>
            )}
          </Box>

          {/* Secondary figures appear only when they add information */}
          {!isLoading && leased > 0 ? (
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Box>
                <Typography sx={{ color: mobileText.muted, fontSize: 12 }}>Total</Typography>
                <Typography
                  sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {balanceHidden ? '••••' : formatAmount(baseBalance, 8)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: mobileText.muted, fontSize: 12 }}>Leased</Typography>
                <Typography
                  sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {balanceHidden ? '••••' : formatAmount(leased, 8)}
                </Typography>
              </Box>
            </Box>
          ) : null}

          <Box sx={{ borderTop: `1px solid ${mobileSurface.border}`, mt: 2.5 }} />

          <MobileQuickActions
            actions={[
              { icon: 'download', label: 'Receive', onClick: () => setReceiveOpen(true) },
              { icon: 'send', label: 'Send', onClick: () => navigate('/desktop/wallet/portfolio') },
              { icon: 'swap', label: 'Trade', onClick: () => navigate('/desktop/dex') },
            ]}
          />
        </MobileCard>
      </MobileSection>

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom + 24}px` }}>
        <MobileSectionHeader
          title="Your assets"
          action={
            <ButtonBase
              onClick={() => navigate('/desktop/wallet/portfolio')}
              sx={{
                borderRadius: mobileRadius.sm,
                color: mobileAccent.base,
                fontSize: 13,
                fontWeight: 600,
                minHeight: mobileLayout.minTapTarget,
                px: 1.5,
              }}
            >
              See all
            </ButtonBase>
          }
        />

        <MobileCard padded={false} sx={{ px: 1, py: 0.5 }}>
          {isLoading &&
            [0, 1, 2].map((row) => (
              <Box key={row} sx={{ alignItems: 'center', display: 'flex', gap: 1.5, p: 1.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="55%" />
                  <Skeleton variant="text" width="35%" />
                </Box>
              </Box>
            ))}

          {!isLoading && visibleAssets.length === 0 && (
            <Box sx={{ px: 2, py: 5, textAlign: 'center' }}>
              <Typography
                sx={{ color: mobileText.primary, fontSize: 15, fontWeight: 600, mb: 0.5 }}
              >
                No assets yet
              </Typography>
              <Typography sx={{ color: mobileText.muted, fontSize: 13 }}>
                Receive DCC or an issued asset to get started.
              </Typography>
            </Box>
          )}

          {!isLoading &&
            visibleAssets.map((asset, index) => (
              <Box
                key={asset.assetId}
                sx={{
                  borderBottom:
                    index === visibleAssets.length - 1
                      ? 'none'
                      : `1px solid ${mobileSurface.border}`,
                }}
              >
                <MobileAssetRow
                  logo={
                    <AssetMark bg={asset.isBaseAsset ? mobileAccent.wash : mobileSurface.chip}>
                      <Box
                        sx={{ color: asset.isBaseAsset ? mobileAccent.base : mobileText.primary }}
                      >
                        {initialsFor(asset.name)}
                      </Box>
                    </AssetMark>
                  }
                  name={asset.name}
                  subtitle={asset.isBaseAsset ? 'Base asset' : asset.assetId}
                  price={balanceHidden ? '••••' : formatAmount(asset.amount, asset.decimals)}
                  change=""
                  positive
                  onClick={() => navigate('/desktop/wallet/portfolio')}
                />
              </Box>
            ))}
        </MobileCard>
      </MobileSection>

      <MobileReceiveSheet open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </Box>
  );
}
