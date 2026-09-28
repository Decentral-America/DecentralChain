import { Alert, Box, ButtonBase, Skeleton } from '@mui/material';
import { Coins, Download, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import {
  AssetMark,
  initialsFor,
  MobileAssetRow,
  MobileButton,
  MobileHero,
  MobileQuickActions,
  MobileSection,
  MobileStat,
  MobileTextAction,
  VisuallyHidden,
} from '@/components/mobile/primitives';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import { GroupedList, ListRowSkeleton } from '@/components/premium/GroupedList';
import { useAuth } from '@/contexts/AuthContext';
import { MobileReceiveSheet } from '@/pages/mobile/MobileReceiveSheet';
import { useMobileWallet } from '@/pages/mobile/useMobileWallet';
import { mobileLayout, mobileSurface, mobileText } from '@/styles/mobileTokens';
import { formatAmount } from '@/utils/formatters';

/**
 * Mobile home screen.
 *
 * A large title, the available balance as the hero figure on the ground (as
 * iOS Wallet sets it), the three money actions as round keys, then the real
 * holdings as a grouped inset list. Every figure comes from `useMobileWallet`,
 * which reads the same on-chain sources as the desktop portfolio, so the two
 * can never disagree.
 */

const HIDDEN = '••••••';

export function MobileHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const { assets, availableBalance, error, isLoading, leased, totalBalance } = useMobileWallet();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const visibleAssets = assets.slice(0, 5);

  return (
    <Box
      sx={{
        // The page ground (`var(--surface-ground)`), which follows the theme.
        bgcolor: mobileSurface.canvas,
        /*
         * This screen paints its own canvas, so `MobilePageShell`'s surface
         * does not reach it, and it states the ink that goes with that canvas
         * rather than inheriting MUI's `text.primary`. The two once came from
         * different systems — a fixed `#F4F5F7` canvas under a mode-aware ink
         * measured 1.00:1 in dark, which is what the "Your assets" section
         * heading was. Naming both from `styles/mobileTokens` keeps them a pair.
         */
        color: mobileText.primary,
        minHeight: '100%',
      }}
    >
      {/* No `unread` here: the bell's dot is only passed from real message state. */}
      <MobileAppBar title="Wallet" subtitle={user?.name ? `${greeting}, ${user.name}` : greeting} />

      <MobileSection>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not load balances. They will appear once the connection is back.
          </Alert>
        ) : null}

        <MobileHero
          label="Available balance"
          unit={balanceHidden || isLoading || error ? undefined : 'DCC'}
          labelAction={
            <ButtonBase
              aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
              onClick={() => setBalanceHidden((v) => !v)}
              sx={{
                '&:focus-visible': { boxShadow: '0 0 0 2px var(--color-indigo-ink)' },
                borderRadius: '50%',
                color: mobileText.secondary,
                height: mobileLayout.minTapTarget,
                width: mobileLayout.minTapTarget,
              }}
            >
              <Icon name={balanceHidden ? 'eyeOff' : 'eye'} size={17} strokeWidth={1.8} />
            </ButtonBase>
          }
          footer={
            // Secondary figures appear only when they add information.
            !isLoading && leased > 0 ? (
              <Box sx={{ display: 'flex', gap: 4, mt: 1.5 }}>
                <MobileStat
                  label="Total"
                  value={
                    balanceHidden ? '••••' : <AnimatedNumber value={totalBalance} decimals={8} />
                  }
                />
                <MobileStat
                  label="Leased"
                  value={balanceHidden ? '••••' : <AnimatedNumber value={leased} decimals={8} />}
                />
              </Box>
            ) : null
          }
        >
          {isLoading ? (
            <Skeleton variant="text" width={200} height={52} />
          ) : error ? (
            // The balance is unknown, which is not the same as zero.
            <Box component="span" sx={{ color: mobileText.tertiary }}>
              —
            </Box>
          ) : balanceHidden ? (
            <>
              <span aria-hidden="true">{HIDDEN}</span>
              <VisuallyHidden>Balance hidden</VisuallyHidden>
            </>
          ) : (
            <AnimatedNumber value={availableBalance} decimals={8} />
          )}
        </MobileHero>

        <MobileQuickActions
          actions={[
            { icon: 'download', label: 'Receive', onClick: () => setReceiveOpen(true) },
            { icon: 'send', label: 'Send', onClick: () => navigate('/desktop/wallet/portfolio') },
            { icon: 'swap', label: 'Trade', onClick: () => navigate('/desktop/dex') },
          ]}
        />
      </MobileSection>

      {error && assets.length === 0 ? null : (
        <MobileSection sx={{ mt: 4, pb: `${mobileLayout.scrollPaddingBottom}px` }}>
          <GroupedList
            title="Your assets"
            action={
              <MobileTextAction onClick={() => navigate('/desktop/wallet/portfolio')}>
                See all
              </MobileTextAction>
            }
          >
            {isLoading && [0, 1, 2].map((row) => <ListRowSkeleton key={row} />)}

            {!isLoading && !error && visibleAssets.length === 0 && (
              <EmptyState
                compact
                icons={[Coins, Download, Wallet]}
                title="No assets yet"
                description="Receive DCC or an issued asset to get started."
                action={
                  <Box sx={{ mx: 'auto', width: 200 }}>
                    <MobileButton onClick={() => setReceiveOpen(true)}>Receive</MobileButton>
                  </Box>
                }
              />
            )}

            {!isLoading &&
              visibleAssets.map((asset) => (
                <MobileAssetRow
                  key={asset.assetId}
                  logo={
                    <AssetMark tone={asset.isBaseAsset ? 'accent' : 'neutral'}>
                      {initialsFor(asset.name)}
                    </AssetMark>
                  }
                  name={asset.name}
                  subtitle={asset.isBaseAsset ? 'Base asset' : asset.assetId}
                  price={balanceHidden ? '••••' : formatAmount(asset.amount, asset.decimals)}
                  change=""
                  positive
                  onClick={() => navigate('/desktop/wallet/portfolio')}
                />
              ))}
          </GroupedList>
        </MobileSection>
      )}

      <MobileReceiveSheet open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </Box>
  );
}
