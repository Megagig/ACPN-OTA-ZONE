import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Allow clicking outside the dialog to close it */
  closeOnOutsideClick?: boolean;
  /** Allow pressing Escape key to close the dialog */
  closeOnEsc?: boolean;
  /** Maximum width of the dialog */
  maxWidth?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | 'full';
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  children,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  maxWidth = 'md',
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnEsc, isOpen, onClose]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      closeOnOutsideClick &&
      dialogRef.current &&
      !dialogRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  // Prevent scrolling when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Maximum width classes
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        className={cn(
          'bg-white rounded-lg shadow-xl overflow-hidden relative w-full',
          maxWidthClasses[maxWidth]
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 p-6 border-b border-gray-200',
      className
    )}
    {...props}
  />
);

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = ({ className, ...props }: DialogTitleProps) => (
  <h2
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
);

interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => (
  <p className={cn('text-sm text-gray-500', className)} {...props} />
);

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = ({ className, ...props }: DialogContentProps) => (
  <div className={cn('p-6', className)} {...props} />
);

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <div
    className={cn(
      'flex items-center justify-end space-x-2 p-6 pt-0',
      className
    )}
    {...props}
  />
);

interface DialogCloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose: () => void;
}

const DialogCloseButton = ({
  className,
  onClose,
  ...props
}: DialogCloseButtonProps) => (
  <button
    className={cn(
      'absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400',
      className
    )}
    onClick={onClose}
    aria-label="Close dialog"
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
);

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogCloseButton,
};
