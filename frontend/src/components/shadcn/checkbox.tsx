import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border border-gray-300 text-primary-600 focus:ring-primary-500',
            'checked:bg-primary-600 checked:border-transparent',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'transition-colors duration-200 ease-in-out cursor-pointer',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={props.id}
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
