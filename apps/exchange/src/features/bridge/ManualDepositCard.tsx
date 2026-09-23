/**
 * Depositing without connecting a wallet here.
 *
 * The bridge does not care what sends the funds — a CLI, a hardware wallet, a
 * different browser entirely. What it needs is the transfer, and then a way to
 * associate it with a DecentralChain recipient. This panel gives the three
 * values a transfer needs and explains the second step honestly.
 */
import { ContentCopy, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { NATIVE_VAULT_PDA, SOLANA_PROGRAM_ID } from '@/config/bridge';

const CopyRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is unavailable over plain http and in some privacy modes.
      // The value is selectable either way, so this is not worth an error.
    }
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
        <Box
          sx={{
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 13,
            overflowX: 'auto',
            px: 1.5,
            py: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Box>
        <Tooltip title={copied ? 'Copied' : 'Copy'}>
          <IconButton onClick={copy} aria-label={`Copy ${label}`} size="small">
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

interface ManualDepositCardProps {
  /** Human amount currently entered, for the lamports line. */
  amount: string;
  decimals: number;
  /** Whether a DCC recipient has been supplied — step two needs one. */
  hasRecipient: boolean;
  tokenName: string;
}

export const ManualDepositCard: React.FC<ManualDepositCardProps> = ({
  amount,
  decimals,
  hasRecipient,
  tokenName,
}) => {
  const [open, setOpen] = useState(false);
  const [signature, setSignature] = useState('');

  const rawAmount = (() => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    // Display only — the signing path parses with exact string maths.
    return BigInt(Math.round(parsed * 10 ** decimals)).toString();
  })();

  return (
    <Paper variant="outlined">
      <Box
        onClick={() => setOpen((value) => !value)}
        sx={{
          alignItems: 'center',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Manual Deposit
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Deposit from a CLI, another wallet, or any Solana tool
          </Typography>
        </Box>
        <IconButton size="small" aria-label={open ? 'Collapse' : 'Expand'}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pb: 2, px: 2 }}>
          <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Step 1 — send {tokenName} to the bridge vault
            </Typography>

            <CopyRow label="Vault address" value={NATIVE_VAULT_PDA} />
            <CopyRow label="Bridge program" value={SOLANA_PROGRAM_ID} />
            {rawAmount && <CopyRow label="Amount (base units)" value={rawAmount} />}

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                From the Solana CLI
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                solana transfer {NATIVE_VAULT_PDA} {amount || '<amount>'} --allow-unfunded-recipient
              </Box>
            </Alert>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Step 2 — register the transaction
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Paste the Solana transaction signature so the validators can associate the transfer
              with your DecentralChain address.
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="Paste the Solana transaction signature…"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />

            {!hasRecipient && (
              <Alert severity="warning" sx={{ mt: 1.5 }}>
                Enter your DecentralChain recipient address above first — without it there is
                nowhere to mint.
              </Alert>
            )}

            {/*
              No endpoint exists for this yet. The documented API covers tokens,
              limits, transfer status and stats; registering a manually-sent
              deposit is not among them. Wiring a button to nothing would be
              worse than saying so.
            */}
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Registering a manual deposit needs a bridge API endpoint that does not exist yet. Keep
              the signature and your recipient address, and pass them to support.
            </Alert>

            <Button fullWidth variant="contained" disabled sx={{ mt: 1.5 }}>
              Register manual deposit
            </Button>
          </Paper>
        </Box>
      </Collapse>
    </Paper>
  );
};
