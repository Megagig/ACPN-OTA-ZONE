import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: SelectOption[];
  label?: string;
  error?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options = [],
      label,
      error,
      fullWidth = false,
      onChange,
      onValueChange,
      children,
      ...props
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      onChange?.(value);
      onValueChange?.(value);
    };

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'block rounded-md border-gray-300 shadow-sm',
            'focus:border-primary-500 focus:ring-primary-500',
            'sm:text-sm',
            'py-2 pl-3 pr-10',
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
              : '',
            fullWidth ? 'w-full' : '',
            className
          )}
          onChange={handleChange}
          {...props}
        >
          {children ||
            options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Additional exports for compatibility
const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
const SelectItem = ({
  value,
  children,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);
const SelectTrigger = Select;
const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <option value="">{placeholder}</option>
);

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
