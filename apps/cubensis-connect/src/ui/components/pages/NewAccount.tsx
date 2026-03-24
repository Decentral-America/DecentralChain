import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { usePopupSelector } from '#popup/store/react';
import Background from '#ui/services/Background';

import { CONFIG } from '../../appConfig';
import { Button, ErrorMessage, Input, LangsSelect } from '../ui';
import * as styles from './NewAccount.module.css';

const MIN_LENGTH = CONFIG.PASSWORD_MIN_LENGTH;

type FieldError = { error: string } | null | undefined;

function validateFirst(firstValue: string): FieldError {
  if (!firstValue) return null;
  if (firstValue.length < MIN_LENGTH) return { error: 'isSmall' };
  return null;
}

function validateSecond(firstValue: string, secondValue: string): FieldError {
  if (!secondValue || !firstValue) return null;
  if (firstValue === secondValue) return null;
  return { error: 'noMatch' };
}

function isDisabled(
  firstValue: string,
  secondValue: string,
  termsAccepted: boolean,
  conditionsAccepted: boolean,
): boolean {
  if (!termsAccepted || !conditionsAccepted) return true;
  if (!firstValue || !secondValue) return true;
  return !!(validateFirst(firstValue) || validateSecond(firstValue, secondValue));
}

export function NewAccount() {
  const { t } = useTranslation();
  const initialized = usePopupSelector((state) => state.state?.initialized);

  const [firstValue, setFirstValue] = useState('');
  const [secondValue, setSecondValue] = useState('');
  const [firstError, setFirstError] = useState<FieldError>(null);
  const [secondError, setSecondError] = useState<FieldError>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);

  if (initialized) {
    return <Navigate replace to="/" />;
  }

  const buttonDisabled = isDisabled(firstValue, secondValue, termsAccepted, conditionsAccepted);

  function checkValues(fv: string, sv: string) {
    setFirstError(validateFirst(fv));
    setSecondError(validateSecond(fv, sv));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (firstValue) {
      Background.initVault(firstValue);
    }
  }

  return (
    <div className={styles.account}>
      <form data-testid="newAccountForm" className={styles.content} onSubmit={handleSubmit}>
        <h2 className={`${styles.title} title1`}>{t('newAccount.protect')}</h2>

        <div className={styles.inner}>
          <div className="margin1 relative">
            <div className="basic500 tag1 left input-title">{t('newAccount.createPassword')}</div>
            <Input
              autoComplete="new-password"
              autoFocus
              error={!!firstError}
              id="first"
              onBlur={() => checkValues(firstValue, secondValue)}
              onChange={(e) => {
                setFirstValue(e.target.value);
                checkValues(e.target.value, secondValue);
              }}
              type="password"
              view="password"
              wrapperClassName="margin1"
            />
            <ErrorMessage show={firstError} data-testid="firstError">
              {t('newAccount.smallPass')}
            </ErrorMessage>
          </div>
          <div className="margin1 relative">
            <div className="basic500 tag1 left input-title">{t('newAccount.confirmPassword')}</div>
            <Input
              autoComplete="new-password"
              error={!!secondError}
              id="second"
              onBlur={() => checkValues(firstValue, secondValue)}
              onChange={(e) => {
                setSecondValue(e.target.value);
                checkValues(firstValue, e.target.value);
              }}
              type="password"
              view="password"
            />
            <ErrorMessage show={secondError} data-testid="secondError">
              {t('newAccount.notMatch')}
            </ErrorMessage>
          </div>
        </div>
        <div className={styles.checkboxWrapper}>
          <Input
            wrapperClassName={styles.checkbox}
            id="termsAccepted"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.currentTarget.checked);
            }}
          />
          <label htmlFor="termsAccepted">
            {t('newAccount.acceptTerms')}{' '}
            <a
              href="https://decentralchain.io/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('newAccount.termsAndConditions')}
            </a>
          </label>
        </div>
        <div className={styles.checkboxWrapper}>
          <Input
            wrapperClassName={styles.checkbox}
            id="conditionsAccepted"
            type="checkbox"
            checked={conditionsAccepted}
            onChange={(e) => {
              setConditionsAccepted(e.currentTarget.checked);
            }}
          />
          <label htmlFor="conditionsAccepted">
            {t('newAccount.acceptTerms')}{' '}
            <a
              href="https://decentralchain.io/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('newAccount.privacyPolicy')}
            </a>
          </label>
        </div>

        <Button className={styles.button} type="submit" view="submit" disabled={buttonDisabled}>
          {t('newAccount.create')}
        </Button>
        <div className={`${styles.text} tag1 basic500`}>{t('newAccount.passinfo')}</div>
      </form>
      <div className={styles.footer}>
        <LangsSelect />
      </div>
    </div>
  );
}
