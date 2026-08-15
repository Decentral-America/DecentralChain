/**
 * Swap Page
 *
 * One column, one card, one screen.
 *
 * The page used to spend a third of its width on three marketing cards — Best
 * Rates, Instant Swaps, Secure Trading — pitched at someone who had already
 * signed in, created a wallet and navigated here. That column was 663px of
 * persuasion aimed at the converted, and it was the reason a form that fits the
 * viewport made the page scroll.
 *
 * What is left is the tool, centred, at a width a form should be. And because
 * swapping is not live yet, the notice comes before the form rather than
 * underneath it: the surface is a preview, held inert, not something to fill in
 * and then be refused.
 */

import { History, KeyboardArrowDown, Settings, SwapVert } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { PageFrame } from '@/layouts/PageFrame';
import { palette, radii } from '@/styles/tokens';
import { landingTheme } from '@/theme/landingTheme';

/** One side of the trade: the asset picker, the amount, and what it is worth. */
function TokenField({
  label,
  symbol,
  markColor,
  balance,
}: {
  label: string;
  symbol: string;
  /** The asset's own brand colour — the one place native hues are kept. */
  markColor: string;
  balance: string;
}) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          bgcolor: palette.mist,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: radii.cards,
          p: 2,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button
            variant="outlined"
            endIcon={<KeyboardArrowDown />}
            sx={{ borderColor: 'divider', justifyContent: 'space-between', minWidth: 132 }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: markColor, height: 22, width: 22 }}>{symbol.charAt(0)}</Avatar>
              <Typography sx={{ fontWeight: 400 }}>{symbol}</Typography>
            </Stack>
          </Button>
          <TextField
            fullWidth
            placeholder="0.00"
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
              },
            }}
            sx={{
              '& .MuiInputBase-input': { fontSize: '1.75rem', fontWeight: 300, textAlign: 'right' },
            }}
          />
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            ≈ $0.00
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Balance: {balance}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

/** A line of the rate summary. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 400 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export const Swap: React.FC = () => {
  return (
    <ThemeProvider theme={landingTheme}>
      <PageFrame
        fit
        title="Swap"
        subtitle="Exchange one asset for another at the best available rate."
      >
        <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 3, minHeight: 0 }}>
          <ComingSoon
            title="Swapping is not live yet"
            description="The form below is a preview of the routing interface and cannot be submitted. Orders can be placed against the live order book on Trade in the meantime."
          >
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: radii.cards,
                // A form is a column of controls; past ~560px the fields grow
                // wider than they are useful and the card stops reading as one.
                maxWidth: 560,
                mx: 'auto',
                p: 3,
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 300 }}>
                  Swap tokens
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" aria-label="Swap history">
                    <History />
                  </IconButton>
                  <IconButton size="small" aria-label="Swap settings">
                    <Settings />
                  </IconButton>
                </Stack>
              </Stack>

              <TokenField label="From" symbol="DCC" markColor="#8A63D2" balance="0.00 DCC" />

              {/* Overlaps both fields, so the pair reads as one control. */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  my: -1.25,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <IconButton
                  aria-label="Reverse direction"
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <SwapVert />
                </IconButton>
              </Box>

              <TokenField label="To" symbol="USDT" markColor="#F7931A" balance="0.00 USDT" />

              <Paper
                elevation={0}
                sx={{
                  bgcolor: palette.periwinkleWash,
                  borderRadius: radii.cards,
                  mt: 2,
                  p: 2,
                }}
              >
                <Stack spacing={0.75}>
                  <DetailRow label="Exchange rate" value="1 DCC = 0.00 USDT" />
                  <DetailRow label="Price impact" value="< 0.01%" />
                  <DetailRow label="Network fee" value="~0.005 DCC" />
                </Stack>
              </Paper>

              <Button variant="contained" size="large" fullWidth disabled sx={{ mt: 2, py: 1.5 }}>
                Swap unavailable
              </Button>
            </Paper>
          </ComingSoon>
        </Box>
      </PageFrame>
    </ThemeProvider>
  );
};
