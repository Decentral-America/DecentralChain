import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { deepEqual } from 'fast-equals';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import type { AssetsRecord } from '#assets/types';
import type { Nft } from '#nfts/types';
import { NftVendorId } from '#nfts/types';

import { usePopupDispatch, usePopupSelector } from '../../../../../popup/store/react';
import { setUiState } from '../../../../../store/actions/uiState';
import type { UiState } from '../../../../../store/reducers/updateState';

export function useUiState<T extends keyof UiState>(
  key: T,
): [UiState[T] | null, (newState: UiState[T] | null) => void] {
  const dispatch = usePopupDispatch();
  const initialValue = usePopupSelector((state) => state.uiState[key]);
  const [state, setState] = useState<UiState[T] | null>(initialValue);
  return [
    state,
    (newState) => {
      setState(newState);

      if (!deepEqual(newState, state)) {
        dispatch(setUiState({ [key]: newState }));
      }
    },
  ];
}

export function sortAssetEntries<T>(
  assetEntries: Array<[string, T]>,
  assets: AssetsRecord,
): Array<[string, T]> {
  return assetEntries.sort(([aAssetId], [bAssetId]) => {
    const a = assets[aAssetId];
    const b = assets[bAssetId];

    return (
      (aAssetId === 'WAVES' && -1) ||
      (bAssetId === 'WAVES' && 1) ||
      (a && b
        ? +!!b.isFavorite - +!!a.isFavorite ||
          (a.displayName ?? '').localeCompare(b.displayName ?? '')
        : 0)
    );
  });
}

export function sortAndFilterNfts<T extends Nft>(
  nfts: T[],
  filters: {
    term?: string | undefined;
    creator?: string | null | undefined;
  },
) {
  const { creator, term } = filters;

  if (creator) {
    nfts = nfts.filter((nft) => nft.creator === creator);
  }

  if (term) {
    nfts = nfts.filter(
      (nft) =>
        nft.id.toLowerCase() === term.toLowerCase() ||
        nft.creator?.toLowerCase() === term.toLowerCase() ||
        nft.displayCreator?.toLowerCase().indexOf(term.toLowerCase()) !== -1 ||
        nft.displayName.toLowerCase().indexOf(term.toLowerCase()) !== -1,
    );
  }

  const NftVendorKeys = Object.values(NftVendorId);

  return nfts.sort((a, b) => {
    return NftVendorKeys.indexOf(a.vendor) - NftVendorKeys.indexOf(b.vendor);
  });
}

export const buildTxTypeOptions = (t: TFunction<'translation', undefined>) => [
  {
    id: 0,
    text: t('historyFilters.all'),
    value: 0,
  },
  {
    id: TRANSACTION_TYPE.ISSUE,
    text: t('historyFilters.issue'),
    value: TRANSACTION_TYPE.ISSUE,
  },
  {
    id: TRANSACTION_TYPE.TRANSFER,
    text: t('historyFilters.transfer'),
    value: TRANSACTION_TYPE.TRANSFER,
  },
  {
    id: TRANSACTION_TYPE.REISSUE,
    text: t('historyFilters.reissue'),
    value: TRANSACTION_TYPE.REISSUE,
  },
  {
    id: TRANSACTION_TYPE.BURN,
    text: t('historyFilters.burn'),
    value: TRANSACTION_TYPE.BURN,
  },
  {
    id: TRANSACTION_TYPE.EXCHANGE,
    text: t('historyFilters.exchange'),
    value: TRANSACTION_TYPE.EXCHANGE,
  },
  {
    id: TRANSACTION_TYPE.LEASE,
    text: t('historyFilters.lease'),
    value: TRANSACTION_TYPE.LEASE,
  },
  {
    id: TRANSACTION_TYPE.CANCEL_LEASE,
    text: t('historyFilters.cancelLease'),
    value: TRANSACTION_TYPE.CANCEL_LEASE,
  },
  {
    id: TRANSACTION_TYPE.ALIAS,
    text: t('historyFilters.alias'),
    value: TRANSACTION_TYPE.ALIAS,
  },
  {
    id: TRANSACTION_TYPE.MASS_TRANSFER,
    text: t('historyFilters.massTransfer'),
    value: TRANSACTION_TYPE.MASS_TRANSFER,
  },
  {
    id: TRANSACTION_TYPE.DATA,
    text: t('historyFilters.data'),
    value: TRANSACTION_TYPE.DATA,
  },
  {
    id: TRANSACTION_TYPE.SET_SCRIPT,
    text: t('historyFilters.setScript'),
    value: TRANSACTION_TYPE.SET_SCRIPT,
  },
  {
    id: TRANSACTION_TYPE.SPONSORSHIP,
    text: t('historyFilters.sponsorship'),
    value: TRANSACTION_TYPE.SPONSORSHIP,
  },
  {
    id: TRANSACTION_TYPE.SET_ASSET_SCRIPT,
    text: t('historyFilters.setAssetScript'),
    value: TRANSACTION_TYPE.SET_ASSET_SCRIPT,
  },
  {
    id: TRANSACTION_TYPE.INVOKE_SCRIPT,
    text: t('historyFilters.invokeScript'),
    value: TRANSACTION_TYPE.INVOKE_SCRIPT,
  },
  {
    id: TRANSACTION_TYPE.UPDATE_ASSET_INFO,
    text: t('historyFilters.updateAssetInfo'),
    value: TRANSACTION_TYPE.UPDATE_ASSET_INFO,
  },
];

const CARD_HEIGHT = 64;
const CARD_MARGIN_BOTTOM = 8;
export const CARD_FULL_HEIGHT = CARD_HEIGHT + CARD_MARGIN_BOTTOM;

const MARGIN_MIN = 4;
const MARGIN_MIN_TOP = MARGIN_MIN;
const GROUP_HEIGHT = 14;
export const FULL_GROUP_HEIGHT = MARGIN_MIN_TOP + GROUP_HEIGHT + MARGIN_MIN;
