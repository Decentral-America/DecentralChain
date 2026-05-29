import type { AssetDetail } from '#assets/types';

import type { NftConfig } from '../constants';
import type { Nft, NftAssetDetail } from './types';
import { NftVendorId } from './types';

// No NFT vendors are registered for DCC mainnet.
// All upstream Waves vendors (Ducks, Puzzle, SignArt) used hardcoded Waves
// mainnet DApp addresses that cannot exist on DCC's chain. They were removed
// as dead code. When DCC-native NFT projects launch, add vendors here.

export type NftInfo = Nft;

export async function fetchNftInfo(_nodeUrl: string, _nfts: NftAssetDetail[]) {
  return [] as NftInfo[];
}

export function createNft({
  asset,
  userAddress,
}: {
  asset: AssetDetail;
  config: NftConfig;
  info: NftInfo | undefined;
  userAddress: string;
}): Nft {
  return {
    creator: asset.issuer,
    description: asset.description,
    displayCreator: asset.issuer === userAddress ? 'My NFTs' : asset.issuer,
    displayName: asset.displayName,
    foreground: new URL('./unknown.svg', import.meta.url).toString(),
    id: asset.id,
    name: asset.name,
    vendor: NftVendorId.Unknown,
  };
}
