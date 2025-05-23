import api from './api';
import {
  Communication,
  CommunicationRecipient,
  CommunicationSummary,
  CommunicationThread,
  CommunicationThreadItem,
} from '../types/communication.types';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Mock communications data for demo purposes
const mockCommunications: Communication[] = [
  {
    _id: 'comm001',
    title: 'Annual General Meeting Announcement',
    content:
      'Dear members, we are pleased to announce that the Annual General Meeting of ACPN Ota Zone will be held on June 15, 2025, at the ACPN Conference Center. All members are required to attend.',
    type: 'announcement',
    status: 'sent',
    sender: 'user123',
    senderName: 'John Adewale (Secretary)',
    recipientType: 'all_members',
    sentAt: '2025-05-10T10:30:00',
    createdAt: '2025-05-08T09:15:00',
    updatedAt: '2025-05-10T10:30:00',
  },
  {
    _id: 'comm002',
    title: 'Renewal of Annual Dues',
    content:
      'This is a reminder that annual dues for 2025 are payable from January to March. Please ensure your dues are paid on time to avoid any penalties.',
    type: 'email',
    status: 'sent',
    sender: 'user456',
    senderName: 'Sarah Johnson (Treasurer)',
    recipientType: 'all_members',
    sentAt: '2025-05-05T14:20:00',
    createdAt: '2025-05-05T13:00:00',
    updatedAt: '2025-05-05T14:20:00',
  },
  {
    _id: 'comm003',
    title: 'Executive Committee Meeting',
    content:
      'A reminder that the Executive Committee Meeting is scheduled for tomorrow at 4 PM. Please come prepared with your reports.',
    type: 'sms',
    status: 'sent',
    sender: 'user123',
    senderName: 'John Adewale (Secretary)',
    recipientType: 'executives',
    sentAt: '2025-05-18T09:00:00',
    createdAt: '2025-05-17T16:45:00',
    updatedAt: '2025-05-18T09:00:00',
  },
  {
    _id: 'comm004',
    title: 'Community Health Outreach - Volunteer Request',
    content:
      'We are organizing a community health outreach program on June 25, 2025. We need volunteers from among our members. If you are interested, please register your interest by replying to this message.',
    type: 'email',
    status: 'draft',
    sender: 'user789',
    senderName: 'Michael Okafor (PRO)',
    recipientType: 'all_members',
    createdAt: '2025-05-20T11:30:00',
    updatedAt: '2025-05-20T11:30:00',
  },
  {
    _id: 'comm005',
    title: 'Special Bulletin: PCN Inspection Guidelines Update',
    content:
      'The Pharmacists Council of Nigeria has released updated guidelines for pharmacy inspections. This bulletin contains important information that all pharmacy owners must be aware of.',
    type: 'announcement',
    status: 'scheduled',
    sender: 'user321',
    senderName: 'Dr. Elizabeth Adekunle (Chairperson)',
    recipientType: 'all_members',
    scheduledFor: '2025-05-25T08:00:00',
    createdAt: '2025-05-21T15:10:00',
    updatedAt: '2025-05-21T15:10:00',
  },
];

