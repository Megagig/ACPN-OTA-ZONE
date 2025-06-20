import {
  useQueryWithPagination,
  useFetchResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useBulkAction,
  type ApiError,
} from './useApiQuery';
import { UserRole, UserStatus } from '../types/user';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

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
  const queryClient = useQueryClient();
  
  return useMutation<User, AxiosError<ApiError>, { id: string; data: { isApproved: boolean } }>({
    mutationFn: ({ id, data }: { id: string; data: { isApproved: boolean } }) => {
      return fetch(`${USERS_ENDPOINT}/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => res.json());
    },
    onSuccess: (_: User, variables: { id: string; data: { isApproved: boolean } }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation<User, AxiosError<ApiError>, { id: string; data: { status: UserStatus } }>({
    mutationFn: ({ id, data }: { id: string; data: { status: UserStatus } }) => {
      return fetch(`${USERS_ENDPOINT}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => res.json());
    },
    onSuccess: (_: User, variables: { id: string; data: { status: UserStatus } }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation<User, AxiosError<ApiError>, { id: string; data: { role: UserRole } }>({
    mutationFn: ({ id, data }: { id: string; data: { role: UserRole } }) => {
      return fetch(`${USERS_ENDPOINT}/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => res.json());
    },
    onSuccess: (_: User, variables: { id: string; data: { role: UserRole } }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
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
