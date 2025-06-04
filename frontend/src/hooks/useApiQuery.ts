import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  getWithRetry,
  postWithRetry,
  putWithRetry,
  deleteWithRetry,
} from '../utils/apiRetryUtils';

// Type for pagination response
interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  success: boolean;
}

// Type for API error
export interface ApiError {
  message: string;
  errors?: Array<{ message: string }>;
  success: false;
}

// Custom hook for fetching data with pagination
export function useQueryWithPagination<T>(
  endpoint: string,
  queryKey: string[],
  page = 1,
  limit = 10,
  filters: Record<string, any> = {},
  options?: Omit<
    Parameters<typeof useQuery<PaginatedResponse<T>, AxiosError<ApiError>>>[0],
    'queryKey' | 'queryFn'
  >
) {
  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return useQuery<PaginatedResponse<T>, AxiosError<ApiError>>({
    queryKey: [...queryKey, page, limit, JSON.stringify(filters)],
    queryFn: () => getWithRetry(url),
    ...options,
  });
}

// Custom hook for fetching a single resource
export function useFetchResource<T>(
  endpoint: string,
  id: string | undefined,
  queryKey: string[],
  options?: Omit<
    Parameters<typeof useQuery<T, AxiosError<ApiError>>>[0],
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<T, AxiosError<ApiError>>({
    queryKey: [...queryKey, id],
    queryFn: () => getWithRetry(`${endpoint}/${id}`),
    enabled: !!id, // Only run if ID is provided
    ...options,
  });
}

// Custom hook for creating a resource
export function useCreateResource<T, TData = any>(
  endpoint: string,
  mutationKey: string[],
  options?: Omit<
    Parameters<typeof useMutation<T, AxiosError<ApiError>, TData>>[0],
    'mutationKey' | 'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<T, AxiosError<ApiError>, TData>({
    mutationKey,
    mutationFn: (data) => postWithRetry(endpoint, data),
    onSuccess: () => {
      // Invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [mutationKey[0]] });
    },
    ...options,
  });
}

// Custom hook for updating a resource
export function useUpdateResource<T, TData = any>(
  endpoint: string,
  mutationKey: string[],
  options?: Omit<
    Parameters<
      typeof useMutation<T, AxiosError<ApiError>, { id: string; data: TData }>
    >[0],
    'mutationKey' | 'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<T, AxiosError<ApiError>, { id: string; data: TData }>({
    mutationKey,
    mutationFn: ({ id, data }) => putWithRetry(`${endpoint}/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate the individual resource query
      queryClient.invalidateQueries({
        queryKey: [...mutationKey, variables.id],
      });
      // Also invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [mutationKey[0]] });
    },
    ...options,
  });
}

// Custom hook for deleting a resource
export function useDeleteResource<T>(
  endpoint: string,
  mutationKey: string[],
  options?: Omit<
    Parameters<typeof useMutation<T, AxiosError<ApiError>, string>>[0],
    'mutationKey' | 'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<T, AxiosError<ApiError>, string>({
    mutationKey,
    mutationFn: (id) => deleteWithRetry(`${endpoint}/${id}`),
    onSuccess: (_, id) => {
      // Invalidate the individual resource query
      queryClient.invalidateQueries({ queryKey: [...mutationKey, id] });
      // Also invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [mutationKey[0]] });
    },
    ...options,
  });
}

// Custom hook for bulk operations
export function useBulkAction<T, TData = any>(
  endpoint: string,
  action: string,
  mutationKey: string[],
  options?: Omit<
    Parameters<typeof useMutation<T, AxiosError<ApiError>, TData>>[0],
    'mutationKey' | 'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<T, AxiosError<ApiError>, TData>({
    mutationKey: [...mutationKey, action],
    mutationFn: (data) => postWithRetry(`${endpoint}/${action}`, data),
    onSuccess: () => {
      // Invalidate the collection query
      queryClient.invalidateQueries({ queryKey: [mutationKey[0]] });
    },
    ...options,
  });
}
