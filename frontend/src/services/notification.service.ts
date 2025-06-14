import api from './api';

export interface UserNotification {
  _id: string;
  userId: string;
  communicationId?: string;
  type: 'communication' | 'announcement' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  isDisplayed: boolean;
  displayedAt?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  communicationId_details?: {
    _id: string;
    subject: string;
    messageType: string;
    priority: string;
    senderUserId: string;
    sentDate: string;
  };
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
  readCount: number;
  typeStats: Array<{ _id: string; count: number }>;
  priorityStats: Array<{ _id: string; count: number }>;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: 'communication' | 'announcement' | 'system';
  unreadOnly?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  data: UserNotification[];
}

class NotificationService {
  private baseURL = 'notifications'; // Remove the leading slash to prevent double /api

  // Get user's notifications
  async getNotifications(
    params: GetNotificationsParams = {}
  ): Promise<NotificationResponse> {
    try {
      const response = await api.get(this.baseURL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notifications (for login popup and dashboard widget)
  async getUnreadNotifications(
    limit: number = 20
  ): Promise<NotificationResponse> {
    try {
      const response = await api.get(`${this.baseURL}/unread`, {
        params: { limit },
      });
      console.log('Unread notifications fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string
  ): Promise<{ success: boolean; data: UserNotification }> {
    try {
      const response = await api.put(`${this.baseURL}/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; modifiedCount: number }> {
    try {
      const response = await api.put(`${this.baseURL}/mark-all-read`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`${this.baseURL}/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    success: boolean;
    data: NotificationStats;
  }> {
    try {
      const response = await api.get(`${this.baseURL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Helper method to format notification date
  formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  // Helper method to get priority badge color
  getPriorityBadgeColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Helper method to get type badge color
  getTypeBadgeColor(type: string): string {
    switch (type) {
      case 'announcement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'communication':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'system':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Helper method to get notification icon
  getNotificationIcon(type: string, priority: string): string {
    if (priority === 'urgent') {
      return 'fas fa-exclamation-triangle';
    }

    switch (type) {
      case 'announcement':
        return 'fas fa-bullhorn';
      case 'communication':
        return 'fas fa-envelope';
      case 'system':
        return 'fas fa-cog';
      default:
        return 'fas fa-bell';
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
