import api from './api';

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

  async verifyEmail(token: string): Promise<any> {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async forgotPassword(data: ResetPasswordData): Promise<any> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<any> {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): any {
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
