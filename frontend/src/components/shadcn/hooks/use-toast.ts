import * as React from 'react';

// Toast types and interfaces
export type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export interface Toast extends ToastProps {
  id: string;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: ToastProps) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = React.useCallback(
    (props: ToastProps) => {
      context.addToast(props);
    },
    [context]
  );

  return { toast };
}
