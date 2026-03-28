// NOTE: This vendor integrates with wavesducks.com (third-party NFT project)
import type { CreateParams, FetchInfoParams, NftAssetDetail, NftVendor } from '../types';
import { NftVendorId } from '../types';
import { capitalize } from '../utils';

const DUCKS_DAPP_BREADER = '3PDVuU45H7Eh5dmtNbnRNRStGwULA7NY6Hb';
const DUCKS_DAPP_INCUBATOR = '3PEktVux2RhchSN63DsDo4b4mz4QqzKSeDv';
const DUCKS_DAPPS = [DUCKS_DAPP_BREADER, DUCKS_DAPP_INCUBATOR];

const displayCreatorByCreator: Record<string, string | undefined> = {
  [DUCKS_DAPP_BREADER]: 'Ducks Breeder',
  [DUCKS_DAPP_INCUBATOR]: 'Ducks Incubator',
};

interface DucksNftInfo {
  id: string;
  vendor: typeof NftVendorId.Ducks;
}

function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value == null) {
    throw new Error(message);
  }
}

function assetIdAsFloat(assetId: string): number {
  let i = 0;
  let hash = 0;
  if (!assetId) return 0;
  while (i < assetId.length) hash = (hash << 5) + hash + assetId.charCodeAt(i++);

  return Math.abs(((hash * 10) % 0x7fffffff) / 0x7fffffff);
}

export class DucksNftVendor implements NftVendor<DucksNftInfo> {
  id = NftVendorId.Ducks;

  is(nft: NftAssetDetail) {
    return DUCKS_DAPPS.includes(nft.issuer);
  }

  fetchInfo({ nfts }: FetchInfoParams) {
    return nfts.map(
      (nft): DucksNftInfo => ({
        id: nft.assetId,
        vendor: NftVendorId.Ducks,
      }),
    );
  }

  create({ asset }: CreateParams<DucksNftInfo>) {
    const [, genoType, generation] = asset.name.split('-');
    assertDefined(genoType, 'Expected genoType in duck asset name');
    assertDefined(generation, 'Expected generation in duck asset name');
    const duckNameEntry = DUCK_NAMES[genoType];

    return {
      background: {
        backgroundColor: generation[1] && `#${DUCK_COLORS[generation[1]]}`,
        backgroundImage:
          genoType === 'WWWWLUCK'
            ? 'url("https://wavesducks.com/ducks/pokras-background.svg")'
            : undefined,
      },

      creator: asset.issuer,
      displayCreator: displayCreatorByCreator[asset.issuer],

      displayName: `${capitalize(
        (generation[0] && DUCK_GENERATION_NAMES[generation[0]]) ?? generation[0] ?? '',
      )} ${capitalize(
        duckNameEntry
          ? Array.isArray(duckNameEntry)
            ? undefined
            : duckNameEntry.name
          : genoType
              .split('')
              .map((gene, index) => {
                const genes = DUCK_NAMES[gene];

                return Array.isArray(genes) ? genes[index] : undefined;
              })
              .join('')
              .toLowerCase(),
      )}`,

      foreground:
        `https://wavesducks.com/api/v1/ducks/${genoType}.svg` +
        `?color=${generation[1]}` +
        `&druck=${
          genoType.indexOf('I') !== -1 ? (assetIdAsFloat(asset.id) > 0.5 ? '1' : '2') : null
        }`,

      id: asset.id,
      marketplaceUrl: `https://wavesducks.com/duck/${asset.id}`,
      name: asset.name,
      vendor: NftVendorId.Ducks,
    };
  }
}

const DUCK_COLORS: Partial<Record<string, string>> = {
  B: 'ADD8E6',
  G: 'D9F6B3',
  R: 'FFA07A',
  U: 'CD6F86',
  Y: 'F8EE9D',
};

const DUCK_GENERATION_NAMES: Partial<Record<string, string>> = {
  G: 'Genesis',
  H: 'Hero',
  I: 'Ideal',
  J: 'Jackpot',
  K: 'Knight',
  L: 'Lord',
  M: 'Magical',
  N: 'Natural',
  O: 'Obstinate',
};

