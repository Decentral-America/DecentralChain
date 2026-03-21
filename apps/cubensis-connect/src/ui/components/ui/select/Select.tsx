import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import * as styles from './Select.module.css';

type TText = string | React.ReactNode;

export interface SelectItem<T> {
  id: string | number;
  text: TText;
  value: T;
  icon?: React.ReactNode | undefined;
}

type ListPlacement = 'top' | 'bottom';
type Theme = 'compact' | 'solid' | 'underlined';

const themeClassNames: Record<Theme, string> = {
  compact: styles.themeCompact ?? '',
  solid: styles.themeSolid ?? '',
  underlined: styles.themeUnderlined ?? '',
};

interface Props<T> {
  className?: string | undefined;
  description?: TText | undefined;
  fill?: boolean | undefined;
  /** React 19: ref is a plain prop — no forwardRef wrapper needed */
  ref?: React.Ref<HTMLDivElement | null> | undefined;
  listPlacement?: ListPlacement | undefined;
  selectList: ReadonlyArray<SelectItem<T>>;
  selected: T;
  theme?: Theme | undefined;
  onMouseEnter?: (() => void) | undefined;
  onMouseLeave?: (() => void) | undefined;
  onSelectItem: (id: string | number, value: T) => void;
}

export function Select<T>({
  className,
  description,
  fill,
  ref,
  listPlacement = 'bottom',
  selected,
  selectList,
  theme = 'solid',
  onSelectItem,
  ...otherProps
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (event.target instanceof HTMLElement && rootRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener('click', handleDocumentClick, {
      capture: true,
    });

    return () => {
      document.removeEventListener('click', handleDocumentClick, {
        capture: true,
      });
    };
  }, [isOpen]);

  const getRef = useCallback(
    (element: HTMLDivElement) => {
      rootRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref != null) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      }
    },
    [ref],
  );

  const selectedItem = selectList.find(({ id }) => id === selected) || selectList[0];

  return (
    <div
      className={clsx(className, styles.root, themeClassNames[theme], fill && styles.rootFill)}
      ref={getRef}
    >
      {description ? <div className="left input-title basic500 tag1">{description}</div> : null}

      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setIsOpen((prevState) => !prevState);
        }}
        {...otherProps}
      >
        {selectedItem?.icon}
        <div className={styles.triggerText}>{selectedItem?.text}</div>
      </button>

      {isOpen && (
        <div
          className={clsx(
            styles.list,
            {
              bottom: styles.listPlacementBottom,
              top: styles.listPlacementTop,
            }[listPlacement],
          )}
        >
          {selectList
            .filter((item) => item.id !== selected)
            .map((item) => (
              <div
                key={item.id}
                className={styles.item}
                onClick={() => {
                  setIsOpen(false);
                  onSelectItem(item.id, item.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsOpen(false);
                    onSelectItem(item.id, item.value);
                  }
                }}
                role="option"
                tabIndex={0}
              >
                {item.text}
                {item.icon}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
