import { useLocation, useNavigate } from 'react-router-dom';

import { HeadLogo } from '../head';
import * as styles from './menu.module.styl';

interface Props {
  hasLogo?: boolean | undefined;
  hasSettings?: boolean | undefined;
  hasBack?: boolean | undefined;
  hasClose?: boolean | undefined;
}

export function Menu({ hasClose, hasBack, hasLogo, hasSettings }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      {hasLogo && <HeadLogo />}

      {hasSettings && (
        <>
          <button
            type="button"
            className={styles.settingsIcon}
            onClick={() => {
              void navigate('/settings');
            }}
          />

          <button
            type="button"
            className={styles.navigationIcon}
            onClick={() => {
              void navigate('/about');
            }}
          />
        </>
      )}

      {hasBack && location.pathname !== window.location.hash.split('#')[1] && (
        <button
          type="button"
          className={`${styles.arrowBackIcon} arrow-back-icon`}
          onClick={() => {
            void navigate(-1);
          }}
        />
      )}

      {hasClose && (
        <button
          type="button"
          className={`${styles.closeIcon} close-icon`}
          onClick={() => {
            void navigate(-1);
          }}
        />
      )}
    </div>
  );
}
