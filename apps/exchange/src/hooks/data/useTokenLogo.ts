import { useEffect, useState } from 'react';
import { config } from '@/config';
import { loadManifest } from '@/lib/tokenLogos/load';
import { logoUrlFor } from '@/lib/tokenLogos/url';

/**
 * Resolves an asset id to a logo source, or `null` for "render the monogram".
 *
 * `null` is the value before the manifest resolves, which is deliberate: the
 * monogram paints immediately and a logo upgrades it when it arrives. Nothing
 * ever renders blank or spins.
 */
export function useTokenLogo(assetId?: string): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    const { logoRepo } = config;

    void loadManifest(logoRepo).then((manifest) => {
      if (cancelled) return;
      setSrc(manifest.hot[assetId] ?? logoUrlFor(logoRepo, manifest.sha, assetId));
    });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return src;
}
