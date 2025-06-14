import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, fetchUnreadNotifications, markAsRead } =
    useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications when component mounts
  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      fetchUnreadNotifications();
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-foreground/70 hover:text-primary focus:outline-none"
        aria-label="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg z-50 overflow-hidden border border-border">
          {/* Dropdown Header */}
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <Link
              to="/notifications"
              onClick={() => setIsDropdownOpen(false)}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground">
                <i className="fas fa-bell-slash text-2xl mb-2"></i>
                <p>No new notifications</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 border-b border-border hover:bg-accent/50 cursor-pointer ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification._id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <i
                          className={`fas fa-${
                            notification.type === 'announcement'
                              ? 'bullhorn'
                              : notification.type === 'system'
                              ? 'cog'
                              : 'envelope'
                          } text-primary`}
                        ></i>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="px-4 py-2 bg-card border-t border-border">
            <Link
              to="/notifications"
              onClick={() => setIsDropdownOpen(false)}
              className="block text-center text-sm text-primary hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
