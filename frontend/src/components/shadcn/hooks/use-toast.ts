import * as React from 'react';

// Toast Context
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Hook for toast utility functions that is safe to use in components
export function useToastUtils() {
  const { addToast } = useToast();
  
  return React.useMemo(() => ({
    info: (message: string, description?: string) => {
      addToast({ message, description, type: 'info' });
    },
    success: (message: string, description?: string) => {
      addToast({ message, description, type: 'success' });
    },
    warning: (message: string, description?: string) => {
      addToast({ message, description, type: 'warning' });
    },
    error: (message: string, description?: string) => {
      addToast({ message, description, type: 'error' });
    },
  }), [addToast]);
}
