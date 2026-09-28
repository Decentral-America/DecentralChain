import { Box, ButtonBase } from '@mui/material';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import { AssetMark, MobileSection } from '@/components/mobile/primitives';
import { GroupedList, ListRow } from '@/components/premium/GroupedList';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { mobileLayout, mobileStatus, mobileSurface, mobileText } from '@/styles/mobileTokens';

/**
 * Mobile account screen.
 *
 * An identity row followed by grouped settings lists — the iOS Settings
 * pattern for this surface, rather than the desktop settings page's tabbed
 * panels.
 */

interface Row {
  icon: IconName;
  label: string;
  to: string;
}

/** A 30px tinted glyph tile, the iOS Settings row mark. */
function RowGlyph({ name }: { name: IconName }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        alignItems: 'center',
        bgcolor: 'var(--surface-lavender)',
        borderRadius: '8px',
        color: 'var(--color-indigo-ink)',
        display: 'flex',
        flexShrink: 0,
        height: 30,
        justifyContent: 'center',
        width: 30,
      }}
    >
      <Icon name={name} size={17} strokeWidth={2} />
    </Box>
  );
}

function SettingsGroup({ title, rows }: { title: string; rows: Row[] }) {
  const navigate = useNavigate();

  return (
    <GroupedList title={title} quiet>
      {rows.map((row) => (
        <ListRow
          key={row.label}
          leading={<RowGlyph name={row.icon} />}
          leadingWidth={30}
          title={row.label}
          onClick={() => navigate(row.to)}
        />
      ))}
    </GroupedList>
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
        // The canvas states its own ink — see the note on MobileHome's canvas.
        color: mobileText.primary,
        minHeight: '100%',
      }}
    >
      <MobileAppBar title="Account" subtitle="Your wallet, preferences and session." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        {/* Identity */}
        <GroupedList>
          <ListRow
            leading={
              <AssetMark size={56} tone="accent">
                {address ? address.slice(0, 2).toUpperCase() : 'DX'}
              </AssetMark>
            }
            leadingWidth={56}
            title={user?.name || 'My wallet'}
            subtitle={shortAddress}
            chevron={false}
            accessory={
              address ? (
                <ButtonBase
                  aria-label="Copy address"
                  onClick={() => copyToClipboard(address)}
                  sx={{
                    '&:active': { transform: 'scale(0.94)' },
                    '&:focus-visible': { boxShadow: '0 0 0 2px var(--color-indigo-ink)' },
                    bgcolor: 'var(--surface-fill)',
                    borderRadius: '50%',
                    color: isCopied ? mobileStatus.success : mobileText.secondary,
                    flexShrink: 0,
                    height: mobileLayout.minTapTarget,
                    transition: 'transform 160ms var(--ease), color 160ms var(--ease)',
                    width: mobileLayout.minTapTarget,
                  }}
                >
                  <Icon name={isCopied ? 'check' : 'copy'} size={18} strokeWidth={1.8} />
                </ButtonBase>
              ) : null
            }
          />
        </GroupedList>

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

        <GroupedList>
          <ListRow
            title="Sign out"
            tone="danger"
            chevron={false}
            onClick={() => {
              void logout();
              void navigate('/');
            }}
          />
        </GroupedList>
      </MobileSection>
    </Box>
  );
}
