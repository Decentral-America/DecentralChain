/**
 * Everything one transaction did, opened from its row.
 *
 * The history table shows six columns because six is what fits, and for the
 * types where the movement is not in the `amount` field — a contract call, a
 * mass transfer — those six columns say "Invoke Script · +0 DCC" and stop. The
 * row is the index; this is the record.
 *
 * It re-fetches the transaction from the node by id rather than rendering the
 * list's mapped copy, because the list endpoint drops the parts worth opening a
 * dialog for: the payments attached to a call, the transfers the contract made
 * back, the attachment on a transfer, the height it settled at.
 */
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  DoneAll as DoneIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowDownward as InIcon,
  OpenInNew as OpenInNewIcon,
  ArrowUpward as OutIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTransaction } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { useExplorerLinks } from '@/hooks/useExplorerLinks';
import { tokens } from '@/theme/tokens/semantic';
import { formatAmount } from '@/utils/formatters';
import {
  collectAssetIds,
  detailRowsFor,
  formatArg,
  headlineFor,
  type Movement,
  movementsFor,
  type NodeTx,
  shortId,
  txTypeName,
} from './txDetails';

interface TransactionDetailsDialogProps {
  onClose: () => void;
  txId: string;
}

/** DCC is not an issued asset, so the node has no details to return for it. */
const BASE_DECIMALS = 8;

const Row: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <Box
    sx={{
      alignItems: 'baseline',
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      gap: 3,
      justifyContent: 'space-between',
      py: 1.1,
    }}
  >
    <Typography sx={{ color: 'text.secondary', flexShrink: 0, fontSize: 13 }}>{label}</Typography>
    <Box sx={{ minWidth: 0, textAlign: 'right' }}>{children}</Box>
  </Box>
);

const PlainValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ color: 'text.primary', fontSize: 14, wordBreak: 'break-word' }}>
    {children}
  </Typography>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      color: 'text.secondary',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      pt: 2,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </Typography>
);

/**
 * A long identifier with a copy button. `copiedField` is the field the
 * clipboard last accepted, so copying the id does not also flash "Copied"
 * beside the sender.
 */
const CopyableValue: React.FC<{
  copiedField: string | null;
  field: string;
  onCopy: (field: string, value: string) => void;
  value: string;
}> = ({ copiedField, field, onCopy, value }) => (
  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
    <Typography
      sx={{
        color: 'text.primary',
        fontFamily: 'monospace',
        fontSize: 12.5,
        wordBreak: 'break-all',
      }}
    >
      {value}
    </Typography>
    <Tooltip title={copiedField === field ? 'Copied' : 'Copy'}>
      <IconButton size="small" onClick={() => onCopy(field, value)} aria-label={`Copy ${field}`}>
        {copiedField === field ? (
          <DoneIcon sx={{ fontSize: 15 }} />
        ) : (
          <CopyIcon sx={{ fontSize: 15 }} />
        )}
      </IconButton>
    </Tooltip>
  </Stack>
);

/** One line of the movement list: what left, or what arrived. */
const MovementRow: React.FC<{
  fmt: (raw: number, assetId: string | null) => string;
  movement: Movement;
  tone: { danger: string; success: string };
}> = ({ fmt, movement, tone }) => {
  const incoming = movement.direction === 'in';
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1.25, justifyContent: 'space-between', py: 0.9 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          aria-hidden
          sx={{
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: '50%',
            color: incoming ? tone.success : tone.danger,
            display: 'flex',
            flexShrink: 0,
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          {incoming ? <InIcon sx={{ fontSize: 16 }} /> : <OutIcon sx={{ fontSize: 16 }} />}
        </Box>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
          {movement.note ?? (incoming ? 'Received' : 'Sent')}
        </Typography>
      </Stack>
      <Typography
        sx={{
          color: incoming ? tone.success : tone.danger,
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {incoming ? '+' : '−'}
        {fmt(movement.raw, movement.assetId)}
      </Typography>
    </Stack>
  );
};

/**
 * Whether the contract that ran did what it was asked.
 *
 * A failed invoke is still mined and still charged for, and the history table
 * calls it "Confirmed" — which is true of the transaction and false of the
 * call. The node's own word for it goes here.
 */
const StatusChip: React.FC<{ status: string | undefined }> = ({ status }) => {
  if (!status) return null;
  const failed = status !== 'succeeded';
  return (
    <Chip
      size="small"
      color={failed ? 'error' : 'success'}
      variant={failed ? 'filled' : 'outlined'}
      label={failed ? 'Script failed' : 'Succeeded'}
      sx={{ fontSize: 11, height: 22 }}
    />
  );
};

/**
 * The record as the node returned it.
 *
 * Collapsed, and last. Nothing above it is a summary of anything this omits —
 * but eighteen transaction types have fields this dialog has no row for, and
 * for those the honest answer is the record itself rather than silence.
 */
const RawRecord: React.FC<{ tx: NodeTx }> = ({ tx }) => (
  <Accordion
    disableGutters
    elevation={0}
    sx={{ '&::before': { display: 'none' }, bgcolor: 'transparent', mt: 1 }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, px: 0 }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Raw record</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 0 }}>
      <Box
        component="pre"
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 2,
          fontSize: 11.5,
          m: 0,
          maxHeight: 260,
          overflow: 'auto',
          p: 1.5,
        }}
      >
        {JSON.stringify(tx, null, 2)}
      </Box>
    </AccordionDetails>
  </Accordion>
);

