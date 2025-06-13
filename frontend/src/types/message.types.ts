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

export interface ThreadParticipant {
  _id: string;
  threadId: string;
  userId: string;
  role: 'member' | 'admin';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  // Populated fields
  userDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

export interface CreateThreadRequest {
  subject: string;
  participants: string[];
  message: string;
  threadType?: 'direct' | 'group';
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'system';
  replyTo?: string;
}

export interface UserSearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

// Legacy types for backward compatibility with existing communication service
export interface CommunicationThread {
  _id: string;
  participants: string[];
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: CommunicationThreadItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationThreadItem {
  _id: string;
  sender: string;
  senderName: string;
  recipient: string;
  recipientName: string;
  message: string;
  readStatus: boolean;
  readAt?: string;
  attachments?: string[];
  createdAt: string;
}
