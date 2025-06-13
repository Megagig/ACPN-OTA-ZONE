import api from './api';
import type {
  Communication,
  CommunicationRecipient,
  CommunicationSummary,
  CommunicationThread,
  CommunicationThreadItem,
  CommunicationType,
  CommunicationStatus,
  RecipientType,
} from '../types/communication.types';

// Transformation functions to map between frontend and backend formats
const transformBackendToFrontend = (backendComm: any): Communication => {
  return {
    _id: backendComm._id,
    title: backendComm.subject, // Backend uses 'subject', frontend expects 'title'
    content: backendComm.content,
    type: mapBackendTypeToFrontend(
      backendComm.messageType
    ) as CommunicationType,
    status: mapBackendStatusToFrontend(backendComm) as CommunicationStatus,
    sender: backendComm.senderUserId?._id || backendComm.senderUserId,
    senderName: backendComm.senderUserId
      ? `${backendComm.senderUserId.firstName} ${backendComm.senderUserId.lastName}`
      : 'Unknown',
    recipientType: mapBackendRecipientTypeToFrontend(
      backendComm.recipientType
    ) as RecipientType,
    priority: 'normal', // Default priority if not provided
    sentAt: backendComm.sentDate,
    attachments: backendComm.attachmentUrl ? [backendComm.attachmentUrl] : [],
    createdAt: backendComm.createdAt,
    updatedAt: backendComm.updatedAt,
  };
};

const transformFrontendToBackend = (
  frontendComm: Partial<Communication>
): any => {
  return {
    subject: frontendComm.title,
    content: frontendComm.content,
    messageType: mapFrontendTypeToBackend(frontendComm.type),
    recipientType: mapFrontendRecipientTypeToBackend(
      frontendComm.recipientType
    ),
    attachmentUrl: frontendComm.attachments?.[0], // Backend supports single attachment
  };
};

// Type mapping functions
const mapBackendTypeToFrontend = (backendType: string): string => {
  const typeMap: Record<string, string> = {
    announcement: 'announcement',
    newsletter: 'email',
    direct: 'private_message',
  };
  return typeMap[backendType] || 'announcement';
};

const mapFrontendTypeToBackend = (frontendType?: string): string => {
  const typeMap: Record<string, string> = {
    announcement: 'announcement',
    email: 'newsletter',
    sms: 'announcement', // Map SMS to announcement for now
    private_message: 'direct',
  };
  return typeMap[frontendType || 'announcement'] || 'announcement';
};

const mapBackendRecipientTypeToFrontend = (backendType: string): string => {
  const recipientMap: Record<string, string> = {
    all: 'all_members',
    admin: 'executives',
    specific: 'specific_members',
  };
  return recipientMap[backendType] || 'all_members';
};

const mapFrontendRecipientTypeToBackend = (frontendType?: string): string => {
  const recipientMap: Record<string, string> = {
    all_members: 'all',
    executives: 'admin',
    committee: 'admin',
    specific_members: 'specific',
  };
  return recipientMap[frontendType || 'all_members'] || 'all';
};

const mapBackendStatusToFrontend = (backendComm: any): string => {
  // Since backend doesn't have explicit status, infer from data
  if (backendComm.sentDate) {
    return 'sent';
  }
  return 'draft';
};

// Communications API
export const getCommunications = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/communications/admin', { params });
  return response.data.data.map(transformBackendToFrontend);
};

export const getCommunicationById = async (
  id: string
): Promise<Communication> => {
  const response = await api.get(`/communications/${id}`);
  return transformBackendToFrontend(response.data.data);
};

export const createCommunication = async (
  data: Partial<Communication>
): Promise<Communication> => {
  const response = await api.post(
    '/communications',
    transformFrontendToBackend(data)
  );
  return transformBackendToFrontend(response.data.data);
};

export const updateCommunication = async (
  id: string,
  data: Partial<Communication>
): Promise<Communication> => {
  const response = await api.put(
    `/communications/${id}`,
    transformFrontendToBackend(data)
  );
  return transformBackendToFrontend(response.data.data);
};

export const deleteCommunication = async (id: string): Promise<void> => {
  await api.delete(`/communications/${id}`);
};

export const sendCommunication = async (id: string): Promise<Communication> => {
  const response = await api.post(`/communications/${id}/send`);
  return transformBackendToFrontend(response.data.data);
};

export const scheduleCommunication = async (
  id: string,
  scheduledDate: string
): Promise<Communication> => {
  const response = await api.post(`/communications/${id}/schedule`, {
    scheduledDate,
  });
  return transformBackendToFrontend(response.data.data);
};

export const getCommunicationRecipients = async (
  communicationId: string
): Promise<CommunicationRecipient[]> => {
  const response = await api.get(
    `/communications/${communicationId}/recipients`
  );
  return response.data.data;
};