export const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  onClose,
  txId,
}) => {
  const { user } = useAuth();
  const explorer = useExplorerLinks();
  const { copyToClipboard } = useClipboard();
  const t = tokens(useTheme().palette.mode);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, error, isLoading } = useTransaction(txId);
  const tx = data as NodeTx | undefined;
  const address = user?.address ?? '';

  /*
   * One request for every issued asset the transaction mentions, including the
   * ones that only appear inside a nested invoke — without their decimals a
   * payout would be printed in base units, which is wrong by a factor of 10^8.
   */
  const assetIds = useMemo(() => (tx ? collectAssetIds(tx) : []), [tx]);
  const { data: assetDetails } = useMultipleAssetDetails(assetIds, {
    enabled: assetIds.length > 0,
  });

  const assets = useMemo(() => {
    const map = new Map<string, { decimals: number; name: string }>();
    for (const detail of assetDetails ?? []) {
      if (detail?.assetId)
        map.set(detail.assetId, { decimals: detail.decimals, name: detail.name });
    }
    return map;
  }, [assetDetails]);

  const nameOf = useMemo(
    () => (assetId: string | null) => {
      if (!assetId) return 'DCC';
      return assets.get(assetId)?.name ?? shortId(assetId, 5, 4);
    },
    [assets],
  );

  /*
   * Until the asset request lands there is no honest number of decimals to
   * divide by, so an unresolved asset falls back to the base asset's 8 — the
   * value every asset this chain issues by default uses — and the name shown
   * beside it is the id, which says plainly that it has not resolved yet.
   */
  const fmt = useMemo(
    () => (raw: number, assetId: string | null) => {
      const decimals = assetId ? (assets.get(assetId)?.decimals ?? BASE_DECIMALS) : BASE_DECIMALS;
      return `${formatAmount(raw / 10 ** decimals, decimals)} ${nameOf(assetId)}`;
    },
    [assets, nameOf],
  );

  const movements = useMemo(() => (tx ? movementsFor(tx, address) : []), [tx, address]);
  const detailRows = useMemo(
    () => (tx ? detailRowsFor(tx, address, fmt, nameOf) : []),
    [tx, address, fmt, nameOf],
  );

  const copy = (field: string, value: string) => {
    void copyToClipboard(value);
    setCopiedField(field);
  };

  const headline = tx ? headlineFor(tx, address, fmt) : '';
  const args = tx?.call?.args ?? [];
  const dataEntries = tx?.type === 12 ? (tx.data ?? []) : [];

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="tx-details-title">
      <DialogTitle id="tx-details-title" sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Transaction</Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ pb: 3, px: 3 }}>
        {isLoading && (
          <Stack sx={{ gap: 1 }}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={160} />
          </Stack>
        )}

        {error && (
          <Alert severity="error">
            Could not read this transaction from the node. It is unaffected — it is on chain whether
            or not this page can see it.
          </Alert>
        )}

        {tx && (
          <>
            {/* What happened, in one line, before any of the numbers behind it. */}
            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1.75, pb: 0.5 }}>
              <Box
                aria-hidden
                sx={{
                  alignItems: 'center',
                  bgcolor: t.appTile.violet.fill,
                  borderRadius: '50%',
                  color: t.appTile.violet.on,
                  display: 'flex',
                  flexShrink: 0,
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                }}
              >
                {movements.length > 1 ? (
                  <SwapIcon />
                ) : movements[0]?.direction === 'in' ? (
                  <InIcon />
                ) : (
                  <OutIcon />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.25,
                  }}
                >
                  {headline}
                </Typography>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 0.6 }}
                >
                  <Typography sx={{ color: 'text.secondary', fontSize: 12.5 }}>
                    {txTypeName(tx.type)} ·{' '}
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </Typography>
                  <StatusChip status={tx.applicationStatus} />
                </Stack>
              </Box>
            </Stack>

            {movements.length > 0 && (
              <>
                <SectionTitle>Balance change</SectionTitle>
                <Box sx={{ pt: 0.5 }}>
                  {movements.map((movement) => (
                    <MovementRow
                      key={`${movement.direction}:${movement.assetId ?? 'DCC'}`}
                      fmt={fmt}
                      movement={movement}
                      tone={{ danger: t.intent.danger, success: t.intent.success }}
                    />
                  ))}
                </Box>
              </>
            )}

            {detailRows.length > 0 && (
              <>
                <SectionTitle>Details</SectionTitle>
                {detailRows.map((row) => (
                  <Row key={row.label} label={row.label}>
                    {row.copyable ? (
                      <CopyableValue
                        copiedField={copiedField}
                        field={row.label}
                        onCopy={copy}
                        value={row.value}
                      />
                    ) : (
                      <PlainValue>{row.value}</PlainValue>
                    )}
                  </Row>
                ))}
              </>
            )}

            {(tx.payment?.length ?? 0) > 0 && (
              <>
                <SectionTitle>Attached payments</SectionTitle>
                {tx.payment?.map((payment, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: two payments of the same asset and amount are indistinguishable, and the list is fixed for a transaction id — position is the only identity they have
                  <Row key={`payment-${index}`} label={`Payment ${index + 1}`}>
                    <PlainValue>{fmt(payment.amount, payment.assetId)}</PlainValue>
                  </Row>
                ))}
              </>
            )}

            {args.length > 0 && (
              <>
                <SectionTitle>Call arguments</SectionTitle>
                {args.map((arg, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a call's arguments are positional — argument 3 *is* its index, and the list never reorders within one transaction
                  <Row key={`arg-${index}`} label={`${index + 1} · ${arg.type}`}>
                    <Typography
                      sx={{ fontFamily: 'monospace', fontSize: 12.5, wordBreak: 'break-all' }}
                    >
                      {formatArg(arg)}
                    </Typography>
                  </Row>
                ))}
              </>
            )}

            {dataEntries.length > 0 && (
              <>
                <SectionTitle>Data written</SectionTitle>
                {dataEntries.map((entry) => (
                  <Row key={entry.key} label={entry.key}>
                    <Typography
                      sx={{ fontFamily: 'monospace', fontSize: 12.5, wordBreak: 'break-all' }}
                    >
                      {String(entry.value)}
                    </Typography>
                  </Row>
                ))}
              </>
            )}

            <SectionTitle>Transaction</SectionTitle>
            <Row label="ID">
              <CopyableValue copiedField={copiedField} field="ID" onCopy={copy} value={tx.id} />
            </Row>
            {/*
             * On a transfer the signer is the "From" row two sections up, and
             * printing the same address twice under two labels reads as two
             * facts. It earns its row only where the details did not name it.
             */}
            {!detailRows.some((detail) => detail.value === tx.sender) && (
              <Row label="Signed by">
                <CopyableValue
                  copiedField={copiedField}
                  field="Signed by"
                  onCopy={copy}
                  value={tx.sender}
                />
              </Row>
            )}
            <Row label="Fee">
              <PlainValue>{fmt(tx.fee, tx.feeAssetId ?? null)}</PlainValue>
            </Row>
            {tx.height !== undefined && (
              <Row label="Block">
                <PlainValue>{tx.height.toLocaleString()}</PlainValue>
              </Row>
            )}
            <Row label="Timestamp">
              <PlainValue>{format(new Date(tx.timestamp), 'PPpp')}</PlainValue>
            </Row>
            {tx.version !== undefined && (
              <Row label="Version">
                <PlainValue>{tx.version}</PlainValue>
              </Row>
            )}

            <Stack direction="row" sx={{ gap: 1, pt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                onClick={() => explorer.openTransaction(tx.id)}
              >
                View on explorer
              </Button>
            </Stack>

            <RawRecord tx={tx} />
          </>
        )}
      </Box>
    </Dialog>
  );
};
