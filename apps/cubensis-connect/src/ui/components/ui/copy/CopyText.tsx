import clsx from 'clsx';
import copy from 'copy-to-clipboard';
import { useState } from 'react';

import * as styles from './copy.module.styl';

const DEFAULT_HIDDEN_CONTENT = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

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

export function CopyText({
  text,
  getText,
  onCopy,
  toggleText,
  copyOptions,
  type,
  showText: showTextProp,
  showConfirmed,
  showNotAccess,
  showCopy,
}: IProps) {
  const [showText, setShowText] = useState(false);

  const iconClass = clsx(styles.firstIcon, { 'password-icon': type === 'key' });
  const copyIcon = clsx(styles.lastIcon, 'copy-icon');

  const toggleHandler = toggleText ? () => setShowText(true) : undefined;
  const effectiveShowText = toggleText ? showText : showTextProp;

  function handleCopy(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    event.preventDefault();

    if (getText) {
      getText((t) => performCopy(t));
      return;
    }

    performCopy(text ?? '');
  }

  function performCopy(t: string) {
    const result = copy(t, copyOptions as Parameters<typeof copy>[1]);
    if (onCopy) {
      onCopy(t, result);
    }
  }

  return (
    <button type="button" onClick={toggleHandler}>
      <div>
        {type ? <i className={iconClass}> </i> : null}
        <div className={styles.copyTextOverflow}>
          {effectiveShowText ? text : DEFAULT_HIDDEN_CONTENT}
        </div>
        {showCopy ? <button type="button" className={copyIcon} onClick={handleCopy} /> : null}
        {showConfirmed ? <div>Confirm</div> : null}
        {showNotAccess ? <div>N/A</div> : null}
      </div>
    </button>
  );
}
