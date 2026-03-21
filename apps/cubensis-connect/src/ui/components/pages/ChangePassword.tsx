import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CONFIG } from '../../appConfig';
import background from '../../services/Background';
import { Button, ErrorMessage, Input, Modal } from '../ui';
import * as styles from './styles/changePassword.module.styl';

const MIN_LENGTH = CONFIG.PASSWORD_MIN_LENGTH;

type FieldError = string | { error: string } | null | undefined;

interface FormState {
  firstValue: string;
  secondValue: string;
  oldValue: string;
  oldError: FieldError;
  firstError: FieldError;
  secondError: string | { error: string } | null;
  buttonDisabled: boolean | { error: string };
  passwordError: boolean;
  showChanged: boolean;
  oldEqualNewError: boolean | '';
}

function validateOld(oldValue: string): FieldError {
  if (!oldValue) return null;
  if (oldValue.length < MIN_LENGTH) return { error: 'isSmall' };
  return null;
}

function validateFirst(firstValue: string): FieldError {
  if (!firstValue) return null;
  if (firstValue.length < MIN_LENGTH) return { error: 'isSmall' };
  return null;
}

function validateSecond(
  firstValue: string,
  secondValue: string,
): string | { error: string } | null {
  if (!secondValue || !firstValue) return null;
  if (firstValue === secondValue) return null;
  return { error: 'noMatch' };
}

export function ChangePassword() {
  const { t } = useTranslation();
  const showChangedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [form, setForm] = useState<FormState>({
    buttonDisabled: true,
    firstError: '',
    firstValue: '',
    oldEqualNewError: false,
    oldError: '',
    oldValue: '',
    passwordError: false,
    secondError: '',
    secondValue: '',
    showChanged: false,
  });

  function checkValues(oldValue: string, firstValue: string, secondValue: string) {
    const oldError = validateOld(oldValue);
    const firstError = validateFirst(firstValue);
    const secondError = validateSecond(firstValue, secondValue);
    const oldEqualNewError =
      !firstError && !secondError && !oldError && !!oldValue && firstValue === oldValue;
    const buttonDisabled =
      oldEqualNewError || !!oldError || !!firstError || !!secondError || !oldValue || !firstValue;

    setForm((prev) => ({
      ...prev,
      buttonDisabled,
      firstError,
      oldEqualNewError,
      oldError,
      passwordError: prev.passwordError && !oldError,
      secondError,
    }));
  }

  function handleChange(field: 'oldValue' | 'firstValue' | 'secondValue', value: string) {
    const next = {
      firstValue: form.firstValue,
      oldValue: form.oldValue,
      secondValue: form.secondValue,
      [field]: value,
    };
    setForm((prev) => ({ ...prev, [field]: value }));
    checkValues(next.oldValue, next.firstValue, next.secondValue);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.firstValue) return;

    background.newPassword(form.oldValue, form.firstValue).then(
      () => {
        setForm({
          buttonDisabled: true,
          firstError: null,
          firstValue: '',
          oldEqualNewError: false,
          oldError: null,
          oldValue: '',
          passwordError: false,
          secondError: null,
          secondValue: '',
          showChanged: true,
        });
        if (showChangedTimer.current != null) clearTimeout(showChangedTimer.current);
        showChangedTimer.current = setTimeout(
          () => setForm((prev) => ({ ...prev, showChanged: false })),
          1000,
        );
      },
      () => setForm((prev) => ({ ...prev, passwordError: true })),
    );
  }

  return (
    <div className={styles.newPassword}>
      <form className={styles.content} onSubmit={handleSubmit}>
        <h2 className="title1 margin2">{t('changePassword.changeTitle')}</h2>
        <div>
          <div className="margin-main-big relative">
            <div className="basic500 tag1 input-title">{t('changePassword.oldPassword')}</div>
            <Input
              autoComplete="current-password"
              autoFocus
              error={!!(form.oldError || form.passwordError)}
              id="old"
              type="password"
              value={form.oldValue}
              view="password"
              onBlur={() => checkValues(form.oldValue, form.firstValue, form.secondValue)}
              onChange={(e) => handleChange('oldValue', e.target.value)}
            />
            <ErrorMessage show={!!(form.oldError || form.passwordError)} data-testid="oldError">
              {form.oldError ? t('changePassword.errorShortOld') : null}
              {form.passwordError ? t('changePassword.errorWrongOld') : null}
            </ErrorMessage>
          </div>

          <div className="margin-main-big relative">
            <div className="basic500 tag1 input-title">{t('changePassword.newPassword')}</div>
            <Input
              autoComplete="new-password"
              error={!!form.firstError || !!form.oldEqualNewError}
              id="first"
              type="password"
              value={form.firstValue}
              view="password"
              onBlur={() => checkValues(form.oldValue, form.firstValue, form.secondValue)}
              onChange={(e) => handleChange('firstValue', e.target.value)}
            />
            <ErrorMessage show={!!form.firstError} data-testid="firstError">
              {t('changePassword.errorShortNew')}
            </ErrorMessage>
          </div>

          <div className="margin-main-big relative">
            <div className="basic500 tag1 input-title">{t('changePassword.confirmPassword')}</div>
            <Input
              autoComplete="new-password"
              error={!!form.secondError || !!form.oldEqualNewError}
              id="second"
              type="password"
              value={form.secondValue}
              view="password"
              onBlur={() => checkValues(form.oldValue, form.firstValue, form.secondValue)}
              onChange={(e) => handleChange('secondValue', e.target.value)}
            />
            <ErrorMessage
              show={!!form.secondError || !!form.oldEqualNewError}
              data-testid="secondError"
            >
              {form.oldEqualNewError ? t('changePassword.equalPassword') : null}
              {form.secondError ? t('changePassword.errorWrongConfirm') : null}
            </ErrorMessage>
          </div>
        </div>
        <Button type="submit" view="submit" disabled={form.buttonDisabled as boolean}>
          {t('changePassword.create')}
        </Button>
      </form>
      <Modal animation={Modal.ANIMATION.FLASH_SCALE} showModal={form.showChanged}>
        <div className="modal notification" data-testid="modalPassword">
          {t('changePassword.done')}
        </div>
      </Modal>
    </div>
  );
}
