export interface Settings {
  _id: string;
  organization: {
    name: string;
    logo?: string;
    email: string;
    phone?: string;
    address?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    maxLoginAttempts: number;
  };
  features: {
    events: boolean;
    dues: boolean;
    elections: boolean;
    polls: boolean;
    announcements: boolean;
    communications: boolean;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdate {
  organization?: {
    name?: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
    sessionTimeout?: number;
    passwordExpiry?: number;
    maxLoginAttempts?: number;
  };
  features?: {
    events?: boolean;
    dues?: boolean;
    elections?: boolean;
    polls?: boolean;
    announcements?: boolean;
    communications?: boolean;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };
} 