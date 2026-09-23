/**
 * Connect / disconnect a Solana wallet.
 *
 * Written here rather than taken from `@solana/wallet-adapter-react-ui`: that
 * package ships prebuilt CSS full of raw colour literals, which is exactly
 * what `theme/__tests__/noRawColours.test.ts` fails the build over. A menu of
 * two wallets is not worth a lint exemption.
 */

import { Button, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export const SolanaWalletButton: React.FC = () => {
  const { connecting, disconnect, publicKey, select, wallet, wallets } = useWallet();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (publicKey) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {wallet?.adapter.name} · {publicKey.toBase58().slice(0, 4)}…
          {publicKey.toBase58().slice(-4)}
        </Typography>
        <Button size="small" variant="outlined" onClick={() => void disconnect()}>
          Disconnect
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        disabled={connecting}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {connecting ? 'Connecting…' : 'Connect Solana wallet'}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {wallets.map((entry) => (
          <MenuItem
            key={entry.adapter.name}
            onClick={() => {
              select(entry.adapter.name);
              setAnchorEl(null);
            }}
          >
            {entry.adapter.name}
            {entry.readyState !== 'Installed' && (
              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                not detected
              </Typography>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
