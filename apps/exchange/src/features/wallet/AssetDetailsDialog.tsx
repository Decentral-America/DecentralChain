/**
 * Asset info dialog.
 *
 * Opened by clicking an asset anywhere it is listed — the portfolio table, the
 * dashboard's holdings card. Three tabs answer the three questions someone has
 * about a token they hold: what it is, how much of it they have, and what it
 * has done on this account.
 *
 * Everything shown here comes from the node. There is no oracle feed in this
 * app yet, so there is no verification badge and no star rating: a "qualified"
 * chip with nothing behind it would be a claim about someone's money that the
 * app cannot support. The chips that are here — smart asset, NFT, issued by
 * you — are each a field the node returns.
 */
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  DoneAll as DoneIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useAddressTransactions } from '@/api/services/addressService';
import { type AssetDetails, isNFT, useAssetDetails } from '@/api/services/assetsService';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { useExplorerLinks } from '@/hooks/useExplorerLinks';
import { tokens } from '@/theme/tokens/semantic';
import { formatAmount } from '@/utils/formatters';
import { hueFor } from './assetHue';
import { mapTxToActivity } from './txActivity';

/** The holding a caller already knows about, as shown in its own list. */
export interface AssetDialogAsset {
  /** Human-scale balance, already divided out of base units. */
  amount: number;
  /** The issued asset's id, or the `DCC` symbol for the base asset. */
  assetId: string;
  decimals: number;
  isBaseAsset: boolean;
  name: string;
  /**
   * Human-scale balance locked in open orders or leases. Callers pass what the
   * node reports for the base asset and 0 elsewhere — a per-asset figure needs
   * the matcher's reserved-balance endpoint, which nothing here calls yet.
   */
  reserved?: number;
}

interface AssetDetailsDialogProps {
  asset: AssetDialogAsset;
  onClose: () => void;
}

type DialogTab = 'balance' | 'details' | 'transactions';

/** How many of this asset's transactions the history tab lists. */
const HISTORY_LIMIT = 15;

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box
    sx={{
      alignItems: 'baseline',
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      gap: 3,
      justifyContent: 'space-between',
      py: 1.25,
    }}
  >
    <Typography sx={{ color: 'text.secondary', flexShrink: 0, fontSize: 13 }}>{label}</Typography>
    <Box sx={{ minWidth: 0, textAlign: 'right' }}>{children}</Box>
  </Box>
);

const PlainValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ color: 'text.primary', fontSize: 14 }}>{children}</Typography>
);

/**
 * A long identifier with a copy button.
 *
 * `copiedField` is the field the clipboard last accepted, or null once the
 * confirmation has expired — one flag shared across the rows, so copying the id
 * does not also flash "Copied" beside the issuer.
 */