const DUCK_NAMES: Partial<Record<string, { name: string; unique?: boolean } | string[]>> = {
  A: ['e', 'l', 'o', 'n', 'n', 'o', 'l', 'e'],
  AAAAAAAA: { name: 'Elon' },
  B: ['s', 'a', 't', 'o', 's', 'h', 'i', 't'],
  BBBBBBBB: { name: 'Satoshi' },
  C: ['d', 'o', 'g', 'e', 'e', 'g', 'o', 'd'],
  CCCCCCCC: { name: 'Doge' },
  D: ['b', 'o', 'g', 'd', 'a', 'n', 'o', 'f'],
  DDDDDDDD: { name: 'Bogdanoff' },
  E: ['c', 'h', 'a', 'd', 'a', 'd', 'c', 'h'],
  EEEEEEEE: { name: 'Chad' },
  F: ['h', 'a', 'r', 'o', 'l', 'd', '', ''],
  FFFFFFFF: { name: 'Harold' },
  G: ['p', 'e', 'p', 'e', 'p', 'e', 'p', 'e'],
  GGGGGGGG: { name: 'Pepe' },
  H: ['e', 'l', ' ', 'r', 'i', 's', 'i', 'tas'],
  HHHHHHHH: { name: 'El Risitas' },
  I: ['d', 'r', 'u', 'c', 'k', 'j', 'e', 'nya'],
  IIIIIIII: { name: 'Druck' },
  K: ['dr', 'a', 'm', 'a', ' ', 'q', 'ue', 'en'],
  KKKKKKKK: { name: 'Drama Queen' },
  S: ['Cool '],
  T: ['Xmax '],
  W: ['S', 'a', 's', 'h', 'a', 'g', 'o', 'd'],
  WAWWDIMA: { name: 'Dima Ivanov', unique: true },
  WWAMAHER: { name: 'Maher Coleman', unique: true },
  WWBMAHER: { name: 'Maher Coleman', unique: true },
  WWCMAHER: { name: 'Maher Coleman', unique: true },
  WWDMAHER: { name: 'Maher Coleman', unique: true },
  WWEMAHER: { name: 'Maher Coleman', unique: true },
  WWFMAHER: { name: 'Maher Coleman', unique: true },
  WWGMAHER: { name: 'Maher Coleman', unique: true },
  WWHMAHER: { name: 'Maher Coleman', unique: true },
  WWIMAHER: { name: 'Maher Coleman', unique: true },
  WWJOSEPH: { name: 'Joseph Madara', unique: true },
  WWPUZZLE: { name: 'Puzzle Duck', unique: true },
  WWSPORTY: { name: 'Sporty Duck', unique: true },
  WWTURTLE: { name: 'Black Turtle', unique: true },
  WWWAVTWO: { name: 'Muscle Doge', unique: true },
  WWWBVTWO: { name: 'Muscle Doge', unique: true },
  WWWCUPID: { name: 'Cupiduck', unique: true },
  WWWCVTWO: { name: 'Muscle Doge', unique: true },
  WWWDAISY: { name: 'Daisy', unique: true },
  WWWDASHA: { name: 'Dasha The Queen ❤️', unique: true },
  WWWDVTWO: { name: 'Muscle Doge', unique: true },
  WWWEVTWO: { name: 'Muscle Doge', unique: true },
  WWWFVTWO: { name: 'Muscle Doge', unique: true },
  WWWGVTWO: { name: 'Muscle Doge', unique: true },
  WWWHVTWO: { name: 'Muscle Doge', unique: true },
  WWWIGNAT: { name: 'Ignat Golovatyuk', unique: true },
  WWWIVTWO: { name: 'Muscle Doge', unique: true },
  WWWJVTWO: { name: 'Muscle Doge', unique: true },
  WWWNACHO: { name: 'Nacho', unique: true },
  WWWSQUID: { name: 'DuckSquid', unique: true },
  WWWWANNA: { name: 'Anna Nifontova ', unique: true },
  WWWWBALL: { name: 'Quarterduck', unique: true },
  WWWWHELL: { name: 'Deaduck', unique: true },
  WWWWLUCK: { name: 'LUCK & WISDOM', unique: true },
  WWWWMARG: { name: 'Margaret Hamilton', unique: true },
  WWWWRIKY: { name: 'Riky', unique: true },
  WWWWSXSR: { name: 'Spencer X', unique: true },
  WWWWVOVA: { name: 'Vladimir Zhuravlev', unique: true },
  WWWWWASH: { name: 'Punk Ash', unique: true },
  WWWWWSX2: { name: 'BABY BOOMER', unique: true },
  WWWWWSX3: { name: 'Spencer Z', unique: true },
  WWWWWSX4: { name: 'Spencer Y', unique: true },
  WWWWWWW1: { name: 'Joel Bad Crypto', unique: true },
  WWWWWWW2: { name: 'Travis Bad Crypto', unique: true },
  WWWWWWWF: { name: 'Forklog', unique: true },
  WWWWWWWM: { name: 'Mani', unique: true },
  WWWWWWWP: { name: 'Phoenix', unique: true },
  WWWWWWWS: { name: 'Swop Punk', unique: true },
  WWWWWWWW: { name: 'Sasha', unique: true },
  WWWWWYAN: { name: 'Petr Yan', unique: true },
  WWZETKIN: { name: 'Clara Zetkin', unique: true },
};
