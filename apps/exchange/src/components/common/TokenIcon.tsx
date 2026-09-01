/**
 * A token's mark.
 *
 * `cryptocurrency-icons` ships a real logo for six of the assets this bridge
 * carries; the rest — JitoSOL, Jupiter, PYTH, RNDR, BONK, PENGU — have none.
 * Those fall back to a hued monogram rather than a generic placeholder, so
 * every row still has something to recognise it by.
 *
 * Bundled icons cover the bridge assets, which are keyed by the name the API
 * returns and have no DecentralChain asset id. Issued tokens are keyed by
 * asset id and resolve through the logo manifest. Two lookups, one component.
 *
 * The monogram paints first in every case, so a logo arriving late upgrades a
 * row rather than filling a hole. That is what makes lazily fetching the tail
 * acceptable here.
 *
 * Two CSP directives are involved, not one. `img-src 'self' data: https:`
 * already covers the <img> that renders a logo, but the manifest arrives by
 * `fetch()`, which is governed by `connect-src` — and that is an allowlist of
 * named hosts here, so `https://cdn.jsdelivr.net` had to be added to it
 * explicitly in all five shipped policies. `csp.test.ts` holds that open.
 */
import { Box, useTheme } from '@mui/material';
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg';
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg';
import rayIcon from 'cryptocurrency-icons/svg/color/ray.svg';
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg';
import usdcIcon from 'cryptocurrency-icons/svg/color/usdc.svg';
import usdtIcon from 'cryptocurrency-icons/svg/color/usdt.svg';
import { useState } from 'react';
import { useTokenLogo } from '@/hooks/data/useTokenLogo';
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
  /** DecentralChain asset id. Absent for bridge assets, which key on `name`. */
  assetId?: string;
  /**
   * Hashed for the fallback colour, when the identifier is not an `assetId` —
   * a Solana mint, say. A DCC asset id already seeds the hue through `assetId`,
   * so a call site holding one passes it once rather than as both props.
   */
  seed?: string;
  size?: number;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ name, assetId, seed, size = 20 }) => {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const remote = useTokenLogo(assetId);

  // A failure is per-asset: reset while rendering when `assetId` changes, so
  // a bad logo for one asset doesn't permanently stick this instance on the
  // monogram once it moves on to a different one. This is React's documented
  // pattern for adjusting state when a prop changes — no effect needed.
  const [priorAssetId, setPriorAssetId] = useState(assetId);
  const [remoteFailed, setRemoteFailed] = useState(false);
  if (assetId !== priorAssetId) {
    setPriorAssetId(assetId);
    setRemoteFailed(false);
  }

  const bundled = name === 'DCC' ? DCC_MARK[mode] : ICON_BY_NAME[name];
  const icon = bundled ?? (remoteFailed ? undefined : (remote ?? undefined));

  if (icon) {
    return (
      <Box
        component="img"
        src={icon}
        alt=""
        aria-hidden
        onError={() => setRemoteFailed(true)}
        sx={{ borderRadius: '50%', display: 'block', height: size, width: size }}
      />
    );
  }

  // `assetId` before `name`: a call site that passes an asset id gets the same
  // hue it got when that id was spelled `seed`, so wiring `assetId` through
  // recolours nothing. `name` is the last resort, for the bridge assets that
  // have neither.
  const hue = t.appTile[hueFor(seed ?? assetId ?? name)];

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
