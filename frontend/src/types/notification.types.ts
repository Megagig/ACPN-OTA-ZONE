export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  _id: string;
  user: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    events: boolean;
    dues: boolean;
    announcements: boolean;
    elections: boolean;
    polls: boolean;
    other: boolean;
  };
  createdAt: string;
  updatedAt: string;
} 