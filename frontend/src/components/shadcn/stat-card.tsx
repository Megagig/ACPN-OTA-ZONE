import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      icon,
      change,
      variant = 'default',
      isLoading = false,
      trend,
      ...props
    },
    ref
  ) => {
    // Get the appropriate color classes based on variant
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30';
        case 'success':
          return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30';
        case 'warning':
          return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30';
        case 'danger':
          return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30';
        case 'info':
          return 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30';
        default:
          return 'border-border bg-card';
      }
    };

    // Get icon color
    const getIconColor = () => {
      switch (variant) {
        case 'primary':
          return 'text-blue-600 dark:text-blue-400';
        case 'success':
          return 'text-green-600 dark:text-green-400';
        case 'warning':
          return 'text-yellow-600 dark:text-yellow-400';
        case 'danger':
          return 'text-red-600 dark:text-red-400';
        case 'info':
          return 'text-cyan-600 dark:text-cyan-400';
        default:
          return 'text-muted-foreground';
      }
    };

    // Get trend indicator
    const getTrendIndicator = () => {
      if (trend === 'up') {
        return (
          <svg
            className="w-3 h-3 text-green-600 dark:text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L20 12L16 12L16 20L8 20L8 12L4 12L12 4Z"
              fill="currentColor"
            />
          </svg>
        );
      } else if (trend === 'down') {
        return (
          <svg
            className="w-3 h-3 text-red-600 dark:text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 20L4 12L8 12L8 4L16 4L16 12L20 12L12 20Z"
              fill="currentColor"
            />
          </svg>
        );
      }
      return null;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg border overflow-hidden shadow-sm p-6',
          getVariantClasses(),
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/2 bg-muted rounded"></div>
            <div className="h-8 w-2/3 bg-muted rounded"></div>
            <div className="h-3 w-1/3 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </h3>
              {icon && <span className={cn(getIconColor())}>{icon}</span>}
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-foreground">{value}</p>
            </div>
            {(change !== undefined || trend) && (
              <div className="mt-2 flex items-center text-xs">
                {getTrendIndicator()}
                {change !== undefined && (
                  <span
                    className={cn(
                      'font-medium',
                      change >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {change >= 0 ? '+' : ''}
                    {change}%
                  </span>
                )}
                <span className="ml-1 text-muted-foreground">
                  from last period
                </span>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);
StatCard.displayName = 'StatCard';

export { StatCard };