const CopyableValue: React.FC<{
  copiedField: string | null;
  field: string;
  onCopy: (field: string, value: string) => void;
  value: string;
}> = ({ copiedField, field, onCopy, value }) => {
  const done = copiedField === field;
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
      <Typography
        sx={{
          color: 'text.primary',
          fontFamily: 'monospace',
          fontSize: 13,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </Typography>
      <Tooltip title={done ? 'Copied' : 'Copy'}>
        <IconButton size="small" onClick={() => onCopy(field, value)} aria-label={`Copy ${field}`}>
          {done ? <DoneIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export const AssetDetailsDialog: React.FC<AssetDetailsDialogProps> = ({ asset, onClose }) => {
  const { user } = useAuth();
  const explorer = useExplorerLinks();
  const { copyToClipboard, isCopied } = useClipboard();
  const t = tokens(useTheme().palette.mode);

  const [tab, setTab] = useState<DialogTab>('details');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /*
   * The base asset is not an issued asset — the node has no
   * `/assets/details/DCC` to answer with — so the fetch is skipped and its
   * facts are stated directly below.
   */
  const {
    data: details,
    isLoading,
    error,
  } = useAssetDetails(asset.isBaseAsset ? '' : asset.assetId, { enabled: !asset.isBaseAsset });

  /*
   * The history is fetched only once someone opens that tab. It is a hundred
   * transactions for one dialog; pulling it on every asset click would spend
   * the request on the majority who only wanted to read the id.
   */
  const { data: transactionsData, isLoading: isHistoryLoading } = useAddressTransactions(
    user?.address || '',
    100,
    { enabled: tab === 'transactions' && !!user?.address },
  );

  const history = useMemo(() => {
    const address = user?.address;
    if (!transactionsData || !address) return [];
    return transactionsData
      .flat()
      .filter((tx) => (asset.isBaseAsset ? !tx.assetId : tx.assetId === asset.assetId))
      .slice(0, HISTORY_LIMIT)
      .map((tx) => mapTxToActivity(tx, address));
  }, [transactionsData, user?.address, asset.assetId, asset.isBaseAsset]);

  const hue = t.appTile[hueFor(asset.assetId)];
  const reserved = asset.reserved ?? 0;
  const ticker = asset.isBaseAsset ? 'DCC' : asset.name;

  const copy = (field: string, value: string) => {
    copyToClipboard(value);
    setCopiedField(field);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="asset-info-title">
      <DialogTitle id="asset-info-title" sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Asset info</Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* The identity band: which asset this is, and what kind of thing it is. */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pb: 2.5, px: 3 }}>
        <Box
          aria-hidden
          sx={{
            alignItems: 'center',
            bgcolor: hue.fill,
            borderRadius: '50%',
            color: hue.on,
            display: 'flex',
            flexShrink: 0,
            fontSize: 20,
            fontWeight: 700,
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}
        >
          {asset.name.slice(0, 1).toUpperCase()}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 600 }} noWrap title={asset.name}>
            {asset.name}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
            {asset.isBaseAsset && <Chip label="Base asset" size="small" />}
            {details?.scripted && <Chip label="Smart asset" size="small" />}
            {details && isNFT(details) && <Chip label="NFT" size="small" />}
            {details && user?.address === details.issuer && (
              <Chip label="Issued by you" size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Box>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, next: DialogTab) => setTab(next)}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
      >
        <Tab label="Details" value="details" />
        <Tab label="Balance" value="balance" />
        <Tab label="Transactions" value="transactions" />
      </Tabs>

      {/*
        A fixed floor on the body, so switching tabs does not resize the dialog
        under the pointer that is still travelling towards the next tab.
      */}
      <Box sx={{ minHeight: 300, overflowY: 'auto', px: 3, py: 2 }}>
        {tab === 'details' && (
          <AssetDetailsTab
            asset={asset}
            details={details}
            error={error}
            isLoading={isLoading}
            copiedField={isCopied ? copiedField : null}
            onCopy={copy}
          />
        )}

        {tab === 'balance' && (
          <>
            <DetailRow label="Available">
              <PlainValue>
                {formatAmount(asset.amount, asset.decimals)} {ticker}
              </PlainValue>
            </DetailRow>
            <DetailRow label="Reserved">
              <PlainValue>
                {formatAmount(reserved, asset.decimals)} {ticker}
              </PlainValue>
            </DetailRow>
            <DetailRow label="Total">
              <PlainValue>
                {formatAmount(asset.amount + reserved, asset.decimals)} {ticker}
              </PlainValue>
            </DetailRow>
            {/*
              Value needs a market for the asset, and nothing here fetches one.
              A zero would read as "worthless" rather than "unpriced" — the same
              call the portfolio table's price columns make.
            */}
            <DetailRow label="Value, DCC">
              <PlainValue>—</PlainValue>
            </DetailRow>
            <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 2 }}>
              Reserved is the part of the balance the node has locked into open orders or leases.
              Value is blank because no market price is fetched for this asset yet.
            </Typography>
          </>
        )}

        {tab === 'transactions' && (
          <>
            {isHistoryLoading && (
              <Stack sx={{ gap: 1 }}>
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} variant="rounded" height={44} />
                ))}
              </Stack>
            )}

            {!isHistoryLoading && history.length === 0 && (
              <Typography
                sx={{ color: 'text.secondary', fontSize: 14, py: 6, textAlign: 'center' }}
              >
                No transactions for {ticker} in the last 100 on this account.
              </Typography>
            )}

            {!isHistoryLoading &&
              history.map((activity) => (
                <Box
                  key={activity.txId}
                  sx={{
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'space-between',
                    py: 1.25,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14 }}>{activity.verb}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {activity.time}
                    </Typography>
                  </Box>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {activity.amountRaw === null
                        ? '—'
                        : `${formatAmount(activity.amountRaw / 10 ** asset.decimals, asset.decimals)} ${ticker}`}
                    </Typography>
                    {explorer.isConfigured() && (
                      <Tooltip title="Open in explorer">
                        <IconButton
                          size="small"
                          onClick={() => explorer.openTransaction(activity.txId)}
                          aria-label={`Open transaction ${activity.txId} in explorer`}
                        >
                          <OpenInNewIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              ))}
          </>
        )}
      </Box>

      {!asset.isBaseAsset && explorer.isConfigured() && (
        <Box sx={{ borderColor: 'divider', borderTop: 1, px: 3, py: 1.5 }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon />}
            onClick={() => explorer.openAsset(asset.assetId)}
          >
            View in explorer
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

/**
 * The Details tab.
 *
 * Split out because it branches three ways — the base asset states its own
 * facts, an issued asset waits on the node, and a failed fetch has to say so
 * rather than render a table of blanks.
 */
const AssetDetailsTab: React.FC<{
  asset: AssetDialogAsset;
  details: AssetDetails | undefined;
  copiedField: string | null;
  error: Error | null;
  isLoading: boolean;
  onCopy: (field: string, value: string) => void;
}> = ({ asset, copiedField, details, error, isLoading, onCopy }) => {
  if (asset.isBaseAsset) {
    return (
      <>
        <DetailRow label="Name">
          <PlainValue>{asset.name}</PlainValue>
        </DetailRow>
        <DetailRow label="Ticker">
          <PlainValue>DCC</PlainValue>
        </DetailRow>
        <DetailRow label="Decimal points">
          <PlainValue>{asset.decimals}</PlainValue>
        </DetailRow>
        <DetailRow label="Type">
          <PlainValue>Native asset</PlainValue>
        </DetailRow>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.6, mt: 2 }}>
          The chain's own asset. It pays transaction fees and can be leased to a node. It was not
          issued by a transaction, so it carries no asset id, issuer or supply record of the kind an
          issued token has.
        </Typography>
      </>
    );
  }

  if (isLoading) {
    return (
      <Stack sx={{ gap: 1 }}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <Skeleton key={row} variant="rounded" height={36} />
        ))}
      </Stack>
    );
  }

  if (error || !details) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load this asset's details from the node.
        </Alert>
        <DetailRow label="ID">
          <CopyableValue
            copiedField={copiedField}
            field="ID"
            onCopy={onCopy}
            value={asset.assetId}
          />
        </DetailRow>
      </>
    );
  }

  return (
    <>
      <DetailRow label="Issuer">
        <CopyableValue
          copiedField={copiedField}
          field="issuer"
          onCopy={onCopy}
          value={details.issuer}
        />
      </DetailRow>
      <DetailRow label="ID">
        <CopyableValue
          copiedField={copiedField}
          field="ID"
          onCopy={onCopy}
          value={details.assetId}
        />
      </DetailRow>
      <DetailRow label="Name">
        <PlainValue>{details.name}</PlainValue>
      </DetailRow>
      <DetailRow label="Total amount">
        <PlainValue>
          {formatAmount(details.quantity / 10 ** details.decimals, details.decimals)}
        </PlainValue>
      </DetailRow>
      <DetailRow label="Decimal points">
        <PlainValue>{details.decimals}</PlainValue>
      </DetailRow>
      <DetailRow label="Type">
        <PlainValue>{details.reissuable ? 'Reissuable' : 'Not reissuable'}</PlainValue>
      </DetailRow>
      <DetailRow label="Sponsored asset fee">
        <PlainValue>
          {details.minSponsoredAssetFee == null
            ? '—'
            : `${formatAmount(details.minSponsoredAssetFee / 10 ** details.decimals, details.decimals)} ${details.name}`}
        </PlainValue>
      </DetailRow>
      <DetailRow label="Issue date">
        <PlainValue>
          {details.issueTimestamp
            ? format(new Date(details.issueTimestamp), 'dd.MM.yyyy HH:mm')
            : '—'}
        </PlainValue>
      </DetailRow>
      {details.description && (
        <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.6, mt: 2 }}>
          {details.description}
        </Typography>
      )}
    </>
  );
};
