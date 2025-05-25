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
  phone: string; // Added
  pcnLicense: string; // Added
  role: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isApproved: boolean;
  status: string;
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
