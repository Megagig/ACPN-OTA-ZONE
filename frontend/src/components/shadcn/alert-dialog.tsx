import * as React from 'react';
import { cn } from '../../lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open = false,
  onOpenChange,
  children,
}) => {
  return (
    <Dialog isOpen={open} onClose={() => onOpenChange?.(false)}>
      {children}
    </Dialog>
  );
};

export interface AlertDialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional variant for different alert dialog styles */
  variant?: 'default' | 'destructive' | 'warning';
}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({
  className,
  ...props
}) => (
  <DialogContent className={cn('sm:max-w-[425px]', className)} {...props} />
);

export interface AlertDialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Show close button in header */
  showCloseButton?: boolean;
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  className,
  ...props
}) => <DialogHeader className={className} {...props} />;

export interface AlertDialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Reverse the order of action buttons */
  reverseActions?: boolean;
}

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  className,
  ...props
}) => <DialogFooter className={className} {...props} />;

export interface AlertDialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Icon to show next to the title */
  icon?: React.ReactNode;
}

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({
  className,
  ...props
}) => <DialogTitle className={className} {...props} />;

export interface AlertDialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Emphasize the description text */
  emphasized?: boolean;
}

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({
  className,
  ...props
}) => <DialogDescription className={className} {...props} />;

export interface AlertDialogActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Loading state for the action button */
  loading?: boolean;
}

export const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(({ className, ...props }, ref) => (
  <Button ref={ref} variant="default" className={className} {...props} />
));
AlertDialogAction.displayName = 'AlertDialogAction';

export interface AlertDialogCancelProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Show as text button instead of outlined button */
  asText?: boolean;
}

export const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps
>(({ className, ...props }, ref) => (
  <Button ref={ref} variant="outline" className={className} {...props} />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';