// Mock communication recipients data
const mockCommunicationRecipients: CommunicationRecipient[] = [
  {
    _id: 'rec001',
    communication: 'comm001',
    user: 'user123',
    userName: 'John Adewale',
    email: 'johnadewale@example.com',
    phone: '+2348012345678',
    deliveryStatus: 'delivered',
    readStatus: true,
    readAt: '2025-05-10T11:30:00',
    deliveredAt: '2025-05-10T10:35:00',
    createdAt: '2025-05-10T10:30:00',
    updatedAt: '2025-05-10T11:30:00',
  },
  {
    _id: 'rec002',
    communication: 'comm001',
    user: 'user456',
    userName: 'Sarah Johnson',
    email: 'sarahjohnson@example.com',
    phone: '+2348023456789',
    deliveryStatus: 'delivered',
    readStatus: true,
    readAt: '2025-05-10T12:45:00',
    deliveredAt: '2025-05-10T10:36:00',
    createdAt: '2025-05-10T10:30:00',
    updatedAt: '2025-05-10T12:45:00',
  },
  {
    _id: 'rec003',
    communication: 'comm001',
    user: 'user789',
    userName: 'Michael Okafor',
    email: 'michaelokafor@example.com',
    phone: '+2348034567890',
    deliveryStatus: 'delivered',
    readStatus: false,
    deliveredAt: '2025-05-10T10:38:00',
    createdAt: '2025-05-10T10:30:00',
    updatedAt: '2025-05-10T10:38:00',
  },
  {
    _id: 'rec004',
    communication: 'comm002',
    user: 'user123',
    userName: 'John Adewale',
    email: 'johnadewale@example.com',
    phone: '+2348012345678',
    deliveryStatus: 'delivered',
    readStatus: true,
    readAt: '2025-05-05T16:10:00',
    deliveredAt: '2025-05-05T14:25:00',
    createdAt: '2025-05-05T14:20:00',
    updatedAt: '2025-05-05T16:10:00',
  },
  {
    _id: 'rec005',
    communication: 'comm002',
    user: 'user789',
    userName: 'Michael Okafor',
    email: 'michaelokafor@example.com',
    phone: '+2348034567890',
    deliveryStatus: 'failed',
    readStatus: false,
    createdAt: '2025-05-05T14:20:00',
    updatedAt: '2025-05-05T14:30:00',
  },
];

// Mock communication threads
const mockThreads: CommunicationThread[] = [
  {
    _id: 'thread001',
    participants: ['user123', 'user456'],
    subject: 'Pharmacy Inspection Preparation',
    lastMessage:
      'That sounds good. I will make those changes before the inspection.',
    lastMessageDate: '2025-05-15T16:30:00',
    unreadCount: 0,
    messages: [
      {
        _id: 'msg001',
        sender: 'user123',
        senderName: 'John Adewale',
        recipient: 'user456',
        recipientName: 'Sarah Johnson',
        message:
          'Hi Sarah, I wanted to discuss the upcoming PCN inspection for your pharmacy. Do you have all the required documents ready?',
        readStatus: true,
        readAt: '2025-05-15T10:15:00',
        createdAt: '2025-05-15T10:00:00',
      },
      {
        _id: 'msg002',
        sender: 'user456',
        senderName: 'Sarah Johnson',
        recipient: 'user123',
        recipientName: 'John Adewale',
        message:
          "Hi John, thanks for checking. I have most documents ready but I'm still working on updating the SOP manual.",
        readStatus: true,
        readAt: '2025-05-15T13:20:00',
        createdAt: '2025-05-15T12:30:00',
      },
      {
        _id: 'msg003',
        sender: 'user123',
        senderName: 'John Adewale',
        recipient: 'user456',
        recipientName: 'Sarah Johnson',
        message:
          "I recommend you prioritize that as it's one of the key documents they check. Also make sure your controlled drugs register is up to date.",
        readStatus: true,
        readAt: '2025-05-15T15:45:00',
        createdAt: '2025-05-15T14:00:00',
      },
      {
        _id: 'msg004',
        sender: 'user456',
        senderName: 'Sarah Johnson',
        recipient: 'user123',
        recipientName: 'John Adewale',
        message:
          'That sounds good. I will make those changes before the inspection.',
        readStatus: true,
        readAt: '2025-05-15T17:00:00',
        createdAt: '2025-05-15T16:30:00',
      },
    ],
    createdAt: '2025-05-15T10:00:00',
    updatedAt: '2025-05-15T16:30:00',
  },
  {
    _id: 'thread002',
    participants: ['user123', 'user789'],
    subject: 'Annual Dues Payment Confirmation',
    lastMessage: 'I will double-check with the bank and get back to you.',
    lastMessageDate: '2025-05-19T11:45:00',
    unreadCount: 1,
    messages: [
      {
        _id: 'msg005',
        sender: 'user789',
        senderName: 'Michael Okafor',
        recipient: 'user123',
        recipientName: 'John Adewale',
        message:
          'Hello John, I made a bank transfer for my annual dues last week but it still shows as unpaid in the system. Can you please check?',
        readStatus: true,
        readAt: '2025-05-18T09:30:00',
        createdAt: '2025-05-18T09:15:00',
      },
      {
        _id: 'msg006',
        sender: 'user123',
        senderName: 'John Adewale',
        recipient: 'user789',
        recipientName: 'Michael Okafor',
        message:
          'Hi Michael, thanks for bringing this to my attention. Can you please send me the transfer reference number and date?',
        readStatus: true,
        readAt: '2025-05-18T12:00:00',
        createdAt: '2025-05-18T10:30:00',
      },
      {
        _id: 'msg007',
        sender: 'user789',
        senderName: 'Michael Okafor',
        recipient: 'user123',
        recipientName: 'John Adewale',
        message:
          'Sure. The reference number is NGT2345678 and I made the transfer on May 12, 2025.',
        readStatus: true,
        readAt: '2025-05-19T08:15:00',
        createdAt: '2025-05-18T14:20:00',
      },
      {
        _id: 'msg008',
        sender: 'user123',
        senderName: 'John Adewale',
        recipient: 'user789',
        recipientName: 'Michael Okafor',
        message: 'I will double-check with the bank and get back to you.',
        readStatus: false,
        createdAt: '2025-05-19T11:45:00',
      },
    ],
    createdAt: '2025-05-18T09:15:00',
    updatedAt: '2025-05-19T11:45:00',
  },
];

