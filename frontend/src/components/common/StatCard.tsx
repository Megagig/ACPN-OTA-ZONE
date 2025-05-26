import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change?: number; // percentage change
  className?: string;
  isLoading?: boolean;
  colorScheme?: 'blue' | 'green' | 'red' | 'gray' | 'purple' | 'teal';
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  className = '',
  isLoading = false,
  colorScheme = 'blue',
}: StatCardProps) => {
  // Function to render the icon properly
  const renderIcon = () => {
    if (!icon) return null;

    // If icon is a React component (function), render it
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className="w-5 h-5" />;
    }

    // If icon is already a ReactNode, render it directly
    return icon;
  };

  // Get color scheme classes
  const getColorScheme = () => {
    const schemes = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      red: 'text-red-500',
      gray: 'text-gray-500',
      purple: 'text-purple-500',
      teal: 'text-teal-500',
    };
    return schemes[colorScheme] || schemes.blue;
  };
  return (
    <div className={`rounded-lg bg-white shadow-md p-4 ${className}`}>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            {icon && <span className={getColorScheme()}>{renderIcon()}</span>}
          </div>

          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>

          {change !== undefined && (
            <div className="mt-2">
              <span
                className={`text-xs font-medium inline-flex items-center ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <span
                  className={`mr-1 ${
                    change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {change >= 0 ? (
                    <i className="fas fa-arrow-up"></i>
                  ) : (
                    <i className="fas fa-arrow-down"></i>
                  )}
                </span>
                {Math.abs(change)}%{' '}
                <span className="ml-1 text-gray-500">from last month</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatCard;
