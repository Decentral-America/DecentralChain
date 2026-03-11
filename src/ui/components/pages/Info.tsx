import { Component } from 'react';
import { type WithTranslation, withTranslation } from 'react-i18next';

import { BigLogo } from '../head';
import * as styles from './styles/info.styl';

class InfoComponent extends Component<WithTranslation> {
  render() {
    const { t } = this.props;

    return (
      <div className={`${styles.content} body1`}>
        <BigLogo className={`${styles.logoLeft} margin-main`} noTitle />

        <div className="margin-main basic500">{t('info.keepUp')}</div>

        <a
          rel="noopener noreferrer"
          className="link black"
          target="_blank"
          href="https://forum.decentralchain.io"
        >
          forum.decentralchain.io
        </a>

        <div className={`${styles.social} margin-main`}>
          <div className="margin-main basic500">{t('info.joinUs')}</div>
          <ul>
            <li className={styles.github}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/Decentral-America"
                aria-label="GitHub"
              >
                <span className="sr-only">GitHub</span>
              </a>
            </li>
            <li className={styles.telegram}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://t.me/decentralchain"
                aria-label="Telegram"
              >
                <span className="sr-only">Telegram</span>
              </a>
            </li>
            <li className={styles.discord}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://discordapp.com/invite/cnFmDyA"
                aria-label="Discord"
              >
                <span className="sr-only">Discord</span>
              </a>
            </li>
            <li className={styles.twitter}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://twitter.com/decaborchain"
                aria-label="Twitter"
              >
                <span className="sr-only">Twitter</span>
              </a>
            </li>
            <li className={styles.reddit}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://www.reddit.com/r/DecentralChain"
                aria-label="Reddit"
              >
                <span className="sr-only">Reddit</span>
              </a>
            </li>
            <li className={styles.medium}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://medium.com/decentralchain"
                aria-label="Medium"
              >
                <span className="sr-only">Medium</span>
              </a>
            </li>
            <li className={styles.youtube}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://www.youtube.com/channel/UCYDQN4Fo4rGnOZ22L5plNIw/featured"
                aria-label="YouTube"
              >
                <span className="sr-only">YouTube</span>
              </a>
            </li>
            <li className={styles.vk}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://vk.com/decentralchain"
                aria-label="VK"
              >
                <span className="sr-only">VK</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="basic500">&copy; DecentralChain</div>
      </div>
    );
  }
}

export const Info = withTranslation()(InfoComponent);
