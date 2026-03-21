import copy from 'copy-to-clipboard';
import { Children, cloneElement } from 'react';

interface Props {
  text?: string | null | undefined;
  children: React.ReactNode;
  options?: {
    debug?: boolean | undefined;
    message?: string | undefined;
    format?: string; // MIME type
    onCopy?: ((clipboardData: object) => void) | undefined;
  };
  onCopy?: ((...args: unknown[]) => void) | undefined;
}

export function Copy({
  text = '',
  onCopy,
  children,
  options = { format: 'text/plain' },
  ...props
}: Props) {
  const elem = Children.only(children);

  function handleClick(event: { stopPropagation: () => void; preventDefault: () => void }) {
    event.stopPropagation();
    event.preventDefault();

    const result = copy(text ?? '', options as Parameters<typeof copy>[1]);

    if (onCopy) {
      onCopy(text, result);
    }

    if (
      elem &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (elem as React.ReactElement<any>).props &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (elem as React.ReactElement<any>).props.onClick === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (elem as React.ReactElement<any>).props.onClick(event);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cloneElement(elem as React.ReactElement<any>, {
    ...props,
    onClick: handleClick,
  });
}
