/**
 * Leasing Donut Chart Component
 * Visualizes available, leased out, and leased in DCC balances
 * Uses Victory Charts (React 19 compatible)
 */
import { useMemo } from 'react';
import { VictoryContainer, VictoryPie as VictoryPieBase } from 'victory';

// React 19 type compatibility cast
const VictoryPie = VictoryPieBase as unknown as React.ComponentType<Record<string, unknown>>;

import { Box, Stack, Typography, useTheme } from '@mui/material';

interface LeasingChartProps {
  available: number; // Available DCC balance in wavelets
  leasedOut: number; // DCC leased out in wavelets
  leasedIn: number; // DCC leased in (received) in wavelets
}

const DCC_DECIMALS = 1e8;

export function LeasingChart({ available, leasedOut, leasedIn }: LeasingChartProps) {
  const theme = useTheme();

  // Convert wavelets to DCC (divide by 10^8)
  const availableDcc = available / DCC_DECIMALS;
  const leasedOutDcc = leasedOut / DCC_DECIMALS;
  const leasedInDcc = leasedIn / DCC_DECIMALS;

  // Memoize chart data to prevent unnecessary re-renders with Recharts
  const chartData = useMemo(
    () => [
      {
        name: 'Available',
        value: availableDcc,
        color: theme.palette.primary.main,
      },
      {
        name: 'Leased Out',
        value: leasedOutDcc,
        color: theme.palette.warning.light,
      },
      {
        name: 'Leased In',
        value: leasedInDcc,
        color: theme.palette.info.light,
      },
    ],
    [
      availableDcc,
      leasedOutDcc,
      leasedInDcc,
      theme.palette.info.light,
      theme.palette.primary.main,
      theme.palette.warning.light,
    ],
  );

  // Total balance = available + leased out (matches Angular)
  const totalDcc = chartData.reduce((sum, segment) => sum + segment.value, 0);
  const hasBalance = totalDcc > 0;

  const displayData = chartData.map((segment, index) => ({
    ...segment,
    value: hasBalance ? segment.value : index === 0 ? 1 : 0,
  }));

  return (
    <Stack spacing={3} sx={{ height: '100%', position: 'relative' }}>
      <Typography variant="subtitle1" fontWeight={600}>
        DCC Distribution
      </Typography>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 360, mx: 'auto' }}>
        <VictoryPie
          data={displayData}
          x="name"
          y="value"
          colorScale={displayData.map((segment) => segment.color)}
          innerRadius={hasBalance ? 80 : 90}
          labelRadius={120}
          labels={({ datum }: { datum: { value?: number; [key: string]: unknown } }) =>
            hasBalance && (datum.value as number) > 0
              ? `${Math.round(((datum.value as number) / totalDcc) * 100)}%`
              : ''
          }
          style={{
            labels: {
              fontFamily: theme.typography.fontFamily,
              fontSize: 14,
              fill: theme.palette.text.secondary,
            },
          }}
          padding={{ top: 20, bottom: 20, left: 20, right: 20 }}
          containerComponent={<VictoryContainer responsive />}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Total Balance
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {totalDcc.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            DCC
          </Typography>
        </Box>
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        justifyContent="center"
        alignItems="center"
      >
        {chartData.map((segment) => (
          <Stack direction="row" spacing={1} alignItems="center" key={segment.name}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: 1,
                bgcolor: segment.color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {segment.name}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
