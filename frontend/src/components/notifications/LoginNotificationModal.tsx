import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { UserNotification } from '../../services/notification.service';

interface LoginNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginNotificationModal: React.FC<LoginNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { markAsRead } = useNotification();
  const [loginNotifications, setLoginNotifications] = useState<
    UserNotification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      fetchLoginNotifications();
    }
  }, [isOpen, user]);

  const fetchLoginNotifications = async () => {
    setIsLoading(true);
    try {
      // Import the service here to avoid circular dependencies
      const { default: notificationService } = await import(
        '../../services/notification.service'
      );
      const response = await notificationService.getUnreadNotifications();

      setLoginNotifications(response.data);
    } catch (error) {
      console.error('Error fetching login notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < loginNotifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    // Remove from local state
    setLoginNotifications((prev) =>
      prev.filter((n) => n._id !== notificationId)
    );

    // Adjust current index if needed
    if (currentIndex >= loginNotifications.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDismissAll = async () => {
    // Mark all as read
    for (const notification of loginNotifications) {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
    }
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'fas fa-exclamation-triangle';
      case 'high':
        return 'fas fa-exclamation-circle';
      case 'normal':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  };

  if (!isOpen || !user || loginNotifications.length === 0) {
    return null;
  }

  const currentNotification = loginNotifications[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-bell text-xl mr-3"></i>
              <div>
                <h2 className="text-lg font-semibold">
                  Welcome back, {user.firstName}!
                </h2>
                <p className="text-sm opacity-90">
                  You have {loginNotifications.length} new notification
                  {loginNotifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Notification Content */}
        {!isLoading && currentNotification && (
          <div className="p-6">
            {/* Notification Counter */}
            {loginNotifications.length > 1 && (
              <div className="text-center mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} of {loginNotifications.length}
                </span>
              </div>
            )}

            {/* Notification Card */}
            <div
              className={`border-l-4 p-4 rounded-lg ${getPriorityColor(
                currentNotification.priority
              )} mb-4`}
            >
              <div className="flex items-start">
                <i
                  className={`${getPriorityIcon(
                    currentNotification.priority
                  )} text-lg mr-3 mt-1`}
                ></i>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {currentNotification.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {currentNotification.message}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(
                        currentNotification.createdAt
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="capitalize">
                      {currentNotification.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleMarkAsRead(currentNotification._id)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-check mr-2"></i>
                Mark as Read
              </button>

              {currentNotification.communicationId && (
                <button
                  onClick={() => {
                    // Navigate to the communication
                    window.location.href = `/communications/${currentNotification.communicationId}`;
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View Details
                </button>
              )}
            </div>

            {/* Navigation Controls */}
            {loginNotifications.length > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left mr-2"></i>
                  Previous
                </button>

                <div className="flex space-x-2">
                  {loginNotifications.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === loginNotifications.length - 1}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <i className="fas fa-chevron-right ml-2"></i>
                </button>
              </div>
            )}

            {/* Dismiss All Button */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleDismissAll}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 text-sm"
              >
                Dismiss All & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginNotificationModal;
