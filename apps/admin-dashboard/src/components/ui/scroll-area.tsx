import type * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string;
}

function ScrollArea({
  className,
  maxHeight = '400px',
  style,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn('overflow-auto scrollbar-thin', className)}
      style={{ maxHeight, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export { ScrollArea };
