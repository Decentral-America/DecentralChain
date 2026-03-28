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
      // biome-ignore lint/suspicious/noExplicitAny: ReactElement<any> required for dynamic .props access in cloneElement wrapper
      (elem as React.ReactElement<any>).props &&
      // biome-ignore lint/suspicious/noExplicitAny: ReactElement<any> required for dynamic .props access in cloneElement wrapper
      typeof (elem as React.ReactElement<any>).props.onClick === 'function'
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: ReactElement<any> required for dynamic .props access in cloneElement wrapper
      (elem as React.ReactElement<any>).props.onClick(event);
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: ReactElement<any> required for dynamic .props access in cloneElement wrapper
  return cloneElement(elem as React.ReactElement<any>, {
    ...props,
    onClick: handleClick,
  });
}
