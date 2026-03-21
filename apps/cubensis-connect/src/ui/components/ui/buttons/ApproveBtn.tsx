import { useEffect, useRef, useState } from 'react';

import { Button } from './Button';

interface Props extends React.ComponentProps<'button'> {
  autoClickProtection?: boolean | undefined;
  loading?: boolean | undefined;
  view?: 'submit' | undefined;
}

export function ApproveBtn({
  autoClickProtection,
  disabled,
  loading,
  children,
  ...otherProps
}: Props) {
  const [timerEnd, setTimerEnd] = useState<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!autoClickProtection) return;

    const tick = () => {
      const now = Date.now();
      setTimerEnd((prev) => {
        const end = prev ?? now + 2000;
        if (end >= now) {
          timeoutRef.current = setTimeout(tick, 100);
        }
        return end;
      });
    };

    tick();

    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, [autoClickProtection]);

  const pending = autoClickProtection && (!timerEnd || timerEnd > Date.now());

  return (
    <Button {...otherProps} disabled={!!(disabled || loading || pending)} loading={loading}>
      {!loading && children}
    </Button>
  );
}
