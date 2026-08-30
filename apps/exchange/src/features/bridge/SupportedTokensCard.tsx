/**
 * Every asset the bridge accepts, grouped by what it is.
 *
 * The list comes from `GET /tokens`, already filtered of the assets that
 * report enabled but cannot succeed. Grouping is presentational — the API has
 * no category field — so it is derived from the token name and falls back to
 * "Ecosystem" for anything unrecognised rather than hiding it.
 */
import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { TokenIcon } from '@/components/common/TokenIcon';
import { useBridgeTokens } from '@/hooks/useBridgeTokens';
import { type BridgeToken } from '@/services/bridge/types';

const GROUPS: { match: (name: string) => boolean; title: string }[] = [
  { match: (n) => n === 'SOL', title: 'Native' },
  { match: (n) => ['USDC', 'USDT'].includes(n), title: 'Stablecoins' },
  { match: (n) => ['Bitcoin', 'cbBTC'].includes(n), title: 'Bitcoin' },
  { match: (n) => ['Ether', 'ETH'].includes(n), title: 'Ethereum' },
  { match: (n) => ['BONK', 'PENGU'].includes(n), title: 'Meme' },
];

interface SupportedTokensCardProps {
  onSelect?: (token: BridgeToken) => void;
  selectedMint?: string | null;
}

export const SupportedTokensCard: React.FC<SupportedTokensCardProps> = ({
  onSelect,
  selectedMint,
}) => {
  const { data: tokens, isLoading } = useBridgeTokens();

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Skeleton variant="text" width={180} />
        <Skeleton variant="rounded" height={40} sx={{ mt: 1.5 }} />
      </Paper>
    );
  }

  if (!tokens || tokens.length === 0) return null;

  const grouped = GROUPS.map((group) => ({
    title: group.title,
    tokens: tokens.filter((token) => group.match(token.name)),
  })).filter((group) => group.tokens.length > 0);

  const claimed = new Set(grouped.flatMap((g) => g.tokens.map((t) => t.splMint)));
  const rest = tokens.filter((token) => !claimed.has(token.splMint));
  if (rest.length > 0) grouped.push({ title: 'Ecosystem', tokens: rest });

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Supported Tokens
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          ({tokens.length})
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {grouped.map((group) => (
          <Box key={group.title}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                letterSpacing: '0.08em',
                mb: 1,
                textTransform: 'uppercase',
              }}
            >
              {group.title}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {group.tokens.map((token) => (
                <Chip
                  key={token.splMint}
                  icon={<TokenIcon name={token.name} seed={token.splMint} />}
                  label={token.name}
                  onClick={onSelect ? () => onSelect(token) : undefined}
                  variant={token.splMint === selectedMint ? 'filled' : 'outlined'}
                  color={token.splMint === selectedMint ? 'primary' : 'default'}
                  sx={{ '& .MuiChip-icon': { ml: 0, mr: 0.25 }, fontWeight: 500, pl: 0.75 }}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};
