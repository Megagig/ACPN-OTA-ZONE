import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import type { UserNotification } from '../../services/notification.service';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotification();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<
    'all' | 'communication' | 'announcement' | 'system'
  >('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadFilter =
      filter === 'all' ||
      (filter === 'read' && notification.isRead) ||
      (filter === 'unread' && !notification.isRead);

    const matchesTypeFilter =
      selectedType === 'all' || notification.type === selectedType;

    return matchesReadFilter && matchesTypeFilter;
  });

  const handleNotificationClick = async (notification: UserNotification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type and data
    if (notification.communicationId) {
      navigate(`/communications/${notification.communicationId}`);
    } else if (notification.type === 'system') {
      navigate('/dashboard');
    } else {
      // Default to messages page for other notifications
      navigate('/messages');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'fas fa-exclamation-triangle text-red-600';
      case 'high':
        return 'fas fa-exclamation-circle text-orange-600';
      case 'normal':
        return 'fas fa-info-circle text-blue-600';
      default:
        return 'fas fa-bell text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'communication':
        return 'fas fa-envelope';
      case 'announcement':
        return 'fas fa-bullhorn';
      case 'system':
        return 'fas fa-cog';
      default:
        return 'fas fa-bell';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Stay updated with the latest announcements and communications
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-card rounded-lg shadow p-4 mb-6 border border-border">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Read Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-foreground">
                  Status:
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-background border border-border rounded px-3 py-1 text-sm text-foreground"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-foreground">
                  Type:
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="bg-background border border-border rounded px-3 py-1 text-sm text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="communication">Communications</option>
                  <option value="announcement">Announcements</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                <i className="fas fa-check-double mr-2"></i>
                Mark All Read
              </button>
              <button
                onClick={() => fetchNotifications()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                <i className="fas fa-sync mr-2"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Total: {notifications.length}</span>
              <span>
                Unread: {notifications.filter((n) => !n.isRead).length}
              </span>
              <span>Filtered: {filteredNotifications.length}</span>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800">
                <i className="fas fa-bell-slash text-gray-400 text-xl"></i>
              </div>
              <h3 className="mt-2 text-lg font-medium text-foreground">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'all'
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-card rounded-lg shadow border-l-4 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                  notification.priority
                )} ${
                  !notification.isRead
                    ? 'ring-2 ring-blue-500 ring-opacity-20'
                    : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Priority & Type Icons */}
                      <div className="flex flex-col items-center space-y-1">
                        <i
                          className={`${getPriorityIcon(
                            notification.priority
                          )} text-lg`}
                        ></i>
                        <i
                          className={`${getTypeIcon(
                            notification.type
                          )} text-sm text-gray-500`}
                        ></i>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              New
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <i className="fas fa-clock mr-1"></i>
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <span className="flex items-center capitalize">
                            <i className="fas fa-tag mr-1"></i>
                            {notification.type}
                          </span>

                          <span className="flex items-center capitalize">
                            <i className="fas fa-flag mr-1"></i>
                            {notification.priority}
                          </span>

                          {notification.readAt && (
                            <span className="flex items-center text-green-600">
                              <i className="fas fa-check mr-1"></i>
                              Read{' '}
                              {new Date(
                                notification.readAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              'Are you sure you want to delete this notification?'
                            )
                          ) {
                            deleteNotification(notification._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete notification"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed for pagination) */}
        {filteredNotifications.length > 0 &&
          filteredNotifications.length >= 20 && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchNotifications({ page: 2 })}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
              >
                Load More
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default NotificationsPage;
