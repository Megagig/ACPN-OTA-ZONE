import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import notificationService, {
  type UserNotification,
  type NotificationStats,
} from '../services/notification.service';
import SocketService from '../services/socket.service';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  fetchNotifications: (params?: any) => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socketService] = useState(() => new SocketService());

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params: any = {}) => {
      if (!user) return;

      setIsLoading(true);
      try {
        const response = await notificationService.getNotifications(params);
        setNotifications(response.data);
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch unread notifications
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching unread notifications...');
      const response = await notificationService.getUnreadNotifications();
      console.log('Unread notifications response:', response);
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
      // Don't return response to match Promise<void> signature
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Refresh stats
      refreshStats();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);

      // Refresh stats
      refreshStats();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);

        // Remove from local state
        const notificationToDelete = notifications.find(
          (n) => n._id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );

        // Update unread count if notification was unread
        if (notificationToDelete && !notificationToDelete.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Refresh stats
        refreshStats();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [notifications]
  );

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationService.getNotificationStats();
      setStats(response.data);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  }, [user]);

  // Handle real-time notification updates
  const handleNewNotification = useCallback(
    (notification: UserNotification) => {
      console.log('Received new notification via Socket.io:', notification);
      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev]);

      // Increment unread count if notification is unread
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Refresh stats
      refreshStats();
    },
    [refreshStats]
  );

  // Initial load of notifications when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading notifications');
      // Only fetch notifications once when user is authenticated
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setStats(null);
    }
  }, [user, fetchNotifications]);

  // Initialize socket listeners when user is authenticated
  useEffect(() => {
    if (user && socketService.isConnected()) {
      console.log('Setting up real-time notification listeners');
      // Listen for new notifications
      socketService.getSocket()?.on('new_notification', handleNewNotification);

      // Cleanup on unmount
      return () => {
        socketService
          .getSocket()
          ?.off('new_notification', handleNewNotification);
      };
    } else {
      console.log(
        'Socket not connected or user not authenticated in NotificationContext'
      );
    }
  }, [user, handleNewNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    stats,
    isLoading,
    fetchNotifications,
    fetchUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshStats,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
