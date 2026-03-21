import clsx from 'clsx';
import type React from 'react';
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
  /** React 19: ref is a plain prop — no forwardRef wrapper needed */
  ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement | null> | undefined;
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
  ref,
  ...props
}: InputProps) {
  const [rootType, setRootType] = useState(type);

  const rootRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const getRef = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      rootRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref != null) {
        (ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current =
          element;
      }
    },
    [ref],
  );

  return (
    <div
      className={clsx(
        styles.wrapper,
        wrapperClassName,
        !!error && styles.error,
        type === 'checkbox' && styles.checkbox,
        view === 'password' && styles.password,
      )}
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
            <button
              type="button"
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
