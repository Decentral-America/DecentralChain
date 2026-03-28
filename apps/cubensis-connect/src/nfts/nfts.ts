import type { AssetDetail } from '#assets/types';

import type { NftConfig } from '../constants';
import type { Nft, NftAssetDetail, NftVendor } from './types';
import { NftVendorId } from './types';
import { DucklingsNftVendor } from './vendors/ducklings';
import { DucksNftVendor } from './vendors/ducks';
import { DucksArtefactsNftVendor } from './vendors/ducksArtefacts';
import { PuzzleNftVendor } from './vendors/puzzle';
import { SignArtNftVendor } from './vendors/signArt';

const vendors = {
  [NftVendorId.DucksArtefact]: new DucksArtefactsNftVendor(),
  [NftVendorId.Ducklings]: new DucklingsNftVendor(),
  [NftVendorId.Ducks]: new DucksNftVendor(),
  [NftVendorId.SignArt]: new SignArtNftVendor(),
  [NftVendorId.Puzzle]: new PuzzleNftVendor(),
};

export type NftInfo = (typeof vendors)[keyof typeof vendors] extends NftVendor<infer T> ? T : never;

export async function fetchNftInfo(nodeUrl: string, nfts: NftAssetDetail[]) {
  const allNfts = await Promise.all(
    Object.values(vendors).map((vendor) =>
      vendor.fetchInfo({ nfts: nfts.filter(vendor.is), nodeUrl }),
    ),
  );

  return allNfts.flat();
}

export function createNft({
  asset,
  config,
  info,
  userAddress,
}: {
  asset: AssetDetail;
  config: NftConfig;
  info: NftInfo | undefined;
  userAddress: string;
}): Nft {
  const defaultNft: Nft = {
    creator: asset.issuer,
    description: asset.description,
    displayCreator: asset.issuer === userAddress ? 'My NFTs' : asset.issuer,
    displayName: asset.displayName,
    foreground: new URL('./unknown.svg', import.meta.url).toString(),
    id: asset.id,
    name: asset.name,
    vendor: NftVendorId.Unknown,
  };

  if (!info) return defaultNft;

  // Explicit switch on the discriminant field — TypeScript narrows `info` per branch,
  // eliminating the need for `as never` casts and giving full type safety.
  switch (info.vendor) {
    case NftVendorId.DucksArtefact:
      return vendors[NftVendorId.DucksArtefact].create({ asset, config, info });
    case NftVendorId.Ducklings:
      return vendors[NftVendorId.Ducklings].create({ asset, config, info });
    case NftVendorId.Ducks:
      return vendors[NftVendorId.Ducks].create({ asset, config, info });
    case NftVendorId.SignArt:
      return vendors[NftVendorId.SignArt].create({ asset, config, info });
    case NftVendorId.Puzzle:
      return vendors[NftVendorId.Puzzle].create({ asset, config, info });
    default:
      return defaultNft;
  }
}
