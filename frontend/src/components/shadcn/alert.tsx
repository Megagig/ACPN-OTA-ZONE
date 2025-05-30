import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The type of alert */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Include an icon based on the variant */
  withIcon?: boolean;
  /** Makes the alert dismissible */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      withIcon = true,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    // Get variant-specific styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'success':
          return 'bg-green-50 border-green-400 text-green-800';
        case 'error':
          return 'bg-red-50 border-red-400 text-red-800';
        case 'warning':
          return 'bg-yellow-50 border-yellow-400 text-yellow-800';
        case 'info':
        default:
          return 'bg-blue-50 border-blue-400 text-blue-800';
      }
    };

    // Get variant-specific icon
    const getIcon = () => {
      switch (variant) {
        case 'success':
          return (
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          );
        case 'error':
          return (
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          );
        case 'warning':
          return (
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          );
        case 'info':
        default:
          return (
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border-l-4 p-4 rounded-r-md',
          getVariantStyles(),
          className
        )}
        role="alert"
        {...props}
      >
        <div className="flex">
          {withIcon && <div className="flex-shrink-0 mr-3">{getIcon()}</div>}
          <div className="flex-1">{children}</div>
          {dismissible && (
            <div className="flex-shrink-0 ml-3">
              <button
                type="button"
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h4
        ref={ref}
        className={cn('font-medium text-sm', className)}
        {...props}
      />
    );
  }
);
AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm mt-1', className)} {...props} />;
});
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
