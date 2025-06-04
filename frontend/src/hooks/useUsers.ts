import {
  useQueryWithPagination,
  useFetchResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useBulkAction,
} from './useApiQuery';
import { UserRole, UserStatus } from '../types/user';

// Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
  isApproved?: boolean;
}

// Base endpoint
const USERS_ENDPOINT = '/users';
const USERS_KEY = 'users';

// User query hooks
export function useUsers(page = 1, limit = 10, filters: UserFilters = {}) {
  return useQueryWithPagination<User>(
    USERS_ENDPOINT,
    [USERS_KEY],
    page,
    limit,
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useUser(id: string | undefined) {
  return useFetchResource<User>(USERS_ENDPOINT, id, [USERS_KEY], {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUser() {
  return useCreateResource<User, Omit<User, '_id' | 'createdAt' | 'updatedAt'>>(
    USERS_ENDPOINT,
    [USERS_KEY, 'create']
  );
}

export function useUpdateUser() {
  return useUpdateResource<User, Partial<User>>(USERS_ENDPOINT, [
    USERS_KEY,
    'update',
  ]);
}

export function useDeleteUser() {
  return useDeleteResource<{ success: boolean }>(USERS_ENDPOINT, [
    USERS_KEY,
    'delete',
  ]);
}

export function useApproveUser() {
  return useUpdateResource<User, { isApproved: boolean }>(
    `${USERS_ENDPOINT}`,
    [USERS_KEY, 'approve'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${USERS_ENDPOINT}/${id}/approve`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useUpdateUserStatus() {
  return useUpdateResource<User, { status: UserStatus }>(
    `${USERS_ENDPOINT}`,
    [USERS_KEY, 'status'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${USERS_ENDPOINT}/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useUpdateUserRole() {
  return useUpdateResource<User, { role: UserRole }>(
    `${USERS_ENDPOINT}`,
    [USERS_KEY, 'role'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${USERS_ENDPOINT}/${id}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useBulkUpdateUserStatus() {
  return useBulkAction<
    { success: boolean; count: number },
    { userIds: string[]; status: UserStatus }
  >(USERS_ENDPOINT, 'bulk/status', [USERS_KEY]);
}

export function useBulkUpdateUserRole() {
  return useBulkAction<
    { success: boolean; count: number },
    { userIds: string[]; role: UserRole }
  >(USERS_ENDPOINT, 'bulk/role', [USERS_KEY]);
}

// Get pending approval users
export function usePendingApprovalUsers(page = 1, limit = 10) {
  return useQueryWithPagination<User>(
    `${USERS_ENDPOINT}/pending-approvals`,
    [USERS_KEY, 'pending'],
    page,
    limit,
    {},
    {
      staleTime: 60 * 1000, // 1 minute (more frequent checks for pending approvals)
    }
  );
}
