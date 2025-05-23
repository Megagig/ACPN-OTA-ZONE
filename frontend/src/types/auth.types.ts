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
}

export interface ResetPasswordData {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: any;
}
