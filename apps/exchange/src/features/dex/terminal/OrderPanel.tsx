import { UnfoldLess, UnfoldMore } from '@mui/icons-material';
import { Box, ButtonBase, Tooltip, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { BuyOrderForm } from '@/features/dex/BuyOrderForm';
import { SellOrderForm } from '@/features/dex/SellOrderForm';
import { tokens } from '@/theme/tokens/semantic';
import { alpha, direction, MONO, REDUCED, T_BASE, T_FAST } from './terminalTokens';

type Side = 'buy' | 'sell';

/**
 * Order entry.
 *
 * The two forms carry a thousand lines of order construction and signing that
 * work; this is a surface over them, not a rewrite. The forms expose three
 * `data-slot` hooks — header, quick, submit — and everything else is left to
 * them. There is no market/limit switch because the matcher takes limit orders
 * only; a switch that did nothing would be the first lie on the screen.
 */
export function OrderPanel({
  onResize,
  share,
}: {
  /** Sets the ticket's share of the column, in tenths (4–8). */
  onResize: (share: number) => void;
  share: number;
}) {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const dir = direction(theme);
  const [side, setSide] = useState<Side>('buy');
  const isBuy = side === 'buy';
  const tone = isBuy ? dir.up : dir.down;
  const onTone = isBuy ? dir.onUp : dir.onDown;

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, pt: 1, px: 1.25 }}>
        <Box
          role="tablist"
          aria-label="Order side"
          sx={{
            bgcolor: t.surface.sunken,
            borderRadius: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            p: '3px',
            position: 'relative',
          }}
        >
          {/* The thumb moves; the labels do not. One transform, compositor only. */}
          <Box
            aria-hidden="true"
            sx={{
              [REDUCED]: { transition: 'none' },
              bgcolor: tone,
              borderRadius: '8px',
              bottom: 3,
              left: 3,
              position: 'absolute',
              top: 3,
              transform: isBuy ? 'translateX(0)' : 'translateX(100%)',
              transition: `transform ${T_BASE}, background-color ${T_BASE}`,
              width: 'calc(50% - 3px)',
            }}
          />
          {(['buy', 'sell'] as const).map((s) => {
            const on = s === side;
            return (
              <ButtonBase
                key={s}
                role="tab"
                aria-selected={on}
                onClick={() => setSide(s)}
                sx={{
                  '&:active': { transform: 'scale(0.98)' },
                  [REDUCED]: { transition: 'none' },
                  borderRadius: '8px',
                  color: on ? onTone : t.text.secondary,
                  fontSize: 13,
                  fontWeight: 700,
                  height: 30,
                  letterSpacing: '0.06em',
                  position: 'relative',
                  transition: `color ${T_FAST}, transform 100ms ease-out`,
                  zIndex: 1,
                }}
              >
                {s.toUpperCase()}
              </ButtonBase>
            );
          })}
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            mt: 0.75,
            px: 0.25,
          }}
        >
          <Typography
            sx={{
              color: t.text.tertiary,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Limit order
          </Typography>
          {/*
            Two steps, not a drag handle: the split has four useful positions
            and a 1px gutter between two scroll regions is a poor drag target.
            Each press moves one tenth and the state is what persists.
          */}
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {(
              [
                ['Smaller ticket', <UnfoldLess key="s" sx={{ fontSize: 15 }} />, -1, share <= 4],
                ['Larger ticket', <UnfoldMore key="l" sx={{ fontSize: 15 }} />, 1, share >= 8],
              ] as const
            ).map(([label, icon, delta, disabled]) => (
              <Tooltip enterDelay={600} key={label} title={label}>
                <Box component="span">
                  <ButtonBase
                    aria-label={label}
                    disabled={disabled}
                    onClick={() => onResize(share + delta)}
                    sx={{
                      '&:active': { transform: 'scale(0.94)' },
                      '&:hover': { bgcolor: t.surface.hover, color: t.text.primary },
                      [REDUCED]: { transition: 'none' },
                      borderRadius: '6px',
                      color: t.text.tertiary,
                      height: 22,
                      opacity: disabled ? 0.35 : 1,
                      transition: `background-color ${T_FAST}, transform 100ms ease-out`,
                      width: 22,
                    }}
                  >
                    {icon}
                  </ButtonBase>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        data-side={side}
        // The forms are styled-components and cannot read this file's `tone`.
        // Two custom properties carry it across the boundary.
        style={{ '--dir-on': onTone, '--dir-side': tone } as React.CSSProperties}
        sx={{
          // The field: 34px tall, mono, its label riding the border.
          '& .MuiFormControl-root, & .MuiTextField-root': { width: '100%' },
          '& .MuiInputBase-input': {
            fontFamily: MONO,
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
            px: 1.25,
            py: 0.75,
          },
          '& .MuiInputLabel-root': { fontSize: 12 },
          '& .MuiOutlinedInput-root': { borderRadius: '9px' },
          // One compact scale for the whole form. The panel is a dense
          // instrument, not a page: 12–13px labels, 34px fields, 6px rhythm.
          // Everything below is a size, not a colour — the forms keep their own.
          '& [data-slot="header"]': { display: 'none' },
          '& [data-slot="info"]': {
            '& > *:last-child': { fontFamily: MONO, fontVariantNumeric: 'tabular-nums' },
            alignItems: 'center',
            bgcolor: 'transparent',
            borderRadius: 0,
            borderTop: `1px solid ${t.border.subtle}`,
            display: 'flex',
            fontSize: 12,
            justifyContent: 'space-between',
            minHeight: 24,
            mt: 0,
            px: 0.25,
            py: 0,
          },
          '& [data-slot="max"]': {
            [REDUCED]: { transition: 'none' },
            bgcolor: t.accent.muted,
            border: 'none',
            borderRadius: '6px',
            color: t.accent.primary,
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            mt: -0.5,
            px: 0.75,
            py: '2px',
            transition: `background-color ${T_FAST}`,
          },
          '& [data-slot="quick"]': { gap: '4px' },
          '& [data-slot="quick"] button': {
            [REDUCED]: { transition: 'none' },
            borderRadius: '7px',
            fontFamily: MONO,
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            py: '3px',
            transition: `background-color ${T_FAST}, color ${T_FAST}`,
          },
          '& [data-slot="submit"]': {
            '&:active': { transform: 'scale(0.985)' },
            '&:hover': { bgcolor: tone, filter: 'brightness(1.06)' },
            [REDUCED]: { transition: 'none' },
            bgcolor: tone,
            borderRadius: '9px',
            boxShadow: `0 6px 18px ${alpha(tone, 0.26)}`,
            color: onTone,
            fontSize: 13.5,
            fontWeight: 700,
            height: 38,
            letterSpacing: '0.01em',
            mt: 0.75,
            textTransform: 'none',
            transition: `background-color ${T_BASE}, box-shadow ${T_BASE}, transform 100ms ease-out`,
            width: '100%',
          },
          '& form': { display: 'flex', flexDirection: 'column', gap: '5px' },
          // The form's own vertical rhythm, halved.
          '& form > *': { marginTop: 0 },
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          pb: 1.25,
          pt: 0.75,
          px: 1.25,
        }}
      >
        {isBuy ? <BuyOrderForm /> : <SellOrderForm />}
      </Box>
    </Box>
  );
}
