// Types for Communication Management
export type CommunicationType =
  | 'announcement'
  | 'email'
  | 'sms'
  | 'private_message';

export type CommunicationStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export type RecipientType =
  | 'all_members'
  | 'executives'
  | 'committee'
  | 'specific_members';

export interface CommunicationRecipient {
  _id: string;
  communication: string; // Reference to communication ID
  user: string; // Reference to user ID
  userName: string;
  email?: string;
  phone?: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  readStatus: boolean;
  readAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Communication {
  _id: string;
  title: string;
  content: string;
  type: CommunicationType;
  status: CommunicationStatus;
  sender: string; // Reference to user ID
  senderName: string;
  recipientType: RecipientType;
  specificRecipients?: string[]; // Array of user IDs
  scheduledFor?: string;
  sentAt?: string;
  attachments?: string[]; // Array of attachment URLs
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunicationSummary {
  total: number;
  sent: number;
  draft: number;
  scheduled: number;
  byType: Record<CommunicationType, number>;
  recentCommunications: Communication[];
}

export interface CommunicationThreadItem {
  _id: string;
  sender: string; // user ID
  senderName: string;
  recipient: string; // user ID
  recipientName: string;
  message: string;
  readStatus: boolean;
  readAt?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommunicationThread {
  _id: string;
  participants: string[]; // Array of user IDs
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: CommunicationThreadItem[];
  createdAt: string;
  updatedAt?: string;
}
