import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

import * as styles from './Input.module.css';

type View = 'default' | 'password';

interface InputEvents<E extends HTMLTextAreaElement | HTMLInputElement> {
  onBlur?: ((event: React.FocusEvent<E>) => void) | undefined;
  onChange?: ((event: React.ChangeEvent<E>) => void) | undefined;
  onFocus?: ((event: React.FocusEvent<E>) => void) | undefined;
  onKeyDown?: ((event: React.KeyboardEvent<E>) => void) | undefined;
  onInput?: ((event: React.FormEvent<E>) => void) | undefined;
  onScroll?: ((event: React.UIEvent<E>) => void) | undefined;
}

export type InputProps = {
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  checked?: boolean | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  error?: unknown | undefined;
  forwardRef?: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  > | undefined;
  id?: string | undefined;
  maxLength?: number | undefined;
  placeholder?: string | undefined;
  spellCheck?: boolean | undefined;
  type?: React.HTMLInputTypeAttribute | undefined;
  value?: string | readonly string[] | number | undefined;
  view?: View | undefined;
  wrapperClassName?: string | undefined;
} & (
  | ({ multiLine: true; rows?: number } & InputEvents<HTMLTextAreaElement>)
  | ({ multiLine?: false | undefined } & InputEvents<HTMLInputElement>)
);

export function Input({
  wrapperClassName,
  className,
  error,
  multiLine,
  view = 'default',
  type,
  forwardRef,
  ...props
}: InputProps) {
  const [rootType, setRootType] = useState(type);

  const rootRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const getRef = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      forwardRef && (forwardRef.current = element);
      rootRef.current = element;
    },
    [forwardRef],
  );

  return (
    <div
      className={clsx(styles.wrapper, wrapperClassName, {
        [styles.error]: error,
        [styles.checkbox]: type === 'checkbox',
        [styles.password]: view === 'password',
      })}
    >
      {multiLine ? (
        <textarea
          className={clsx(styles.input, className)}
          {...(props as Extract<InputProps, { multiLine: true }>)}
          ref={getRef}
        />
      ) : (
        <>
          <input
            className={clsx(styles.input, className)}
            {...(props as Extract<InputProps, { multiLine?: false | undefined }>)}
            type={rootType}
            ref={getRef}
          />
          {view === 'password' && (
            <i
              className={styles.passwordIcon}
              onClick={() => {
                setRootType(rootType === 'password' ? 'text' : 'password');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
