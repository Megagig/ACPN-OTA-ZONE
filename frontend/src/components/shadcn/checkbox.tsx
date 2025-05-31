import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, label, description, onCheckedChange, onChange, ...props },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      onCheckedChange?.(event.target.checked);
    };

    return (
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border border-input text-primary focus:ring-primary',
            'checked:bg-primary checked:border-transparent',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'transition-colors duration-200 ease-in-out cursor-pointer',
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={props.id}
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
