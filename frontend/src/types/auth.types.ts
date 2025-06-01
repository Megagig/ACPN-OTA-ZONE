export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  pcnLicense: string; // Changed from optional to required
}

export interface ResetPasswordData {
  email: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  pcnLicense?: string;
  pcnNumber?: string; // Added for PCN number
  address?: string; // Added for address
  role: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isApproved: boolean;
  status: string;
  createdAt?: string; // Added for creation date
  updatedAt?: string; // Added for update date
  pharmacy?: {
    _id: string;
    name: string;
    registrationNumber?: string;
    address?: string;
  }; // Added for pharmacy association
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  token?: string;
}
