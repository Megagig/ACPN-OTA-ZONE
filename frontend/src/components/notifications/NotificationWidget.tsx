import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import notificationService from '../../services/notification.service';

const NotificationWidget: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotification();

  // Show only the first 5 notifications in the widget
  const displayNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.communicationId) {
      navigate(`/communications/${notification.communicationId}`);
    } else if (notification.type === 'system') {
      navigate('/dashboard');
    } else {
      navigate('/messages');
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow p-5 border border-border hover:border-primary/40 transition-colors">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full mr-3">
            <i className="fas fa-bell h-5 w-5 text-blue-600 dark:text-blue-400"></i>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">Stay updated</p>
          </div>
        </div>

        <div className="text-center py-6">
          <div className="text-muted-foreground text-3xl mb-2">
            <i className="fas fa-bell-slash"></i>
          </div>
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow border border-border hover:border-primary/40 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full mr-3">
            <i className="fas fa-bell h-4 w-4 text-blue-600 dark:text-blue-400"></i>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {displayNotifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors ${
              !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div
                className={`flex-shrink-0 p-1.5 rounded-full ${
                  notification.priority === 'urgent'
                    ? 'bg-red-100 text-red-600'
                    : notification.priority === 'high'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                <i
                  className={`${notificationService.getNotificationIcon(
                    notification.type,
                    notification.priority
                  )} text-xs`}
                ></i>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        !notification.isRead
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notificationService.formatNotificationDate(
                        notification.createdAt
                      )}
                    </p>
                  </div>

                  {/* Priority/Type Badge */}
                  <div className="flex items-center space-x-1 ml-2">
                    {notification.priority === 'urgent' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Urgent
                      </span>
                    )}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 bg-accent/30 border-t border-border">
        <button
          onClick={handleViewAll}
          className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationWidget;
