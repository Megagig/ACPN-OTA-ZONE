import api from './api';
import type { User } from '../types/auth.types';

export interface UserListResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  data: User[];
}

class UserService {
  /**
   * Get all users with optional filtering
   */
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      role?: string;
      isApproved?: boolean;
    } = {}
  ): Promise<UserListResponse> {
    const response = await api.get('/api/users', { params });
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<{ success: boolean; data: User }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(
    userData: Partial<User>
  ): Promise<{ success: boolean; data: User }> {
    const response = await api.post('/api/users', userData);
    return response.data;
  }

  /**
   * Update a user (admin only)
   */
  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<{ success: boolean; data: User }> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  }

  /**
   * Delete a user (admin/superadmin only)
   */
  async deleteUser(
    id: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  /**
   * Approve a user (admin/superadmin only)
   */
  async approveUser(
    id: string
  ): Promise<{ success: boolean; data: User; message: string }> {
    const response = await api.put(`/users/${id}/approve`);
    return response.data;
  }

  /**
   * Deny a user (admin/superadmin only)
   */
  async denyUser(
    id: string
  ): Promise<{ success: boolean; data: User; message: string }> {
    const response = await api.put(`/users/${id}/deny`);
    return response.data;
  }

  /**
   * Change a user's role (superadmin only)
   */
  async changeUserRole(
    id: string,
    role: string
  ): Promise<{ success: boolean; data: User }> {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  }

  /**
   * Get pending approval users
   */
  async getPendingApprovals(
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<UserListResponse> {
    const response = await api.get('/api/users/pending-approvals', { params });
    return response.data;
  }
}

export default new UserService();
