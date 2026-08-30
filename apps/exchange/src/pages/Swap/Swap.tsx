/**
 * Swap — the DCC AMM.
 *
 * Six views over one protocol. Trading and liquidity read the contracts
 * directly through `@dcc-amm/sdk`; Pools and Explore also read the indexer,
 * because volume, fees and swap counts are history and a chain cannot be
 * asked for history.
 *
 * The tab row is the page's only navigation and carries an icon per
 * destination — a name plus a glyph is faster to re-find than either alone,
 * and these six get switched between constantly.
 */
import {
  AccountCircleOutlined,
  AddOutlined,
  DashboardOutlined,
  PlayCircleOutlined,
  SwapHorizOutlined,
  WalletOutlined,
} from '@mui/icons-material';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ExplorePanel } from '@/features/swap/ExplorePanel';
import { LiquidityPanel } from '@/features/swap/LiquidityPanel';
import { MyPoolsPanel } from '@/features/swap/MyPoolsPanel';
import { PoolsPanel } from '@/features/swap/PoolsPanel';
import { SwapPanel } from '@/features/swap/SwapPanel';
import { PageFrame } from '@/layouts/PageFrame';

type SwapTab = 'explore' | 'liquidity' | 'my-pools' | 'pools' | 'portfolio' | 'swap';

const TABS: { icon: React.ReactElement; label: string; value: SwapTab }[] = [
  { icon: <SwapHorizOutlined />, label: 'Swap', value: 'swap' },
  { icon: <AddOutlined />, label: 'Liquidity', value: 'liquidity' },
  { icon: <DashboardOutlined />, label: 'Pools', value: 'pools' },
  { icon: <AccountCircleOutlined />, label: 'My Pools', value: 'my-pools' },
  { icon: <PlayCircleOutlined />, label: 'Explore', value: 'explore' },
  { icon: <WalletOutlined />, label: 'Portfolio', value: 'portfolio' },
];

export const Swap: React.FC = () => {
  const [tab, setTab] = useState<SwapTab>('swap');
  const navigate = useNavigate();

  /*
   * Portfolio is a page in its own right, not a panel. Listing it here keeps
   * the destination visible where people look for it; selecting it hands over
   * rather than rebuilding the page inside a tab.
   */
  useEffect(() => {
    if (tab === 'portfolio') {
      void navigate('/desktop/wallet/portfolio');
    }
  }, [navigate, tab]);

  return (
    <PageFrame title="Swap" subtitle="Trade against the on-chain automated market maker.">
      <Stack spacing={3}>
        <Tabs
          value={tab}
          onChange={(_e, value: SwapTab) => setTab(value)}
          variant="scrollable"
          scrollButtons={false}
          sx={{
            '@media (prefers-reduced-motion: reduce)': {
              '& .MuiTab-root': { transition: 'none' },
            },
            '& .Mui-selected': {
              bgcolor: 'action.selected',
              color: 'text.primary !important',
              fontWeight: 600,
            },
            '& .MuiTab-root': {
              '& .MuiSvgIcon-root': { fontSize: 17 },
              borderRadius: 1.5,
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 500,
              gap: 0.5,
              letterSpacing: '-0.005em',
              minHeight: 30,
              px: 1.25,
              textTransform: 'none',
              transition: 'background-color 120ms, color 120ms',
            },
            '& .MuiTabs-indicator': { display: 'none' },
            /*
             * Centred, and a quarter smaller: this is navigation between six
             * peers, not the page's headline. It should sit quietly above the
             * panel that holds the work.
             *
             * The scroller needs the centering too — `variant="scrollable"`
             * wraps the flex container in one, and centering only the inner
             * element leaves the row pinned left. Scrollable is kept so the
             * six still reach on a narrow window.
             */
            /*
             * The scroller needs vertical room, not just centering. A scroll
             * container clips its cross axis — `overflow-x: auto` forces
             * `overflow-y` to clip with it — so the selected tab's focus ring,
             * drawn outside the tab's own box, was sliced along the top and
             * bottom. Padding inside the list puts the ring within the
             * scrollable area rather than across its edge.
             *
             * The selector is `.MuiTabs-list` — MUI renamed it from
             * `.MuiTabs-flexContainer`, and the old name silently matches
             * nothing rather than erroring.
             */
            '& .MuiTabs-list': { alignItems: 'center', justifyContent: 'center', py: 1 },
            '& .MuiTabs-scroller': { display: 'flex', justifyContent: 'center' },
            minHeight: 46,
          }}
        >
          {TABS.map((entry) => (
            <Tab
              key={entry.value}
              value={entry.value}
              label={entry.label}
              icon={entry.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box>
          {tab === 'swap' && <SwapPanel />}
          {tab === 'liquidity' && <LiquidityPanel />}
          {tab === 'pools' && <PoolsPanel />}
          {tab === 'my-pools' && <MyPoolsPanel />}
          {tab === 'explore' && <ExplorePanel />}
        </Box>
      </Stack>
    </PageFrame>
  );
};
