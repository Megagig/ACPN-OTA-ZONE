import React, { type ReactNode } from 'react';
import {
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';

interface AlertProps {
  children: ReactNode;
  status?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const getIconAndColor = (status: string) => {
  switch (status) {
    case 'success':
      return {
        icon: FaCheckCircle,
        iconClass: 'text-green-500',
        bgClass: 'bg-green-100 border-green-200',
      };
    case 'warning':
      return {
        icon: FaExclamationTriangle,
        iconClass: 'text-orange-500',
        bgClass: 'bg-orange-100 border-orange-200',
      };
    case 'error':
      return {
        icon: FaTimesCircle,
        iconClass: 'text-red-500',
        bgClass: 'bg-red-100 border-red-200',
      };
    case 'info':
    default:
      return {
        icon: FaInfoCircle,
        iconClass: 'text-blue-500',
        bgClass: 'bg-blue-100 border-blue-200',
      };
  }
};

export const Alert: React.FC<AlertProps> = ({
  children,
  status = 'info',
  className = '',
  ...rest
}) => {
  const { bgClass } = getIconAndColor(status);

  return (
    <div
      className={`${bgClass} rounded-md p-4 border relative ${className}`}
      {...rest}
    >
      <div className="flex">{children}</div>
    </div>
  );
};

export const AlertIcon: React.FC<{
  status?: 'info' | 'success' | 'warning' | 'error';
}> = ({ status = 'info' }) => {
  const { icon: IconComponent, iconClass } = getIconAndColor(status);

  return <IconComponent className={`${iconClass} mr-2`} />;
};
