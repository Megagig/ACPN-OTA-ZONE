import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: number; // percentage change
  className?: string;
  isLoading?: boolean;
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  className = '',
  isLoading = false,
}: StatCardProps) => {
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
            {icon && <span className="text-blue-500">{icon}</span>}
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