// Mock communication summary
const mockCommunicationSummary: CommunicationSummary = {
  total: 5,
  sent: 3,
  draft: 1,
  scheduled: 1,
  byType: {
    announcement: 2,
    email: 2,
    sms: 1,
    private_message: 0,
  },
  recentCommunications: mockCommunications.slice(0, 3),
};

// Helper for simulating API responses with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Communications API
export const getCommunications = async (
  params?: Record<string, unknown>
): Promise<Communication[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockCommunications;

  // Real API call
  // const response = await api.get(`${BASE_URL}/communications`, { params });
  // return response.data.data;
};

export const getCommunicationById = async (
  id: string
): Promise<Communication> => {
  // For demo purposes, return mock data
  await delay(800);
  const communication = mockCommunications.find((c) => c._id === id);
  if (!communication) throw new Error('Communication not found');
  return communication;

  // Real API call
  // const response = await api.get(`${BASE_URL}/communications/${id}`);
  // return response.data.data;
};

export const createCommunication = async (
  data: Partial<Communication>
): Promise<Communication> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Communication;

  // Real API call
  // const response = await api.post(`${BASE_URL}/communications`, data);
  // return response.data.data;
};

export const updateCommunication = async (
  id: string,
  data: Partial<Communication>
): Promise<Communication> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Communication;

  // Real API call
  // const response = await api.put(`${BASE_URL}/communications/${id}`, data);
  // return response.data.data;
};

