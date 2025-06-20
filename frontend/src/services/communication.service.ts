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
  // Check if sender exists in the communication object and has firstName and lastName
  const senderUser = backendComm.senderUserId || backendComm.sender;
  const senderName =
    senderUser && (senderUser.firstName || senderUser.lastName)
      ? `${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim()
      : backendComm.senderName || 'Unknown';

  return {
    _id: backendComm._id,
    title: backendComm.subject, // Backend uses 'subject', frontend expects 'title'
    content: backendComm.content,
    type: mapBackendTypeToFrontend(
      backendComm.messageType
    ) as CommunicationType,
    status: mapBackendStatusToFrontend(backendComm) as CommunicationStatus,
    sender: senderUser?._id || senderUser || backendComm.sender || '',
    senderName: senderName,
    recipientType: mapBackendRecipientTypeToFrontend(
      backendComm.recipientType
    ) as RecipientType,
    priority: backendComm.priority || 'normal',
    sentAt: backendComm.sentDate,
    attachments: backendComm.attachmentUrl ? [backendComm.attachmentUrl] : [],
    createdAt: backendComm.createdAt,
    updatedAt: backendComm.updatedAt,
  };
};

const transformFrontendToBackend = (
  frontendComm: Partial<Communication>
): any => {
  const transformed: any = {
    subject: frontendComm.title,
    content: frontendComm.content,
    messageType: mapFrontendTypeToBackend(frontendComm.type),
    recipientType: mapFrontendRecipientTypeToBackend(
      frontendComm.recipientType
    ),
    attachmentUrl: frontendComm.attachments?.[0], // Backend supports single attachment
  };

  // If there are specific recipients, include them
  if (
    frontendComm.specificRecipients &&
    frontendComm.specificRecipients.length > 0
  ) {
    transformed.recipientIds = frontendComm.specificRecipients;
  }

  return transformed;
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
    sms: 'announcement',
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
  console.log(
    'Mapping status from backend comm:',
    backendComm.status,
    'sentDate:',
    backendComm.sentDate
  );

  // If status field exists and is not empty, use it directly
  if (backendComm.status && backendComm.status.trim() !== '') {
    return backendComm.status.toLowerCase();
  }

  // Fallback logic for backwards compatibility
  if (backendComm.sentDate) {
    return 'sent';
  }

  if (backendComm.scheduledFor) {
    return 'scheduled';
  }

  return 'draft';
};

// Communications API
export const getCommunications = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/api/communications/admin', { params });
  return response.data.data.map(transformBackendToFrontend);
};

export const getCommunicationById = async (
  id: string
): Promise<Communication> => {
  // Support for query parameters in ID (for cache-busting)
  const cleanId = id.includes('?') ? id.split('?')[0] : id;
  const queryParams = id.includes('?') ? id.substring(id.indexOf('?')) : '';

  const response = await api.get(`/api/communications/${cleanId}${queryParams}`);
  return transformBackendToFrontend(response.data.data);
};

export const createCommunication = async (
  data: Partial<Communication>
): Promise<Communication> => {
  const response = await api.post(
    '/api/communications',
    transformFrontendToBackend(data)
  );
  return transformBackendToFrontend(response.data.data);
};

export const updateCommunication = async (
  id: string,
  data: Partial<Communication>
): Promise<Communication> => {
  const response = await api.put(
    `/api/communications/${id}`,
    transformFrontendToBackend(data)
  );
  return transformBackendToFrontend(response.data.data);
};

export const deleteCommunication = async (id: string): Promise<void> => {
  await api.delete(`/api/communications/${id}`);
};

// Send a draft communication
export const sendCommunication = async (id: string): Promise<Communication> => {
  console.log('Sending communication request for ID:', id);
  const response = await api.post(`/api/communications/${id}/send`);
  console.log('Send communication raw response:', response.data);
  // The backend returns { success: true, data: { communication: {...} } }
  const transformed = transformBackendToFrontend(response.data.data.communication);
  console.log('Send communication transformed response:', transformed);
  return transformed;
};

// Schedule a communication
export const scheduleCommunication = async (
  id: string,
  scheduledDate: string
): Promise<Communication> => {
  const response = await api.post(`/api/communications/${id}/schedule`, {
    scheduledDate,
  });
  return transformBackendToFrontend(response.data.data);
};

export const getCommunicationRecipients = async (
  communicationId: string
): Promise<CommunicationRecipient[]> => {
  const response = await api.get(
    `/api/communications/${communicationId}/recipients`
  );
  return response.data.data || []; // Ensure we return an array
};

export const getCommunicationSummary =
  async (): Promise<CommunicationSummary> => {
    const response = await api.get('/api/communications/stats');
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

    // Backend now tracks draft/scheduled/sent status
    const statusCounts = backendData.statusCounts || [];
    let sentCount = 0;
    let draftCount = 0;
    let scheduledCount = 0;

    statusCounts.forEach((item: any) => {
      switch (item._id) {
        case 'sent':
          sentCount = item.count;
          break;
        case 'draft':
          draftCount = item.count;
          break;
        case 'scheduled':
          scheduledCount = item.count;
          break;
      }
    });

    return {
      total,
      sent: sentCount,
      draft: draftCount,
      scheduled: scheduledCount,
      byType: byType as Record<CommunicationType, number>,
      recentCommunications,
    };
  };

// Get user's inbox
export const getUserInbox = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/api/communications/inbox', { params });

  // Transform each item to ensure proper mapping
  return response.data.data.map((item: any) => {
    // If the item already has the communication as a property, extract it
    const commData = item.communicationId || item;
    return transformBackendToFrontend(commData);
  });
};

// Get user's sent communications
export const getUserSentCommunications = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  const response = await api.get('/api/communications/sent', { params });
  return response.data.data.map(transformBackendToFrontend);
};

// Mark communication as read
export const markCommunicationAsRead = async (id: string): Promise<void> => {
  await api.put(`/api/communications/${id}/read`);
};

// Private Messages / Threads API
export const getThreads = async (): Promise<CommunicationThread[]> => {
  const response = await api.get('/api/messages/threads');

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
  const response = await api.get(`/api/messages/threads/${id}`);
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
        content: msg.content,
        timestamp: msg.createdAt,
        attachments: msg.attachments || [],
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
  const response = await api.post('/api/messages/threads', {
    participants: [data.recipient],
    subject: data.subject,
    message: data.message,
    attachments: data.attachments || [],
  });

  const thread = response.data.data;
  return {
    _id: thread._id,
    participants: thread.participants.map((p: any) => p._id || p),
    subject: thread.subject,
    lastMessage: thread.lastMessage,
    lastMessageDate: thread.lastMessageAt,
    unreadCount: 0,
    messages: [],
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

export const sendMessage = async (
  threadId: string,
  message: string,
  attachments?: string[]
): Promise<CommunicationThreadItem> => {
  const response = await api.post(`/api/messages/threads/${threadId}/messages`, {
    content: message,
    attachments: attachments || [],
  });

  const msg = response.data.data;
  return {
    _id: msg._id,
    sender: msg.senderId,
    senderName: msg.sender?.firstName + ' ' + msg.sender?.lastName,
    recipient: msg.recipientId || '',
    recipientName: msg.recipient?.firstName + ' ' + msg.recipient?.lastName || '',
    message: msg.content,
    readStatus: false,
    attachments: msg.attachments || [],
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
