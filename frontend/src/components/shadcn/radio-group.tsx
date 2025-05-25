import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface RadioOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      name,
      options,
      value,
      defaultValue,
      onChange,
      orientation = 'vertical',
      ...props
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          orientation === 'horizontal' && 'flex flex-row space-y-0 space-x-4',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <div key={option.id} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={option.id}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                defaultChecked={defaultValue === option.value}
                disabled={option.disabled}
                onChange={handleChange}
                className={cn(
                  'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500',
                  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                )}
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor={option.id}
                className={cn(
                  'font-medium text-gray-900',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  !option.disabled && 'cursor-pointer'
                )}
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-gray-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