export const getCommunicationSummary =
  async (): Promise<CommunicationSummary> => {
    const response = await api.get('/communications/stats');
    const backendData = response.data.data;

    // Transform backend stats to frontend format
    const messageTypeCounts = backendData.messageTypeCounts || [];
    const recentCommunications = (backendData.recentCommunications || []).map(
      transformBackendToFrontend
    );

    // Calculate totals from messageTypeCounts
    const total = messageTypeCounts.reduce(
      (sum: number, item: any) => sum + item.count,
      0
    );

    // Map backend message types to frontend types and calculate counts
    const byType: Record<string, number> = {
      announcement: 0,
      email: 0,
      sms: 0,
      private_message: 0,
    };

    messageTypeCounts.forEach((item: any) => {
      const frontendType = mapBackendTypeToFrontend(item._id);
      byType[frontendType] = (byType[frontendType] || 0) + item.count;
    });

    // Since backend doesn't track draft/scheduled status explicitly,
    // we'll use placeholder values or derive from sent status
    return {
      total,
      sent: total, // All communications in backend are considered sent
      draft: 0, // Backend doesn't track drafts separately
      scheduled: 0, // Backend doesn't track scheduled separately
      byType: byType as Record<CommunicationType, number>,
      recentCommunications,
    };
  };

// Get user's inbox
export const getUserInbox = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/communications/inbox', { params });
  return response.data.data.map(transformBackendToFrontend);
};

// Get user's sent communications
export const getUserSentCommunications = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/communications/sent', { params });
  return response.data.data.map(transformBackendToFrontend);
};

// Mark communication as read
export const markCommunicationAsRead = async (id: string): Promise<void> => {
  await api.put(`/communications/${id}/read`);
};

// Private Messages / Threads API
export const getThreads = async (): Promise<CommunicationThread[]> => {
  const response = await api.get('/messages/threads');

  // Transform backend format to frontend format
  return response.data.data.map((thread: any) => ({
    _id: thread._id,
    participants: thread.participants.map((p: any) => p._id || p),
    subject: thread.subject,
    lastMessage: thread.lastMessage,
    lastMessageDate: thread.lastMessageAt,
    unreadCount: thread.unreadCount || 0,
    messages: [], // Messages are loaded separately when viewing thread
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  }));
};

export const getThreadById = async (
  id: string
): Promise<CommunicationThread> => {
  const response = await api.get(`/messages/threads/${id}`);
  const thread = response.data.data;

  // Transform backend format to frontend format
  return {
    _id: thread._id,
    participants: thread.participants.map((p: any) => p._id || p),
    subject: thread.subject,
    lastMessage: thread.lastMessage,
    lastMessageDate: thread.lastMessageAt,
    unreadCount: 0, // Thread is being viewed, so unreadCount becomes 0
    messages:
      thread.messages?.map((msg: any) => ({
        _id: msg._id,
        sender: msg.senderId,
        senderName: msg.sender?.firstName + ' ' + msg.sender?.lastName,
        recipient: msg.recipientId,
        recipientName: msg.recipient?.firstName + ' ' + msg.recipient?.lastName,
        message: msg.content,
        readStatus: true, // Assume read when fetching thread
        readAt: msg.readAt,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      })) || [],
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

export const createThread = async (data: {
  recipient: string;
  subject: string;
  message: string;
  attachments?: string[];
}): Promise<CommunicationThread> => {
  const response = await api.post('/messages/threads', {
    participants: [data.recipient],
    subject: data.subject,
    content: data.message,
    attachments: data.attachments,
  });

  const thread = response.data.data;

  // Transform backend format to frontend format
  return {
    _id: thread._id,
    participants: thread.participants,
    subject: thread.subject,
    lastMessage: data.message,
    lastMessageDate: thread.createdAt,
    unreadCount: 1,
    messages: [
      {
        _id: thread.lastMessageId || 'temp-' + Date.now(),
        sender: thread.createdBy,
        senderName: 'You',
        recipient: data.recipient,
        recipientName: 'Recipient',
        message: data.message,
        readStatus: false,
        attachments: data.attachments,
        createdAt: thread.createdAt,
      },
    ],
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

export const sendMessage = async (
  threadId: string,
  message: string,
  attachments?: string[]
): Promise<CommunicationThreadItem> => {
  const response = await api.post(`/messages/threads/${threadId}/messages`, {
    content: message,
    attachments,
  });

  const msg = response.data.data;

  // Transform backend format to frontend format
  return {
    _id: msg._id,
    sender: msg.senderId,
    senderName: msg.sender?.firstName + ' ' + msg.sender?.lastName || 'You',
    recipient: msg.recipientId,
    recipientName:
      msg.recipient?.firstName + ' ' + msg.recipient?.lastName || 'Recipient',
    message: msg.content,
    readStatus: false,
    attachments: msg.attachments,
    createdAt: msg.createdAt,
  };
};

// All exported functions
const communicationService = {
  getCommunications,
  getCommunicationById,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  sendCommunication,
  scheduleCommunication,
  getCommunicationRecipients,
  getCommunicationSummary,
  getUserInbox,
  getUserSentCommunications,
  markCommunicationAsRead,
  getThreads,
  getThreadById,
  createThread,
  sendMessage,
};

export default communicationService;
