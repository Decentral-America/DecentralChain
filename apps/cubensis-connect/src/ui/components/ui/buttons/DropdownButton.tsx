import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Button } from './Button';
import * as styles from './dropdownButton.module.styl';

interface Props extends React.ComponentProps<'div'> {
  children?: React.ReactElement[] | undefined;
  placement?: 'top' | 'bottom' | undefined;
}

export function DropdownButton({ children, placement = 'bottom', className }: Props) {
  const [showList, setShowList] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showList) return;

    function handleClickOut(e: MouseEvent) {
      let el = e.target as Node | null;
      while (el) {
        if (el === elementRef.current) return;
        el = el.parentElement;
      }
      setShowList(false);
    }

    document.addEventListener('click', handleClickOut, { capture: true });
    return () => {
      document.removeEventListener('click', handleClickOut, { capture: true });
    };
  }, [showList]);

  const [defaultItem, ...otherItems] = children as React.ReactElement[];

  return (
    <div className={clsx(styles.splitButton, className, 'buttons-group')} ref={elementRef}>
      <div className="relative flex">
        {defaultItem}

        <div className={clsx(styles.arrowButton)}>
          <Button
            type="button"
            view={
              // biome-ignore lint/suspicious/noExplicitAny: ReactElement<any> required to access .props.view on a generic React child
              (defaultItem as React.ReactElement<any>).props.view
            }
            onClick={() => setShowList((prev) => !prev)}
            className={clsx(styles.dropdownButton)}
          />
        </div>
      </div>

      {showList && (
        <div className={clsx(styles.list, placement === 'top' && styles.listPlacementTop)}>
          {otherItems.map((item, index) => (
            <div key={item.key ?? String(index)} className={styles.listItem}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
