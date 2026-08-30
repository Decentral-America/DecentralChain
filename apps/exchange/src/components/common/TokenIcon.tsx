/**
 * A token's mark.
 *
 * `cryptocurrency-icons` ships a real logo for six of the assets this bridge
 * carries; the rest — JitoSOL, Jupiter, PYTH, RNDR, BONK, PENGU — have none.
 * Those fall back to a hued monogram rather than a generic placeholder, so
 * every row still has something to recognise it by.
 *
 * The icons are imported statically and bundled. Pulling logos from a CDN
 * would mean an asset list that renders blank when that host is slow, and the
 * page's own `img-src` would have to widen to allow it.
 */
import { Box, useTheme } from '@mui/material';
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import rayIcon from 'cryptocurrency-icons/svg/color/ray.svg';
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import usdcIcon from 'cryptocurrency-icons/svg/color/usdc.svg';
import usdtIcon from 'cryptocurrency-icons/svg/color/usdt.svg';
import { APP_TILE_HUES, tokens } from '@/theme/tokens/semantic';

/**
 * DCC's own mark, which ships with the app rather than the icon package.
 * Two files because the mark is drawn for a light or a dark ground; picking
 * the wrong one leaves it invisible against its own background.
 */
const DCC_MARK = { dark: '/brand/mark-on-dark.png', light: '/brand/mark-on-light.png' };

/**
 * The API's `name` field to a bundled icon.
 *
 * Keyed on the name the API actually returns — "Bitcoin", not "BTC", and
 * "Ether", not "ETH". Matching on a ticker here would silently miss every one
 * of them, the same way a ticker-shaped blocklist did.
 */
const ICON_BY_NAME: Record<string, string> = {
  Bitcoin: btcIcon,
  Ether: ethIcon,
  Raydium: rayIcon,
  SOL: solIcon,
  USDC: usdcIcon,
  USDT: usdtIcon,
};

/** Stable hue per asset, hashed so it survives reordering. */
const hueFor = (seed: string): (typeof APP_TILE_HUES)[number] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return APP_TILE_HUES[hash % APP_TILE_HUES.length] as (typeof APP_TILE_HUES)[number];
};

interface TokenIconProps {
  name: string;
  /** Hashed for the fallback colour — the mint, so it is stable per asset. */
  seed?: string;
  size?: number;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ name, seed, size = 20 }) => {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const icon = name === 'DCC' ? DCC_MARK[mode] : ICON_BY_NAME[name];

  if (icon) {
    return (
      <Box
        component="img"
        src={icon}
        alt=""
        aria-hidden
        sx={{ borderRadius: '50%', display: 'block', height: size, width: size }}
      />
    );
  }

  const hue = t.appTile[hueFor(seed ?? name)];

  return (
    <Box
      aria-hidden
      sx={{
        alignItems: 'center',
        bgcolor: hue.fill,
        borderRadius: '50%',
        color: hue.on,
        display: 'flex',
        fontSize: size * 0.5,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        lineHeight: 1,
        width: size,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </Box>
  );
};
