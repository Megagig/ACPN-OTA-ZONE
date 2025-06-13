import apiClient from '../utils/apiClient';

// Define interfaces locally to avoid import issues
export interface MessageThread {
  _id: string;
  participants: string[];
  subject: string;
  threadType: 'direct' | 'group';
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  participantDetails?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  }>;
  lastMessageByDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  messages?: ThreadMessage[];
}

export interface ThreadMessage {
  _id: string;
  threadId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'system';
  replyTo?: string;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  senderDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  replyToDetails?: ThreadMessage;
}

export interface CreateThreadData {
  subject: string;
  participants: string[];
  message: string;
  threadType?: 'direct' | 'group';
}

export interface SendMessageData {
  content: string;
  messageType?: 'text' | 'system';
  replyTo?: string;
}

export interface SearchUsersResponse {
  success: boolean;
  data: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  }[];
}

class MessageService {
  private baseURL = '/api/messages';

  // Get all threads for current user
  async getThreads(page = 1, limit = 20): Promise<MessageThread[]> {
    try {
      const response = await apiClient.get(`${this.baseURL}/threads`, {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  // Get a specific thread with messages
  async getThread(threadId: string): Promise<MessageThread> {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/threads/${threadId}`
      );
      const { thread, messages } = response.data.data;
      return {
        ...thread,
        messages,
      };
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw error;
    }
  }

  // Create a new thread
  async createThread(data: CreateThreadData): Promise<MessageThread> {
    try {
      const response = await apiClient.post(`${this.baseURL}/threads`, data);
      const { thread, firstMessage } = response.data.data;
      return {
        ...thread,
        messages: [firstMessage],
      };
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  // Send a message to a thread
  async sendMessage(
    threadId: string,
    data: SendMessageData
  ): Promise<ThreadMessage> {
    try {
      const response = await apiClient.post(
        `${this.baseURL}/threads/${threadId}/messages`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark a message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.patch(`${this.baseURL}/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Mark all messages in a thread as read
  async markThreadAsRead(threadId: string): Promise<void> {
    try {
      await apiClient.patch(`${this.baseURL}/threads/${threadId}/read`);
    } catch (error) {
      console.error('Error marking thread as read:', error);
      throw error;
    }
  }

  // Add participants to a thread
  async addParticipant(threadId: string, userIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.baseURL}/threads/${threadId}/participants`, {
        userIds,
      });
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  }

  // Remove a participant from a thread
  async removeParticipant(threadId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.baseURL}/threads/${threadId}/participants/${userId}`
      );
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  // Update participant role
  async updateParticipantRole(
    threadId: string,
    userId: string,
    role: string
  ): Promise<void> {
    try {
      await apiClient.patch(
        `${this.baseURL}/threads/${threadId}/participants/${userId}/role`,
        {
          role,
        }
      );
    } catch (error) {
      console.error('Error updating participant role:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(
    threadId: string,
    userId: string,
    settings: any
  ): Promise<void> {
    try {
      await apiClient.patch(
        `${this.baseURL}/threads/${threadId}/participants/${userId}/notifications`,
        settings
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Search users for messaging
  async searchUsers(query: string): Promise<SearchUsersResponse['data']> {
    try {
      const response = await apiClient.get(`${this.baseURL}/users/search`, {
        params: { q: query },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseURL}/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Delete a thread
  async deleteThread(threadId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseURL}/threads/${threadId}`);
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();
export default messageService;
