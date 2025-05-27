import React, { useEffect } from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: NotificationType;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const getIconAndColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        icon: FaCheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
      };
    case 'error':
      return {
        icon: FaTimesCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
      };
    case 'warning':
      return {
        icon: FaExclamationTriangle,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700',
      };
    case 'info':
    default:
      return {
        icon: FaInfoCircle,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
      };
  }
};

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  autoClose = true,
  autoCloseTime = 3000,
}) => {
  const {
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
    textColor,
  } = getIconAndColor(type);

  useEffect(() => {
    let timer: number;
    if (isOpen && autoClose) {
      timer = window.setTimeout(() => {
        onClose();
      }, autoCloseTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity">
      <div
        className="absolute inset-0 bg-black opacity-25"
        onClick={onClose}
      ></div>
      <div
        className={`${bgColor} border ${borderColor} rounded-lg shadow-lg p-6 max-w-md w-full z-10 transform transition-all scale-100`}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <h3 className={`text-lg font-medium ${textColor}`}>{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FaTimesCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
