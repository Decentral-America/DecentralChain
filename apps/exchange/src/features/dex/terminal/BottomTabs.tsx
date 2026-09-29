import { Box, ButtonBase, useTheme } from '@mui/material';
import { useState } from 'react';
import { TerminalOrdersTable } from '@/features/dex/TerminalOrdersTable';
import { TradeHistory } from '@/features/dex/TradeHistory';
import { tokens } from '@/theme/tokens/semantic';
import { BalancePanel } from './BalancePanel';
import { direction, MONO, REDUCED, T_FAST, TABS_H } from './terminalTokens';

const TABS = [
  { key: 'open', label: 'Open orders' },
  { key: 'orders', label: 'Order history' },
  { key: 'trades', label: 'Trade history' },
  { key: 'balance', label: 'Balance' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** The history strip under the chart. */
export function BottomTabs() {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const dir = direction(theme);
  const [tab, setTab] = useState<TabKey>('open');

  return (
    <Box
      style={{ '--dir-down': dir.down, '--dir-up': dir.up, '--mono': MONO } as React.CSSProperties}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <Box
        role="tablist"
        sx={{
          alignItems: 'stretch',
          borderBottom: `1px solid ${t.border.subtle}`,
          display: 'flex',
          flexShrink: 0,
          height: TABS_H,
          px: 1,
        }}
      >
        {TABS.map((x) => {
          const on = x.key === tab;
          return (
            <ButtonBase
              key={x.key}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(x.key)}
              sx={{
                '&::after': {
                  [REDUCED]: { transition: 'none' },
                  bgcolor: t.accent.primary,
                  borderRadius: '2px 2px 0 0',
                  bottom: 0,
                  content: '""',
                  height: 2,
                  left: 12,
                  opacity: on ? 1 : 0,
                  position: 'absolute',
                  right: 12,
                  transform: on ? 'scaleX(1)' : 'scaleX(0.4)',
                  transition: `opacity ${T_FAST}, transform ${T_FAST}`,
                },
                '&:hover': { color: t.text.primary },
                [REDUCED]: { transition: 'none' },
                color: on ? t.text.primary : t.text.secondary,
                fontSize: 13,
                fontWeight: on ? 600 : 500,
                position: 'relative',
                px: 1.5,
                transition: `color ${T_FAST}`,
              }}
            >
              {x.label}
            </ButtonBase>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        {tab === 'open' && <TerminalOrdersTable scope="open" />}
        {tab === 'orders' && <TerminalOrdersTable scope="history" />}
        {tab === 'trades' && <TradeHistory compact />}
        {tab === 'balance' && <BalancePanel />}
      </Box>
    </Box>
  );
}
