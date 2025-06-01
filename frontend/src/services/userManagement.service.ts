import api from './api';
import type { User } from '../types/auth.types';

// Types
export interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[] | Permission[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrailEntry {
  _id: string;
  userId: string | User;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

// Response types
interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface PermissionResponse extends BaseResponse {
  data: Permission;
}

export interface PermissionsResponse extends BaseResponse {
  count: number;
  data: Permission[];
}

export interface RoleResponse extends BaseResponse {
  data: Role;
}

export interface RolesResponse extends BaseResponse {
  count: number;
  data: Role[];
}

export interface UserResponse extends BaseResponse {
  data: User;
}

export interface UsersResponse extends BaseResponse {
  count: number;
  data: User[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

export interface AuditTrailResponse extends BaseResponse {
  count: number;
  data: AuditTrailEntry[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

class UserManagementService {
  // Permission methods
  async getPermissions(): Promise<PermissionsResponse> {
    const response = await api.get('/permissions');
    return response.data;
  }

  async getPermissionById(id: string): Promise<PermissionResponse> {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  }

  async createPermission(
    permissionData: Partial<Permission>
  ): Promise<PermissionResponse> {
    const response = await api.post('/permissions', permissionData);
    return response.data;
  }

  async updatePermission(
    id: string,
    permissionData: Partial<Permission>
  ): Promise<PermissionResponse> {
    const response = await api.put(`/permissions/${id}`, permissionData);
    return response.data;
  }

  async deletePermission(id: string): Promise<BaseResponse> {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  }

  async initializePermissions(): Promise<PermissionsResponse> {
    const response = await api.post('/permissions/initialize/default');
    return response.data;
  }

  // Role methods
  async getRoles(): Promise<RolesResponse> {
    const response = await api.get('/roles');
    return response.data;
  }

  async getRoleById(id: string): Promise<RoleResponse> {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  }

  async createRole(roleData: Partial<Role>): Promise<RoleResponse> {
    const response = await api.post('/roles', roleData);
    return response.data;
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<RoleResponse> {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  }

  async deleteRole(id: string): Promise<BaseResponse> {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }

  async initializeDefaultRoles(): Promise<RolesResponse> {
    const response = await api.post('/roles/initialize/default');
    return response.data;
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<RoleResponse> {
    const response = await api.post(
      `/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<RoleResponse> {
    const response = await api.delete(
      `/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  async getUsersWithRole(roleId: string): Promise<UsersResponse> {
    const response = await api.get(`/roles/${roleId}/users`);
    return response.data;
  }

  // User management methods
  async getUserProfile(): Promise<UserResponse> {
    const response = await api.get('/user-management/profile');
    return response.data;
  }

  async updateUserProfile(userData: Partial<User>): Promise<UserResponse> {
    const response = await api.put('/user-management/profile', userData);
    return response.data;
  }

  async uploadProfilePicture(formData: FormData): Promise<UserResponse> {
    const response = await api.put(
      '/user-management/profile/picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getUserPermissions(): Promise<PermissionsResponse> {
    const response = await api.get('/user-management/permissions');
    return response.data;
  }

  async getUsersByStatus(
    status: string,
    page = 1,
    limit = 10
  ): Promise<UsersResponse> {
    const response = await api.get(`/user-management/status/${status}`, {
      params: { page, limit },
    });
    return response.data;
  }

  async updateUserStatus(
    userId: string,
    status: string
  ): Promise<UserResponse> {
    const response = await api.put(`/user-management/${userId}/status`, {
      status,
    });
    return response.data;
  }

  async bulkUpdateUserStatus(
    userIds: string[],
    status: string
  ): Promise<BaseResponse> {
    const response = await api.put('/user-management/bulk/status', {
      userIds,
      status,
    });
    return response.data;
  }

  async assignUserRole(userId: string, roleId: string): Promise<UserResponse> {
    const response = await api.put(`/user-management/${userId}/role`, {
      roleId,
    });
    return response.data;
  }

  async bulkAssignUserRole(
    userIds: string[],
    roleId: string
  ): Promise<BaseResponse> {
    const response = await api.put('/user-management/bulk/role', {
      userIds,
      roleId,
    });
    return response.data;
  }

  async getUserAuditTrail(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<AuditTrailResponse> {
    const response = await api.get(`/user-management/${userId}/audit-trail`, {
      params: { page, limit },
    });
    return response.data;
  }

  async checkPermission(
    resource: string,
    action: string
  ): Promise<BaseResponse> {
    const response = await api.get(
      `/user-management/check-permission/${resource}/${action}`
    );
    return response.data;
  }

  async getFilteredUsers(
    filters: any,
    page = 1,
    limit = 10
  ): Promise<UsersResponse> {
    const response = await api.post('/user-management/filter', {
      ...filters,
      page,
      limit,
    });
    return response.data;
  }
}

export default new UserManagementService();
export type { AuditTrailEntry };
