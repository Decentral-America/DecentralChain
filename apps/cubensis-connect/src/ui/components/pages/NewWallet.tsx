import {
  base58Encode,
  createAddress,
  createPrivateKey,
  createPublicKey,
  generateRandomSeed,
  utf8Encode,
} from '@decentralchain/crypto';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePopupDispatch, usePopupSelector } from '#popup/store/react';
import { type NewAccountState } from '#store/reducers/localState';

import { newAccountSelect } from '../../../store/actions/localState';
import { AvatarList, Button } from '../ui';
import * as styles from './styles/newwallet.module.styl';

interface NewWalletItem {
  address: string;
  seed: string;
  type: 'seed';
}

let generatedWalletItems: NewWalletItem[] = [];

export async function generateNewWalletItems(networkCode: string) {
  const list: NewWalletItem[] = [];

  for (let i = 0; i < 5; i++) {
    const seed = generateRandomSeed();

    const privateKey = await createPrivateKey(utf8Encode(seed));
    const publicKey = await createPublicKey(privateKey);

    const address = createAddress(publicKey, networkCode.charCodeAt(0));

    list.push({
      address: base58Encode(address),
      seed,
      type: 'seed',
    });
  }

  generatedWalletItems = list;
}

export function NewWallet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = usePopupDispatch();
  const account = usePopupSelector(
    (state) => state.localState.newAccount as Extract<NewAccountState, { type: 'seed' }>,
  );

  const [list] = useState<NewWalletItem[]>(() => {
    const selected =
      generatedWalletItems.find((item) => account && item.address === account.address) ||
      generatedWalletItems[0]!;

    dispatch(
      newAccountSelect({
        name: '',
        ...selected,
        hasBackup: false,
        type: 'seed',
      }),
    );

    return generatedWalletItems;
  });

  function handleSelect(item: NewWalletItem) {
    dispatch(
      newAccountSelect({
        name: '',
        ...item,
        hasBackup: false,
        type: 'seed',
      }),
    );
  }

  return (
    <div className={styles.content}>
      <div>
        <h2 className="title1 margin3 left">{t('newWallet.createNew')}</h2>
      </div>

      <div className="margin3">
        <div className="body3">{t('newWallet.select')}</div>
        <div className="tag1 basic500">{t('newWallet.selectInfo')}</div>
      </div>

      <div className="margin4 avatar-list">
        <AvatarList
          items={list}
          selected={account}
          size={38}
          onSelect={(selected) => handleSelect(selected as NewWalletItem)}
        />
      </div>

      <div className="tag1 basic500 input-title">{t('newWallet.address')}</div>

      <div className={`${styles.greyLine} grey-line`}>{account.address}</div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void navigate('/create-account/save-backup');
        }}
      >
        <Button type="submit" view="submit" id="continue">
          {t('newWallet.continue')}
        </Button>
      </form>
    </div>
  );
}
