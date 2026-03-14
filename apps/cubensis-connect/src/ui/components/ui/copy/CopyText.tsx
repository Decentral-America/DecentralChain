import clsx from 'clsx';
import copy from 'copy-to-clipboard';
import { PureComponent } from 'react';

import * as styles from './copy.module.styl';

const DEFAULT_HIDDEN_CONTENT = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

export class CopyText extends PureComponent<IProps> {
  readonly state = { showText: false };

  showTextHandler = () => {
    this.setState({
      showText: true,
    });
  };

  onCopyHandler = (event: React.MouseEvent<HTMLElement>) => this._copyText(event);

  render() {
    const iconClass = clsx(styles.firstIcon, {
      'password-icon': this.props.type === 'key',
    });

    const copyIcon = clsx(styles.lastIcon, 'copy-icon');

    const toggleHandler = this.props.toggleText ? this.showTextHandler : undefined;

    const showText = this.props.toggleText ? this.state.showText : this.props.showText;

    return (
      <button type="button" onClick={toggleHandler}>
        <div>
          {this.props.type ? <i className={iconClass}> </i> : null}
          <div className={styles.copyTextOverflow}>
            {showText ? this.props.text : DEFAULT_HIDDEN_CONTENT}
          </div>
          {this.props.showCopy ? (
            <button type="button" className={copyIcon} onClick={this.onCopyHandler} />
          ) : null}
          {this.props.showConfirmed ? <div>Confirm</div> : null}
          {this.props.showNotAccess ? <div>N/A</div> : null}
        </div>
      </button>
    );
  }

  private _copyText(event: React.MouseEvent<HTMLElement>) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.props.getText) {
      this.props.getText((text) => this.copy(text));
      return null;
    }

    const text = this.props.text;
    this.copy(text ?? '');
  }

  private copy(text: string) {
    const result = copy(text, this.props.copyOptions as Parameters<typeof copy>[1]);
    if (this.props.onCopy) {
      this.props.onCopy(text, result);
    }
  }
}

interface IProps {
  text?: string | undefined;
  getText?: ((cb: (text: string) => void) => void) | undefined;
  onCopy?: ((...args: unknown[]) => void) | undefined;

  toggleText?: boolean | undefined;
  copyOptions?:
    | {
        debug?: boolean | undefined;
        message?: string | undefined;
        format?: string | undefined;
        onCopy?: ((clipboardData: object) => void) | undefined;
      }
    | undefined;
  type?: string | undefined;
  showText?: boolean | undefined;

  showConfirmed?: boolean | undefined;
  showNotAccess?: boolean | undefined;
  showCopy?: boolean | undefined;
}
