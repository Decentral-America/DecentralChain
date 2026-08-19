import { Box, ButtonBase, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import { AssetMark, MobileCard, MobileSection } from '@/components/mobile/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileStatus,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

/**
 * Mobile account screen.
 *
 * Identity card followed by grouped settings rows — the native pattern for
 * this surface, rather than the desktop settings page's tabbed panels.
 */

interface Row {
  icon: IconName;
  label: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsGroup({ title, rows }: { title: string; rows: Row[] }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        sx={{
          color: mobileText.muted,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.4px',
          mb: 1,
          ml: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>

      <MobileCard padded={false} sx={{ overflow: 'hidden' }}>
        {rows.map((row, index) => (
          <ButtonBase
            key={row.label}
            onClick={row.onClick ?? (row.to ? () => navigate(row.to as string) : undefined)}
            sx={{
              borderBottom:
                index === rows.length - 1 ? 'none' : `1px solid ${mobileSurface.border}`,
              display: 'flex',
              gap: 1.5,
              justifyContent: 'flex-start',
              minHeight: 52,
              px: 2,
              py: 1.5,
              width: '100%',
            }}
          >
            <Box
              sx={{
                color: row.danger ? mobileStatus.danger : mobileAccent.base,
                flexShrink: 0,
                lineHeight: 0,
              }}
            >
              <Icon name={row.icon} size={19} strokeWidth={1.8} />
            </Box>
            <Typography
              sx={{
                color: row.danger ? mobileStatus.danger : mobileText.primary,
                flex: 1,
                fontSize: 15,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              {row.label}
            </Typography>
            {!row.danger && (
              <Box sx={{ color: mobileText.muted, flexShrink: 0, lineHeight: 0 }}>
                <Icon name="chevronRight" size={18} />
              </Box>
            )}
          </ButtonBase>
        ))}
      </MobileCard>
    </Box>
  );
}

export function MobileAccount() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { copyToClipboard, isCopied } = useClipboard();

  const address = user?.address ?? '';
  const shortAddress = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Not connected';

  return (
    <Box
      sx={{
        bgcolor: mobileSurface.canvas,
        // Fixed fill, fixed ink — see the note on MobileHome's canvas.
        color: mobileText.primary,
        minHeight: '100%',
      }}
    >
      <MobileAppBar title="Account" subtitle="Your wallet, preferences and session." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        {/* Identity */}
        <MobileCard sx={{ p: 2.5 }}>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.75 }}>
            <AssetMark size={52} bg={mobileAccent.wash}>
              <Box sx={{ color: mobileAccent.base }}>
                {address ? address.slice(0, 2).toUpperCase() : 'DX'}
              </Box>
            </AssetMark>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                {user?.name || 'My wallet'}
              </Typography>
              <Typography
                sx={{
                  color: mobileText.muted,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {shortAddress}
              </Typography>
            </Box>
            {address ? (
              <ButtonBase
                aria-label="Copy address"
                onClick={() => copyToClipboard(address)}
                sx={{
                  bgcolor: mobileSurface.sunken,
                  borderRadius: mobileRadius.sm,
                  color: isCopied ? mobileStatus.success : mobileText.secondary,
                  flexShrink: 0,
                  height: 44,
                  width: 44,
                }}
              >
                <Icon name={isCopied ? 'check' : 'copy'} size={18} strokeWidth={1.8} />
              </ButtonBase>
            ) : null}
          </Box>
        </MobileCard>

        <SettingsGroup
          title="Wallet"
          rows={[
            { icon: 'wallet', label: 'Portfolio', to: '/desktop/wallet/portfolio' },
            { icon: 'clipboard', label: 'Transactions', to: '/desktop/wallet/transactions' },
            { icon: 'trending', label: 'Leasing', to: '/desktop/wallet/leasing' },
            { icon: 'user', label: 'Aliases', to: '/desktop/wallet/aliases' },
          ]}
        />

        <SettingsGroup
          title="Preferences"
          rows={[
            { icon: 'settings', label: 'General', to: '/desktop/settings' },
            { icon: 'globe', label: 'Network', to: '/desktop/settings' },
            { icon: 'shield', label: 'Security', to: '/desktop/settings' },
          ]}
        />

        <SettingsGroup
          title="Session"
          rows={[
            {
              danger: true,
              icon: 'logout',
              label: 'Sign out',
              onClick: () => {
                void logout();
                void navigate('/');
              },
            },
          ]}
        />
      </MobileSection>
    </Box>
  );
}
