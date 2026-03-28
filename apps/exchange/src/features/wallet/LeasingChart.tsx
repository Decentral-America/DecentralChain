/**
 * Leasing Donut Chart Component
 * Visualizes available, leased out, and leased in DCC balances
 * Uses @visx/shape Pie (<20 kB tree-shaken vs recharts ~500 kB d3 bundle)
 */

import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { useMemo } from 'react';

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

  const segments = useMemo(
    () => [
      {
        fill: theme.palette.primary.main,
        name: 'Available',
        value: availableDcc,
      },
      {
        fill: theme.palette.warning.light,
        name: 'Leased Out',
        value: leasedOutDcc,
      },
      {
        fill: theme.palette.info.light,
        name: 'Leased In',
        value: leasedInDcc,
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

  const totalDcc = segments.reduce((sum, s) => sum + s.value, 0);
  const hasBalance = totalDcc > 0;

  // When balance is zero show a placeholder ring so the donut is always visible
  const displayData = hasBalance
    ? segments
    : segments.map((s, i) => ({ ...s, value: i === 0 ? 1 : 0 }));

  // Fixed SVG dimensions — viewBox scales to fill container
  const svgSize = 280;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = 110;
  const innerR = 70;

  return (
    <Stack spacing={3} sx={{ height: '100%', position: 'relative' }}>
      <Typography variant="subtitle1" fontWeight={600}>
        DCC Distribution
      </Typography>
      <Box sx={{ flex: 1, maxWidth: 360, mx: 'auto', position: 'relative', width: '100%' }}>
        {/* SVG scales to parent width; height locked to aspectRatio via viewBox */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          width="100%"
          height={svgSize}
          aria-label="DCC balance distribution donut chart"
          role="img"
        >
          <Group top={cy} left={cx}>
            <Pie
              data={displayData}
              pieValue={(d) => d.value}
              outerRadius={outerR}
              innerRadius={innerR}
              padAngle={hasBalance ? 0.02 : 0}
            >
              {(pie) =>
                pie.arcs.map((arc) => (
                  <path
                    key={arc.data.name}
                    d={pie.path(arc) ?? ''}
                    fill={arc.data.fill}
                    stroke={theme.palette.background.paper}
                    strokeWidth={2}
                  />
                ))
              }
            </Pie>
          </Group>
        </svg>
        {/* Centre label overlay */}
        <Box
          sx={{
            left: '50%',
            pointerEvents: 'none',
            position: 'absolute',
            textAlign: 'center',
            top: '50%',
            transform: 'translate(-50%, -60%)',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            Total Balance
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {totalDcc.toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            DCC
          </Typography>
        </Box>
      </Box>
      <Stack
        direction={{ sm: 'row', xs: 'column' }}
        spacing={3}
        justifyContent="center"
        alignItems="center"
      >
        {segments.map((segment) => (
          <Stack direction="row" spacing={1} alignItems="center" key={segment.name}>
            <Box
              sx={{
                bgcolor: segment.fill,
                borderRadius: 1,
                height: 14,
                width: 14,
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
