import { type DataTransactionEntryString } from '@decentralchain/ts-types';

import { dataEntriesToRecord, fetchDataEntries } from '../../nodeApi/dataEntries';
import {
  type CreateParams,
  type FetchInfoParams,
  type NftAssetDetail,
  type NftVendor,
  NftVendorId,
} from '../types';

const SIGN_ART_DAPP = '3PDBLdsUrcsiPxNbt8g2gQVoefKgzt3kJzV';
const SIGN_ART_USER_DAPP = '3PGSWDgad4RtceQYXBpq2x73mXLRJYLRqRP';

interface SignArtNftInfo {
  artworkId: string;
  cid: string;
  creator: string;
  description: string;
  id: string;
  name: string;
  userName: string;
  vendor: NftVendorId.SignArt;
}

function nftIdKey(id: string) {
  return `nft_${id}`;
}

function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value == null) {
    throw new Error(message);
  }
}

export class SignArtNftVendor implements NftVendor<SignArtNftInfo> {
  id = NftVendorId.SignArt as const;

  is(nft: NftAssetDetail) {
    return nft.issuer === SIGN_ART_DAPP;
  }

  fetchInfo({ nfts, nodeUrl }: FetchInfoParams) {
    if (nfts.length === 0) {
      return [];
    }

    const nftIds = nfts.map((nft) => nft.assetId);

    return fetchDataEntries<DataTransactionEntryString>({
      address: SIGN_ART_DAPP,
      keys: nftIds.map((id) => nftIdKey(id)),
      nodeUrl,
    })
      .then(dataEntriesToRecord)
      .then((dataEntries) =>
        nftIds.map((id) => {
          const value = dataEntries[nftIdKey(id)];
          assertDefined(value, `Missing data entry for nft ${id}`);

          const match = value.match(/art_sold_\d+_of_\d+_(\w+)_(\w+)/i);
          assertDefined(match, `Invalid SignArt nft data entry format for ${id}`);
          const [, artworkId, creator] = match;

          return { artworkId, creator };
        }),
      )
      .then((artworks) =>
        Promise.all([
          fetchDataEntries<DataTransactionEntryString>({
            address: SIGN_ART_DAPP,
            keys: nftIds.flatMap((_id, index) => {
              const info = artworks[index];
              assertDefined(info, `Missing artwork info at index ${index}`);
              return [
                `art_name_${info.artworkId}_${info.creator}`,
                `art_desc_${info.artworkId}_${info.creator}`,
                `art_display_cid_${info.artworkId}_${info.creator}`,
                `art_type_${info.artworkId}_${info.creator}`,
              ];
            }),
            nodeUrl,
          }),

          fetchDataEntries<DataTransactionEntryString>({
            address: SIGN_ART_USER_DAPP,
            keys: nftIds.map((_id, index) => {
              const info = artworks[index];
              assertDefined(info, `Missing artwork info at index ${index}`);
              return `user_name_${info.creator}`;
            }),
            nodeUrl,
          }),
        ]),
      )
      .then(([artworksEntries, userNameEntries]) => {
        assertDefined(artworksEntries, 'Missing artworks entries');
        assertDefined(userNameEntries, 'Missing user name entries');

        return nftIds.map((id, index): SignArtNftInfo => {
          const entriesPerAsset = 4;
          const artName = artworksEntries[entriesPerAsset * index];
          assertDefined(artName, `Missing artName entry at index ${index}`);
          const artDesc = artworksEntries[entriesPerAsset * index + 1];
          assertDefined(artDesc, `Missing artDesc entry at index ${index}`);
          const artDisplayCid = artworksEntries[entriesPerAsset * index + 2];
          assertDefined(artDisplayCid, `Missing artDisplayCid entry at index ${index}`);
          const userName = userNameEntries[index];
          assertDefined(userName, `Missing userName entry at index ${index}`);
          const match = artName.key.match(/art_name_(\w+)_(\w+)/i);
          assertDefined(match, `Invalid artName key format at index ${index}`);
          const [, artworkId, creator] = match;
          assertDefined(artworkId, `Missing artworkId in artName key at index ${index}`);
          assertDefined(creator, `Missing creator in artName key at index ${index}`);

          return {
            artworkId,
            cid: artDisplayCid.value,
            creator,
            description: artDesc.value,
            id,
            name: artName.value,
            userName: userName.value,
            vendor: NftVendorId.SignArt,
          };
        }, []);
      });
  }

  create({ asset, config, info }: CreateParams<SignArtNftInfo>) {
    const creator = info ? info.creator : asset.description.match(/creator: (\w+)/i)?.[1];

    const artworkId = info ? info.artworkId : asset.description?.match(/artid: (\w+)/i)?.[1];

    let foreground: string | undefined;

    if (info?.cid) {
      const parts = info.cid.split('/');
      const domain = parts[0];
      const filename = parts[1];
      assertDefined(domain, 'Missing domain in cid');
      assertDefined(filename, 'Missing filename in cid');

      foreground = config.signArtImgUrl
        .replace(/{domain}/g, domain)
        .replace(/{filename}/g, filename);
    }

    return {
      creator,
      creatorUrl: creator && `https://mainnet.sign-art.app/user/${creator}`,
      description: info?.description ?? asset.description,
      displayCreator: info?.userName ? `@${info.userName}` : creator,
      displayName: info?.name ?? asset.displayName,
      foreground,
      id: asset.id,

      marketplaceUrl:
        creator && artworkId && `https://mainnet.sign-art.app/user/${creator}/artwork/${artworkId}`,

      name: asset.name,
      vendor: NftVendorId.SignArt,
    };
  }
}
