import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../lib/utils/cn';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    toast: context.addToast,
    dismiss: context.removeToast,
    toasts: context.toasts,
  };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Toast: React.FC<ToastProps & { onClose: () => void }> = ({
  title,
  description,
  variant = 'default',
  onClose,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 text-white border-red-700';
      case 'success':
        return 'bg-green-600 text-white border-green-700';
      case 'warning':
        return 'bg-yellow-600 text-white border-yellow-700';
      default:
        return 'bg-white text-gray-900 border-gray-200 shadow-lg';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 max-w-sm transition-all duration-300 ease-in-out',
        getVariantClasses()
      )}
    >
      <div className="flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {description && (
          <div className={cn('text-sm', title && 'mt-1')}>{description}</div>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
  );
};

export { Toast };
