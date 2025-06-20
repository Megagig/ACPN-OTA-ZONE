export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'general' | 'event' | 'dues' | 'election' | 'poll';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  attachments?: string[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  type: 'general' | 'event' | 'dues' | 'election' | 'poll';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
  attachments?: string[];
  startDate?: string;
  endDate?: string;
}

export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  type?: 'general' | 'event' | 'dues' | 'election' | 'poll';
  priority?: 'low' | 'medium' | 'high';
  status?: 'draft' | 'published' | 'archived';
  attachments?: string[];
  startDate?: string;
  endDate?: string;
} 