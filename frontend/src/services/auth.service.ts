import api from './api';
import type {
  LoginCredentials,
  RegistrationData,
  ResetPasswordData,
  AuthResponse,
  ApiResponse,
  User,
} from '../types/auth.types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      this.setAuthData(response.data);
    }
    return response.data;
  }

  async register(userData: RegistrationData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async verifyEmailWithCode(email: string, code: string): Promise<ApiResponse> {
    const response = await api.post('/auth/verify-email-code', { email, code });
    return response.data;
  }

  async forgotPassword(data: ResetPasswordData): Promise<ApiResponse> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.reject('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });

      if (response.data.success) {
        // Update only the access token, keep the refresh token
        localStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      // If refresh token is invalid, logout the user
      this.logout();
      return Promise.reject(error);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  private setAuthData(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}

export default new AuthService();
