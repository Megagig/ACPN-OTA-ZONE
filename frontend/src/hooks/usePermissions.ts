import {
  useQueryWithPagination,
  useFetchResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from './useApiQuery';

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

export interface PermissionFilters {
  resource?: string;
  action?: string;
  search?: string;
}

// Base endpoint and key
const PERMISSIONS_ENDPOINT = '/permissions';
const PERMISSIONS_KEY = 'permissions';

// Permission query hooks
export function usePermissions(
  page = 1,
  limit = 10,
  filters: PermissionFilters = {}
) {
  return useQueryWithPagination<Permission>(
    PERMISSIONS_ENDPOINT,
    [PERMISSIONS_KEY],
    page,
    limit,
    filters,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function usePermission(id: string | undefined) {
  return useFetchResource<Permission>(
    PERMISSIONS_ENDPOINT,
    id,
    [PERMISSIONS_KEY],
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (permissions rarely change once created)
    }
  );
}

export function useCreatePermission() {
  return useCreateResource<
    Permission,
    Omit<Permission, '_id' | 'createdAt' | 'updatedAt'>
  >(PERMISSIONS_ENDPOINT, [PERMISSIONS_KEY, 'create']);
}

export function useUpdatePermission() {
  return useUpdateResource<Permission, Partial<Permission>>(
    PERMISSIONS_ENDPOINT,
    [PERMISSIONS_KEY, 'update']
  );
}

export function useDeletePermission() {
  return useDeleteResource<{ success: boolean }>(PERMISSIONS_ENDPOINT, [
    PERMISSIONS_KEY,
    'delete',
  ]);
}

// Get all resources
export function usePermissionResources() {
  return useFetchResource<string[]>(
    `${PERMISSIONS_ENDPOINT}/resources`,
    '',
    [PERMISSIONS_KEY, 'resources'],
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours (resource types rarely change)
    }
  );
}

// Get all actions
export function usePermissionActions() {
  return useFetchResource<string[]>(
    `${PERMISSIONS_ENDPOINT}/actions`,
    '',
    [PERMISSIONS_KEY, 'actions'],
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours (action types rarely change)
    }
  );
}