export const deleteCommunication = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/communications/${id}`);
};

export const sendCommunication = async (id: string): Promise<Communication> => {
  // For demo purposes, just return a mock result
  await delay(1200); // Longer delay to simulate sending process

  return {
    _id: id,
    status: 'sent',
    sentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Communication;

  // Real API call
  // const response = await api.post(`${BASE_URL}/communications/${id}/send`);
  // return response.data.data;
};

export const scheduleCommunication = async (
  id: string,
  scheduledDate: string
): Promise<Communication> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: 'scheduled',
    scheduledFor: scheduledDate,
    updatedAt: new Date().toISOString(),
  } as Communication;

  // Real API call
  // const response = await api.post(`${BASE_URL}/communications/${id}/schedule`, { scheduledDate });
  // return response.data.data;
};

export const getCommunicationRecipients = async (
  communicationId: string
): Promise<CommunicationRecipient[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockCommunicationRecipients.filter(
    (r) => r.communication === communicationId
  );

  // Real API call
  // const response = await api.get(`${BASE_URL}/communications/${communicationId}/recipients`);
  // return response.data.data;
};

export const getCommunicationSummary =
  async (): Promise<CommunicationSummary> => {
    // For demo purposes, return mock data
    await delay(800);
    return mockCommunicationSummary;

    // Real API call
    // const response = await api.get(`${BASE_URL}/communications/summary`);
    // return response.data.data;
  };

// Private Messages / Threads API
export const getThreads = async (): Promise<CommunicationThread[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockThreads;

  // Real API call
  // const response = await api.get(`${BASE_URL}/messages/threads`);
  // return response.data.data;
};

export const getThreadById = async (
  id: string
): Promise<CommunicationThread> => {
  // For demo purposes, return mock data
  await delay(800);
  const thread = mockThreads.find((t) => t._id === id);
  if (!thread) throw new Error('Thread not found');

  // Mark all messages as read
  const updatedThread = {
    ...thread,
    unreadCount: 0,
    messages: thread.messages.map((message) => ({
      ...message,
      readStatus: true,
      readAt: message.readStatus ? message.readAt : new Date().toISOString(),
    })),
  };

  return updatedThread;

  // Real API call
  // const response = await api.get(`${BASE_URL}/messages/threads/${id}`);
  // return response.data.data;
};

export const createThread = async (data: {
  recipient: string;
  subject: string;
  message: string;
  attachments?: string[];
}): Promise<CommunicationThread> => {
  // For demo purposes, just return a mock result
  await delay(800);

  // Mock current user
  const currentUser = {
    _id: 'user123',
    name: 'John Adewale',
  };

  const now = new Date().toISOString();

  const newMessage: CommunicationThreadItem = {
    _id: 'msg-new-' + Date.now(),
    sender: currentUser._id,
    senderName: currentUser.name,
    recipient: data.recipient,
    recipientName: 'Recipient Name', // This would come from an actual user service in a real app
    message: data.message,
    readStatus: false,
    attachments: data.attachments,
    createdAt: now,
  };

  const newThread: CommunicationThread = {
    _id: 'thread-new-' + Date.now(),
    participants: [currentUser._id, data.recipient],
    subject: data.subject,
    lastMessage: data.message,
    lastMessageDate: now,
    unreadCount: 1,
    messages: [newMessage],
    createdAt: now,
    updatedAt: now,
  };

  return newThread;

  // Real API call
  // const response = await api.post(`${BASE_URL}/messages/threads`, data);
  // return response.data.data;
};

export const sendMessage = async (
  threadId: string,
  message: string,
  attachments?: string[]
): Promise<CommunicationThreadItem> => {
  // For demo purposes, just return a mock result
  await delay(800);

  // Mock current user
  const currentUser = {
    _id: 'user123',
    name: 'John Adewale',
  };

  // Find the thread
  const thread = mockThreads.find((t) => t._id === threadId);
  if (!thread) throw new Error('Thread not found');

  // Determine the recipient (the other participant who is not the current user)
  const recipientId =
    thread.participants.find((p) => p !== currentUser._id) || '';

  const now = new Date().toISOString();

  const newMessage: CommunicationThreadItem = {
    _id: 'msg-new-' + Date.now(),
    sender: currentUser._id,
    senderName: currentUser.name,
    recipient: recipientId,
    recipientName: 'Recipient Name', // This would come from an actual user service in a real app
    message: message,
    readStatus: false,
    attachments,
    createdAt: now,
  };

  return newMessage;

  // Real API call
  // const response = await api.post(`${BASE_URL}/messages/threads/${threadId}/messages`, { message, attachments });
  // return response.data.data;
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
  getThreads,
  getThreadById,
  createThread,
  sendMessage,
};

export default communicationService;
