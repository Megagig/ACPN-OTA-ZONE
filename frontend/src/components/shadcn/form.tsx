import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return <form ref={ref} className={cn('space-y-6', className)} {...props} />;
  }
);
Form.displayName = 'Form';

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the FormGroup will take the full width of its container */
  fullWidth?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, fullWidth = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', fullWidth && 'w-full', className)}
        {...props}
      />
    );
  }
);
FormGroup.displayName = 'FormGroup';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the label is required */
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-gray-700', className)}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm font-medium text-red-500', className)}
        {...props}
      />
    );
  }
);
FormError.displayName = 'FormError';

interface FormFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormFooter = React.forwardRef<HTMLDivElement, FormFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end space-x-2 pt-4',
          className
        )}
        {...props}
      />
    );
  }
);
FormFooter.displayName = 'FormFooter';

export { Form, FormGroup, FormLabel, FormDescription, FormError, FormFooter };
