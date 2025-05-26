import React, { type ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  variant?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant,
  className = '',
  ...rest
}) => {
  const borderStyle =
    variant === 'outline' ? 'border border-gray-300' : 'border-0';

  return (
    <div
      className={`shadow-md ${borderStyle} rounded-md bg-white ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
};
