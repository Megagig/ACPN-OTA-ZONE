import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Add a label showing the percentage */
  showValue?: boolean;
  /** Size of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant of the progress bar */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Whether to show animation when the value changes */
  animated?: boolean;
  /** Whether to show a striped pattern */
  striped?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      showValue = false,
      size = 'md',
      variant = 'default',
      animated = false,
      striped = false,
      ...props
    },
    ref
  ) => {
    // Ensure value is between 0 and max
    const safeValue = Math.max(0, Math.min(value, max));
    const percentage = (safeValue / max) * 100;

    // Size-based classes
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-4',
    };

    // Variant-based classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'success':
          return 'bg-green-600 dark:bg-green-500';
        case 'warning':
          return 'bg-yellow-500 dark:bg-yellow-400';
        case 'error':
          return 'bg-red-600 dark:bg-red-500';
        case 'default':
        default:
          return 'bg-primary';
      }
    };

    // Animation and striped pattern classes
    const animationClasses = animated
      ? 'transition-all duration-300 ease-in-out'
      : '';
    const stripedClasses = striped ? 'bg-stripes bg-stripes-white/20' : '';

    return (
      <div className={cn('relative', className)} {...props} ref={ref}>
        <div
          className={cn(
            'w-full overflow-hidden bg-muted rounded-full',
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              'rounded-full',
              sizeClasses[size],
              getVariantClasses(),
              animationClasses,
              stripedClasses
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={safeValue}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>

        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'text-xs font-medium',
                size === 'sm' ? 'hidden' : 'block',
                percentage > 55 ? 'text-white' : 'text-foreground'
              )}
            >
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
