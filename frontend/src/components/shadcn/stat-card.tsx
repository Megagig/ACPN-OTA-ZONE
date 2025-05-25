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
          return 'border-blue-200 bg-blue-50';
        case 'success':
          return 'border-green-200 bg-green-50';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50';
        case 'danger':
          return 'border-red-200 bg-red-50';
        case 'info':
          return 'border-cyan-200 bg-cyan-50';
        default:
          return 'border-gray-200 bg-white';
      }
    };

    // Get icon color
    const getIconColor = () => {
      switch (variant) {
        case 'primary':
          return 'text-blue-600';
        case 'success':
          return 'text-green-600';
        case 'warning':
          return 'text-yellow-600';
        case 'danger':
          return 'text-red-600';
        case 'info':
          return 'text-cyan-600';
        default:
          return 'text-gray-600';
      }
    };

    // Get trend indicator
    const getTrendIndicator = () => {
      if (trend === 'up') {
        return (
          <svg
            className="w-3 h-3 text-green-600"
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
            className="w-3 h-3 text-red-600"
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
            <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
            <div className="h-8 w-2/3 bg-gray-300 rounded"></div>
            <div className="h-3 w-1/3 bg-gray-300 rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {title}
              </h3>
              {icon && <span className={cn(getIconColor())}>{icon}</span>}
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{value}</p>
            </div>
            {(change !== undefined || trend) && (
              <div className="mt-2 flex items-center text-xs">
                {getTrendIndicator()}
                {change !== undefined && (
                  <span
                    className={cn(
                      'font-medium',
                      change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {change >= 0 ? '+' : ''}
                    {change}%
                  </span>
                )}
                <span className="ml-1 text-gray-500">from last period</span>
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
