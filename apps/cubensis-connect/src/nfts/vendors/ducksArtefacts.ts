// NOTE: This vendor integrates with wavesducks.com (third-party NFT project)
import {
  type CreateParams,
  type FetchInfoParams,
  type NftAssetDetail,
  type NftVendor,
  NftVendorId,
} from '../types';

const DUCKS_ARTEFACTS_DAPP = '3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR';

interface DucksArtefactsNftInfo {
  id: string;
  vendor: NftVendorId.DucksArtefact;
}

export class DucksArtefactsNftVendor implements NftVendor<DucksArtefactsNftInfo> {
  id = NftVendorId.DucksArtefact as const;

  is(nft: NftAssetDetail) {
    return nft.issuer === DUCKS_ARTEFACTS_DAPP;
  }

  fetchInfo({ nfts }: FetchInfoParams) {
    return nfts.map(
      (nft): DucksArtefactsNftInfo => ({
        id: nft.assetId,
        vendor: NftVendorId.DucksArtefact,
      }),
    );
  }

  create({ asset }: CreateParams<DucksArtefactsNftInfo>) {
    const name = asset.name.toLowerCase().replace(/-/, '_');

    return {
      background: { backgroundColor: '#e6d4ef' },
      creator: asset.issuer,
      description: DUCK_ARTEFACTS_INFO[name]?.description,
      displayCreator: 'Ducks Artefacts',
      displayName: DUCK_ARTEFACTS_INFO[name]?.title || asset.name,
      foreground: `https://wavesducks.com/api/v1/images/${asset.name}.svg`,
      id: asset.id,
      marketplaceUrl: `https://wavesducks.com/item/${asset.id}`,
      name: asset.name,
      vendor: NftVendorId.DucksArtefact,
    };
  }
}

const DUCK_ARTEFACTS_INFO: Partial<Record<string, { title: string; description: string }>> = {
  art_bighouse: {
    description:
      'This artefact not only will boost the productivity of 10 ducks by 15% but will also serve as 10 free perches.',
    title: 'Mega Duck House',
  },
  art_cape: {
    description: 'Can be worn by a duck. Looks enchanted but has no magic powers.',
    title: 'Magic Cape',
  },
  art_customduck: {
    description:
      'We will design a duck according to your portrait or other provided references. Your custom duck will have a status of jackpot and a 100% rarity.',
    title: 'Custom Jackpot Duck',
  },
  art_fixgene: {
    description:
      "Allows you to manually select which parent's gene will be selected for a given trait when breeding. Single-use.",
    title: 'Breeding Vaccine',
  },
  art_freegene: {
    description:
      'When breeding, add a random gene of a genesis duck that can no longer be hatched. Single-use.',
    title: 'Lost Duck Gene',
  },
  art_hat: {
    description:
      'Can be worn by a duck. Driver’s life is a harsh one but at least you’ve got a fancy duck.',
    title: 'Quacker Hat',
  },
  art_house: {
    description: 'This artefact allows you to boost the productivity of 4 selected ducks by 30%',
    title: 'Duck House',
  },
  art_lake: {
    description: '+2% to the productivity of all ducks on the farm. Can be toggled on or off.',
    title: 'Lake',
  },
  art_mirror: {
    description:
      'Single-use\n\nCreate an exact copy of any duck older than the Genesis generation. It gets a new number, refreshed achievements and drops the initial rarity. Cannot be used on Genesis ducks or Jackpots.',
    title: 'Splitting Mirror',
  },
  art_pomp: {
    description:
      'Single-use\n\nReplaces a hair gene of a chosen duck and can give it up to 100% rarity. The duck gets a new number and refreshed achievements. Can be used only on sterile ducks. Cannot be used on Genesis ducks or Jackpots.',
    title: 'Pompadour',
  },
  art_xhat: {
    description:
      'Single-use\n\nAdds a new unique gene to your duck and can give it a rarity up to 100%. Gives a special card in Duck Wars. The duck also gets a new number and refreshed achievements. Can be used only on sterile ducks. Cannot be used on Genesis ducks or Jackpots.',
    title: 'X-mas Hat',
  },
  art_xmistl: {
    description: 'Reusable\n\nGives 10% discount on perches of all colors.',
    title: 'Mistletoe',
  },
  art_xscarf: {
    description: '+69% to a farming power of one duck',
    title: 'X-mas Scarf',
  },
  art_xsock: {
    description: 'Earned duckling feed limit is increased by 200%. Can be toggled on or off.',
    title: 'X-mas Sock',
  },
  art_xsweater: {
    description:
      'Put on a duck on farming and it will be able to farm and take part in the Duck Wars simultaneously',
    title: 'X-mas Sweater',
  },
  art_xtree: {
    description: '+3% to the productivity of all ducks on the farm. Can be toggled on or off.',
    title: 'X-mas Tree',
  },
};
