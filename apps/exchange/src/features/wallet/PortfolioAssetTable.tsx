/**
 * The portfolio's asset table.
 *
 * One row per holding, with the actions that apply to it on the row rather
 * than behind a selection. Value, price and 24h change are shown where the
 * asset has a market and left as an em dash where it does not — an asset that
 * has never traded has no price, and printing 0.00 would claim it is worthless
 * rather than unpriced.
 */
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreVert,
  Search,
  ShowChart,
  UnfoldMore,
  VisibilityOff,
} from '@mui/icons-material';
import { Box, IconButton, InputBase, Tooltip, Typography, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { tokens } from '@/theme/tokens/semantic';
import { hueFor } from './assetHue';

export interface PortfolioTableRow {
  /** Human balance, already scaled out of base units. */
  amount: number;
  assetId: string;
  decimals: number;
  isBaseAsset: boolean;
  name: string;
  /** Balance locked in open orders or leases. */
  reserved: number;
}

type SortKey = 'balance' | 'name' | 'reserved';

const GRID = '52px minmax(0, 2fr) 1fr 1fr 1.2fr 1fr 1fr 190px';

/** Compact balance: 670.1k, 5.0M — the full figure lives in the tooltip. */
const compact = (value: number): string => {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  if (Math.abs(value) < 0.001) return value.toFixed(8).replace(/0+$/, '');
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

const HeaderCell: React.FC<{
  align?: 'left' | 'right';
  label: string;
  onSort?: () => void;
}> = ({ align = 'right', label, onSort }) => (
  <Box
    onClick={onSort}
    sx={{
      alignItems: 'center',
      cursor: onSort ? 'pointer' : 'default',
      display: 'flex',
      gap: 0.25,
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      userSelect: 'none',
    }}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    {onSort && <UnfoldMore sx={{ color: 'text.disabled', fontSize: 13 }} />}
  </Box>
);

interface PortfolioAssetTableProps {
  onReceive: (row: PortfolioTableRow) => void;
  /** Opening a row — the asset info dialog. */
  onSelect: (row: PortfolioTableRow) => void;
  onSend: (row: PortfolioTableRow) => void;
  rows: PortfolioTableRow[];
}

export const PortfolioAssetTable: React.FC<PortfolioAssetTableProps> = ({
  onReceive,
  onSelect,
  onSend,
  rows,
}) => {
  const t = tokens(useTheme().palette.mode);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('balance');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matched = needle
      ? rows.filter(
          (r) => r.name.toLowerCase().includes(needle) || r.assetId.toLowerCase().includes(needle),
        )
      : rows;

    return [...matched].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'reserved') return b.reserved - a.reserved;
      return b.amount - a.amount;
    });
  }, [rows, search, sort]);

  const toggleHidden = (assetId: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'grid',
          flexShrink: 0,
          gap: 2,
          gridTemplateColumns: GRID,
          px: 2,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            px: 0.75,
            py: 0.25,
          }}
        >
          <Search sx={{ color: 'text.disabled', fontSize: 18 }} />
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: 13, transition: 'width 140ms', width: search ? 160 : 0 }}
            inputProps={{ 'aria-label': 'Search assets' }}
            onFocus={(e) => {
              e.currentTarget.style.width = '160px';
            }}
          />
        </Box>
        <HeaderCell align="left" label="Asset Name" onSort={() => setSort('name')} />
        <HeaderCell label="Balance" onSort={() => setSort('balance')} />
        <HeaderCell label="Reserved" onSort={() => setSort('reserved')} />
        <HeaderCell label="Value, DCC" />
        <HeaderCell label="Price, DCC" />
        <HeaderCell label="24h Change" />
        <Box />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {visible.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center' }}>
            {search ? `No asset matches “${search}”.` : 'This wallet holds no assets yet.'}
          </Typography>
        )}

        {visible.map((row) => {
          const hue = t.appTile[hueFor(row.assetId)];
          const isHidden = hidden.has(row.assetId);

          return (
            <Box
              key={row.assetId}
              role="button"
              tabIndex={0}
              aria-label={`Asset info for ${row.name}`}
              onClick={() => onSelect(row)}
              onKeyDown={(event) => {
                // A div carrying a button role has to answer to the keys a real
                // button answers to.
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(row);
                }
              }}
              sx={{
                '&:hover': { bgcolor: 'action.hover' },
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                display: 'grid',
                gap: 2,
                gridTemplateColumns: GRID,
                opacity: isHidden ? 0.45 : 1,
                px: 2,
                py: 1.5,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  alignItems: 'center',
                  bgcolor: hue.fill,
                  borderRadius: '50%',
                  color: hue.on,
                  display: 'flex',
                  fontSize: 13,
                  fontWeight: 700,
                  height: 34,
                  justifyContent: 'center',
                  width: 34,
                }}
              >
                {row.name.slice(0, 1).toUpperCase()}
              </Box>

              <Typography variant="body2" noWrap title={row.assetId}>
                {row.name}
              </Typography>

              <Tooltip title={row.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  {compact(row.amount)}
                </Typography>
              </Tooltip>

              <Typography variant="body2" sx={{ textAlign: 'right' }}>
                {compact(row.reserved)}
              </Typography>

              {/*
                Value, price and change need a market for the asset. Nothing
                here fetches one yet, and a zero would read as "worthless"
                rather than "unpriced".
              */}
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                —
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                —
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                —
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Tooltip title={`Send ${row.name}`}>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSend(row);
                    }}
                    aria-label={`Send ${row.name}`}
                  >
                    <KeyboardArrowUp fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Receive ${row.name}`}>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onReceive(row);
                    }}
                    aria-label={`Receive ${row.name}`}
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Trade">
                  <span>
                    <IconButton size="small" disabled aria-label={`Trade ${row.name}`}>
                      <ShowChart fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isHidden ? 'Show asset' : 'Hide asset'}>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleHidden(row.assetId);
                    }}
                    aria-label={isHidden ? `Show ${row.name}` : `Hide ${row.name}`}
                  >
                    <VisibilityOff fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More">
                  <span>
                    <IconButton size="small" disabled aria-label={`More actions for ${row.name}`}>
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
