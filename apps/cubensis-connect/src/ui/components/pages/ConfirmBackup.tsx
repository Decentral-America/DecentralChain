import { usePopupSelector } from 'popup/store/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { type NewAccountState } from 'store/reducers/localState';

import { Button, ErrorMessage, Pills, type PillsListItem } from '../ui';
import * as styles from './styles/confirmBackup.module.styl';

type Props = Record<never, never>;

interface ListState {
  seed: string | null;
  list: PillsListItem[];
  selectedList: PillsListItem[];
  wrongSeed: boolean;
  complete: boolean;
  disabled: boolean;
}

function buildShuffledList(seed: string): PillsListItem[] {
  const list = seed.split(' ').map((text, id) => ({ hidden: false, id, selected: true, text }));

  // Fisher-Yates shuffle using CSPRNG — seed words must never use Math.random()
  for (let i = list.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const j = rand[0]! % (i + 1);
    [list[i], list[j]] = [list[j]!, list[i]!];
  }

  return list;
}

export function ConfirmBackup(_props: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const account = usePopupSelector(
    (state) => state.localState.newAccount as Extract<NewAccountState, { type: 'seed' }>,
  );

  const [state, setState] = useState<ListState>(() => ({
    complete: false,
    disabled: false,
    list: buildShuffledList(account.seed),
    seed: account.seed,
    selectedList: [],
    wrongSeed: false,
  }));

  useEffect(() => {
    if (account.seed !== state.seed) {
      setState((prev) => ({
        ...prev,
        complete: false,
        list: buildShuffledList(account.seed),
        seed: account.seed,
        selectedList: [],
        wrongSeed: false,
      }));
    }
  }, [account.seed, state.seed]);

  function setSelected(selected: PillsListItem[]) {
    const { list, seed } = state;
    const selectedTextsList = selected.map((item) => item.text);
    const selectedIdsList = selected.map((item) => item.id);

    setState({
      ...state,
      complete: selected.length === list.length,
      list: list.map((item) => ({ ...item, hidden: selectedIdsList.includes(item.id) })),
      selectedList: selected,
      wrongSeed: seed !== selectedTextsList.join(' '),
    });
  }

  function handleSelect({ text, id }: PillsListItem) {
    setSelected([...state.selectedList, { id, text }]);
  }

  function handleUnSelect({ id }: PillsListItem) {
    setSelected(state.selectedList.filter((item) => item.id !== id));
  }

  function handleClear() {
    setSelected([]);
  }

  function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setState((prev) => ({ ...prev, disabled: true }));
    navigate('/account-name', { replace: true });
  }

  const { selectedList, list, complete, wrongSeed } = state;
  const showButton = complete && !wrongSeed;
  const showClear = complete && wrongSeed;

  return (
    <div className={styles.content}>
      <h2 className="title1 margin1">{t('confirmBackup.confirmBackup')}</h2>

      <Pills
        className={`${styles.readSeed} plate body3`}
        list={selectedList}
        selected={false}
        onSelect={handleUnSelect}
      />

      <div className="center body3">
        {complete ? null : t('confirmBackup.selectWord')}
        {showClear ? (
          <ErrorMessage show className={styles.noMargin}>
            {t('confirmBackup.wrongSeed')}
          </ErrorMessage>
        ) : null}
      </div>

      <Pills className={styles.writeSeed} list={list} selected onSelect={handleSelect} />
      {showButton ? (
        <Button
          id="confirmBackup"
          type="submit"
          view="submit"
          disabled={state.disabled}
          className={styles.confirm}
          onClick={handleSubmit}
        >
          {t('confirmBackup.confirm')}
        </Button>
      ) : null}
      {showClear ? (
        <div className={`center tag1 ${styles.clearSeed}`}>
          <Button type="button" view="transparent" onClick={handleClear}>
            <span className="submit400">{t('confirmBackup.clear')} </span>
            {t('confirmBackup.selectAgain')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
