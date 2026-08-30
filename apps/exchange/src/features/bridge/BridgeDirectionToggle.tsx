/**
 * Which way the transfer runs.
 *
 * Two states, both named for what they do rather than "deposit"/"withdraw" —
 * the asset names say which chain you end up on, which is the thing people
 * actually check before signing.
 */
import { ArrowForward } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';

export type BridgeDirection = 'deposit' | 'redeem';

interface BridgeDirectionToggleProps {
  onChange: (direction: BridgeDirection) => void;
  tokenName: string;
  value: BridgeDirection;
}

export const BridgeDirectionToggle: React.FC<BridgeDirectionToggleProps> = ({
  onChange,
  tokenName,
  value,
}) => {
  const options: { direction: BridgeDirection; from: string; to: string }[] = [
    { direction: 'deposit', from: tokenName, to: `${tokenName}.DCC` },
    { direction: 'redeem', from: `${tokenName}.DCC`, to: tokenName },
  ];

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        display: 'grid',
        gap: 1,
        gridTemplateColumns: '1fr 1fr',
        p: 1,
      }}
    >
      {options.map((option) => {
        const active = value === option.direction;
        return (
          <Box
            key={option.direction}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onClick={() => onChange(option.direction)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onChange(option.direction);
            }}
            sx={{
              '&:hover': { bgcolor: active ? 'primary.main' : 'action.hover' },
              alignItems: 'center',
              bgcolor: active ? 'primary.main' : 'transparent',
              borderRadius: 1.5,
              color: active ? 'primary.contrastText' : 'text.primary',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              py: 1.5,
              transition: 'background-color 120ms',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600 }}>{option.from}</Typography>
              <ArrowForward sx={{ fontSize: 18 }} />
              <Typography sx={{ fontWeight: 600 }}>{option.to}</Typography>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
};
