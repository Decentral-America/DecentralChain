import { Box, ButtonBase, Tooltip, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { tokens } from '@/theme/tokens/semantic';
import { alpha, REDUCED, T_FAST } from './terminalTokens';

/**
 * A segmented control: a sunken track, one raised segment.
 *
 * The same shape the shell's top tabs use, so a reader who has learnt what
 * "selected" looks like up there does not have to learn it again down here.
 * Feedback is on pointer-down (`:active`), not on release.
 */
export function Segmented<V extends string>({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: V) => void;
  options: ReadonlyArray<{ label: ReactNode; title?: string; value: V }>;
  value: V;
}) {
  const t = tokens(useTheme().palette.mode);
  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      sx={{
        alignItems: 'center',
        bgcolor: t.surface.sunken,
        borderRadius: '9px',
        display: 'inline-flex',
        flexShrink: 0,
        gap: '2px',
        p: '3px',
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        const btn = (
          <ButtonBase
            key={o.value}
            role="radio"
            aria-checked={selected}
            aria-label={o.title}
            onClick={() => onChange(o.value)}
            sx={{
              '&:active': { transform: 'scale(0.97)' },
              '&:hover': { color: t.text.primary },
              [REDUCED]: { transition: 'none' },
              bgcolor: selected ? t.surface.raised : 'transparent',
              borderRadius: '7px',
              boxShadow: selected
                ? `0 1px 2px ${alpha(t.surface.sunken, 0.5)}, inset 0 0 0 1px ${t.border.subtle}`
                : 'none',
              color: selected ? t.text.primary : t.text.secondary,
              fontSize: 12,
              fontWeight: selected ? 600 : 500,
              height: 26,
              letterSpacing: '0.01em',
              minWidth: 28,
              px: 0.875,
              transition: `background-color ${T_FAST}, color ${T_FAST}, transform 100ms ease-out`,
            }}
          >
            {o.label}
          </ButtonBase>
        );
        return o.title ? (
          <Tooltip key={o.value} title={o.title} enterDelay={600}>
            {btn}
          </Tooltip>
        ) : (
          btn
        );
      })}
    </Box>
  );
}
