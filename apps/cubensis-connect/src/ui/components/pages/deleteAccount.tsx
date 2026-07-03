import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { deleteAccount } from '../../../popup/store/actions';
import { Button } from '../ui';
import * as styles from './deleteAccount.module.css';

export function DeleteAccount() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const params = useParams<{ address: string }>();

  return (
    <div className={styles.content}>
      <h2 className="title1 margin2">{t('deleteAccount.attention')}</h2>
      <div className="margin4 body1">{t('deleteAccount.warn')}</div>
      <div>
        <Button
          id="deleteAccount"
          onClick={async () => {
            await deleteAccount(params.address ?? '');
            void navigate('/', { replace: true });
          }}
          type="button"
          view="warning"
        >
          {t('deleteAccount.delete')}
        </Button>
      </div>
    </div>
  );
}
