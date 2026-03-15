import { base58Decode } from '@decentralchain/crypto';
import { isAddressString } from 'messages/utils';
import { usePopupSelector } from 'popup/store/react';
import { type PreferencesAccount } from 'preferences/types';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { icontains } from 'ui/components/pages/assets/helpers';

import { Button, type InputProps, Modal, SearchInput } from '..';
import { AddressTooltip } from '../Address/Tooltip';
import { AddressInput } from './Input';
import * as styles from './SuggestInput.module.css';

const ALIAS_RE = /^alias:\w:/i;

interface SuggestProps {
  className?: string | undefined;
  paddingRight?: number | undefined;
  paddingLeft?: number | undefined;
  accounts: PreferencesAccount[];
  addresses: Array<[string, string]>;
  setValue: (value: string) => void;
  setAddress: (value: string) => void;
  setShowSuggest: (show: boolean) => void;
  onSuggest?: ((value: string) => void) | undefined;
}

function Suggest({
  className,
  paddingRight,
  paddingLeft,
  accounts,
  addresses,
  setValue,
  setAddress,
  setShowSuggest,
  onSuggest,
}: SuggestProps) {
  const { t } = useTranslation();

  return (
    <div className={`${styles.suggest} ${className}`}>
      {accounts.length !== 0 && (
        <>
          <p className={styles.title} style={{ paddingLeft, paddingRight }}>
            {t('address.wallets')}
          </p>
          {accounts.map((account) => (
            <div
              className={styles.item}
              style={{ paddingLeft, paddingRight }}
              key={account.address}
              role="option"
              tabIndex={0}
              onMouseDown={() => {
                setValue(account.name);
                setAddress(account.address);
                setShowSuggest(false);

                if (onSuggest) {
                  onSuggest(account.address);
                }
              }}
            >
              <p className={styles.name}>{account.name}</p>
              <AddressTooltip address={account.address} />
            </div>
          ))}
        </>
      )}
      {addresses.length !== 0 && (
        <>
          <p className={styles.title} style={{ paddingLeft, paddingRight }}>
            {t('address.title')}
          </p>
          {addresses.map(([address, name]) => (
            <div
              className={styles.item}
              style={{ paddingLeft, paddingRight }}
              key={address}
              role="option"
              tabIndex={0}
              onMouseDown={() => {
                setValue(name);
                setAddress(address);
                setShowSuggest(false);

                if (onSuggest) {
                  onSuggest(address);
                }
              }}
            >
              <p className={styles.name}>{name}</p>
              <AddressTooltip address={address} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

interface ModalProps {
  accounts: PreferencesAccount[];
  addresses: Array<[string, string]>;
  setValue: (value: string) => void;
  setAddress: (value: string) => void;
  setShowSuggest: (show: boolean) => void;
  onSuggest?: ((value: string) => void) | undefined;
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}

function SuggestModal(props: ModalProps) {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const accounts = useMemo(
    () =>
      props.accounts.filter(
        (account) => icontains(account.address, search) || icontains(account.name, search),
      ),
    [props.accounts, search],
  );
  const addresses = useMemo(
    () =>
      props.addresses.filter(
        ([address, name]) => icontains(address, search) || icontains(name, search),
      ),
    [props.addresses, search],
  );

  return (
    <Modal animation={Modal.ANIMATION.FLASH} showModal={props.showModal}>
      <div className="modal cover">
        <div className={styles.modalContent}>
          <Button
            className="modal-close"
            type="button"
            view="transparent"
            onClick={() => {
              props.setShowModal(false);
            }}
          />
          <p className={`headline2Bold ${styles.modalTitle}`}>{t('address.select')}</p>
          <SearchInput
            className={styles.modalSearchInput}
            value={search}
            autoFocus
            onInput={(e) => setSearch(e.currentTarget.value)}
            onClear={() => setSearch('')}
          />
          {accounts.length > 0 ? (
            <Suggest
              className={styles.modalSuggest}
              paddingLeft={24}
              paddingRight={24}
              accounts={accounts}
              addresses={addresses}
              setValue={props.setValue}
              setAddress={props.setAddress}
              setShowSuggest={props.setShowSuggest}
              onSuggest={(value) => {
                props.setShowModal(false);

                if (props.onSuggest) {
                  props.onSuggest(value);
                }
              }}
            />
          ) : (
            <p className={styles.notFound}>{t('address.notFound')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

type Props = Extract<InputProps, { multiLine?: false | undefined }> & {
  onSuggest: (value: string) => void;
};

export function AddressSuggestInput({ onSuggest, ...props }: Props) {
  const { t } = useTranslation();

  const chainId = usePopupSelector((state) => state.selectedAccount?.networkCode?.charCodeAt(0));
  const accounts = usePopupSelector((state) => state.accounts);
  const addresses = usePopupSelector<Record<string, string>>((state) =>
    Object.entries(state.addresses).reduce(
      (acc, [address, name]) => {
        if (isAddressString(address, chainId) && base58Decode(address)[1] === chainId) {
          acc[address] = name;
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  const [value, setValue] = useState('');
  const [address, setAddress] = useState('');

  const foundAccounts = useMemo(
    () =>
      value
        ? accounts.filter(
            (account) => icontains(account.address, value) || icontains(account.name, value),
          )
        : [],
    [accounts, value],
  );
  const foundAddresses = useMemo<Record<string, string>>(
    () =>
      value
        ? Object.entries(addresses).reduce<Record<string, string>>((acc, [address, name]) => {
            if (icontains(address, value) || icontains(name, value)) {
              acc[address] = name;
            }
            return acc;
          }, {})
        : {},
    [addresses, value],
  );

  const [showSuggest, setShowSuggest] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const isAlias = useMemo(() => ALIAS_RE.test(value), [value]);

  const overlaidTextRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div className={styles.root}>
        <div className={styles.inputWithOverlaidText}>
          <AddressInput
            {...props}
            autoComplete="off"
            autoFocus
            className={styles.addressInput}
            spellCheck={false}
            value={value}
            onBlur={() => {
              setShowSuggest(false);
            }}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              setAddress('');

              if (props.onChange) {
                props.onChange(event);
              }
            }}
            onFocus={() => {
              setShowSuggest(true);
            }}
            onScroll={(event) => {
              const overlaidText = overlaidTextRef.current;

              if (!overlaidText) {
                return;
              }

              overlaidText.scrollLeft = event.currentTarget.scrollLeft;
            }}
          />

          <div ref={overlaidTextRef} className={styles.overlaidText}>
            {isAlias
              ? (() => {
                  const match = value.match(ALIAS_RE);
                  return match ? (
                    <>
                      <mark className={styles.aliasMark}>{match[0]}</mark>
                      {value.slice(match[0].length)}
                    </>
                  ) : (
                    value
                  );
                })()
              : value}
          </div>
        </div>

        <button
          className={styles.buttonIcon}
          onClick={() => {
            setShowSuggestModal(true);
          }}
          type="button"
        />

        <SuggestModal
          showModal={showSuggestModal}
          setShowModal={setShowSuggestModal}
          accounts={accounts}
          addresses={Object.entries(addresses).sort(([, firstName], [, secondName]) =>
            firstName.localeCompare(secondName),
          )}
          setValue={setValue}
          setAddress={setAddress}
          setShowSuggest={setShowSuggest}
          onSuggest={onSuggest}
        />

        {address && <AddressTooltip className={styles.tooltip} address={address} />}

        {showSuggest && (
          <Suggest
            accounts={foundAccounts}
            addresses={Object.entries(foundAddresses).sort(([, firstName], [, secondName]) =>
              firstName.localeCompare(secondName),
            )}
            setValue={setValue}
            setAddress={setAddress}
            setShowSuggest={setShowSuggest}
            onSuggest={onSuggest}
          />
        )}
      </div>

      {isAlias && <p className={styles.warningAlias}>{t('address.warningAlias')}</p>}
    </>
  );
}
