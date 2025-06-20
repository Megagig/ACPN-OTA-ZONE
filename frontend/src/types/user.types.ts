export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'pharmacy';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  avatar?: string;
  bio?: string;
  location?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  preferences?: UserPreferences;
}

export interface UserPreferences {
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