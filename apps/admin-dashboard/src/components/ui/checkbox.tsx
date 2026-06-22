import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer select-none group">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={cn(
            'h-4 w-4 rounded border border-input bg-transparent accent-primary',
            'focus:outline-none focus:ring-1 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        {label && (
          <span className="text-sm text-foreground group-has-[:disabled]:opacity-50">{label}</span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
