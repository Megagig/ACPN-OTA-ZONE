import {
  useQueryWithPagination,
  useFetchResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  type ApiError,
} from './useApiQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getWithRetry, postWithRetry } from '../utils/apiRetryUtils';

// Types
export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIALLY_PAID: 'partially_paid',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DueAssignmentType = {
  INDIVIDUAL: 'individual',
  BULK: 'bulk',
} as const;

export type DueAssignmentType =
  (typeof DueAssignmentType)[keyof typeof DueAssignmentType];

export interface Penalty {
  amount: number;
  reason: string;
  addedBy: string;
  addedAt: string;
}

export interface Due {
  _id: string;
  pharmacyId: string;
  dueTypeId:
    | string
    | {
        _id: string;
        name: string;
        description?: string;
      };
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balance: number;
  penalties: Penalty[];
  totalAmount: number;
  assignmentType: DueAssignmentType;
  assignedBy: string;
  assignedAt: string;
  year: number;
  isRecurring: boolean;
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DueType {
  _id: string;
  name: string;
  description?: string;
  defaultAmount: number;
  isRecurring: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DueFilters {
  year?: number;
  dueTypeId?: string;
  paymentStatus?: PaymentStatus;
  pharmacy?: string;
  search?: string;
}

export interface DueAnalytics {
  totalDues: number;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  paidCount: number;
  overdueCount: number;
  duesByType: {
    _id: string;
    name: string;
    count: number;
    totalAmount: number;
    amountPaid: number;
    balance: number;
  }[];
  paymentStatusBreakdown: {
    status: PaymentStatus;
    count: number;
    percentage: number;
  }[];
}

// Base endpoint and keys
const DUES_ENDPOINT = '/dues';
const DUES_KEY = 'dues';
const DUE_TYPES_ENDPOINT = '/due-types';
const DUE_TYPES_KEY = 'due-types';

// Due query hooks
export function useDues(page = 1, limit = 10, filters: DueFilters = {}) {
  return useQueryWithPagination<Due>(
    DUES_ENDPOINT,
    [DUES_KEY],
    page,
    limit,
    filters,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useDue(id: string | undefined) {
  return useFetchResource<Due>(DUES_ENDPOINT, id, [DUES_KEY, id as string], {
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function usePharmacyDues(
  pharmacyId: string | undefined,
  page = 1,
  limit = 10,
  filters: DueFilters = {}
) {
  return useQueryWithPagination<Due>(
    `/pharmacies/${pharmacyId}/dues`,
    [DUES_KEY, 'pharmacy', pharmacyId as string],
    page,
    limit,
    filters,
    {
      enabled: !!pharmacyId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useDuesByType(
  dueTypeId: string | undefined,
  page = 1,
  limit = 10
) {
  return useQueryWithPagination<Due>(
    `${DUES_ENDPOINT}/type/${dueTypeId}`,
    [DUES_KEY, 'type', dueTypeId as string],
    page,
    limit,
    {},
    {
      enabled: !!dueTypeId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useOverdueDues(page = 1, limit = 10) {
  return useQueryWithPagination<Due>(
    `${DUES_ENDPOINT}/overdue`,
    [DUES_KEY, 'overdue'],
    page,
    limit,
    {},
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useCreateDue() {
  const queryClient = useQueryClient();

  return useCreateResource<Due, Partial<Due>>(DUES_ENDPOINT, [DUES_KEY], {
    onSuccess: () => {
      // Invalidate relevant queries when a new due is created
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export function useUpdateDue() {
  const queryClient = useQueryClient();

  return useUpdateResource<Due, Partial<Due>>(DUES_ENDPOINT, [DUES_KEY], {
    onSuccess: (data) => {
      // Update specific queries with the new data
      queryClient.invalidateQueries({ queryKey: [DUES_KEY, data._id] });
      queryClient.invalidateQueries({
        queryKey: [DUES_KEY, 'pharmacy', data.pharmacyId],
      });
      // Invalidate general queries
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export function useDeleteDue() {
  const queryClient = useQueryClient();

  return useDeleteResource<Due>(DUES_ENDPOINT, [DUES_KEY], {
    onSuccess: () => {
      // Invalidate all due-related queries
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

// Due assignment
export interface BulkDueAssignmentPayload {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  pharmacyIds: string[];
}

export function useBulkAssignDues() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Due[] },
    AxiosError<ApiError>,
    BulkDueAssignmentPayload
  >({
    mutationFn: (payload) =>
      postWithRetry(`${DUES_ENDPOINT}/bulk-assign`, payload),
    onSuccess: () => {
      // Invalidate all due-related queries
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export interface AssignDueToPharmacyPayload {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  title: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
}

export function useAssignDueToPharmacy(pharmacyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Due },
    AxiosError<ApiError>,
    AssignDueToPharmacyPayload
  >({
    mutationFn: (payload) =>
      postWithRetry(`/pharmacies/${pharmacyId}/dues`, payload),
    onSuccess: () => {
      // Invalidate specific pharmacy dues and general dues
      queryClient.invalidateQueries({
        queryKey: [DUES_KEY, 'pharmacy', pharmacyId as string],
      });
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
    onError: (error) => {
      console.error('Error assigning due to pharmacy:', error);
    },
  });
}

// Penalties
export interface AddPenaltyPayload {
  amount: number;
  reason: string;
}

export function useAddPenaltyToDue(dueId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Due },
    AxiosError<ApiError>,
    AddPenaltyPayload
  >({
    mutationFn: (payload) =>
      postWithRetry(`${DUES_ENDPOINT}/${dueId}/penalty`, payload),
    onSuccess: (data) => {
      // Update specific queries with the new data
      queryClient.invalidateQueries({ queryKey: [DUES_KEY, dueId as string] });
      queryClient.invalidateQueries({
        queryKey: [DUES_KEY, 'pharmacy', data.data.pharmacyId],
      });
      // Invalidate general queries
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

// Payment marking
export interface MarkDueAsPaidPayload {
  paymentMethod: string;
  paymentReference?: string;
  amount: number;
}

export function useMarkDueAsPaid(dueId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Due },
    AxiosError<ApiError>,
    MarkDueAsPaidPayload
  >({
    mutationFn: (payload) =>
      postWithRetry(`${DUES_ENDPOINT}/${dueId}/pay`, payload),
    onSuccess: (data) => {
      // Update specific queries with the new data
      queryClient.invalidateQueries({ queryKey: [DUES_KEY, dueId as string] });
      queryClient.invalidateQueries({
        queryKey: [DUES_KEY, 'pharmacy', data.data.pharmacyId],
      });
      // Invalidate general and payment queries
      queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// Analytics
export function useDueAnalytics(year?: number) {
  return useQuery<
    { success: boolean; data: DueAnalytics },
    AxiosError<ApiError>
  >({
    queryKey: [DUES_KEY, 'analytics', year],
    queryFn: () =>
      getWithRetry(`${DUES_ENDPOINT}/analytics${year ? `?year=${year}` : ''}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePharmacyDueAnalytics(
  pharmacyId: string | undefined,
  year?: number
) {
  return useQuery<
    { success: boolean; data: DueAnalytics },
    AxiosError<ApiError>
  >({
    queryKey: [DUES_KEY, 'analytics', 'pharmacy', pharmacyId, year],
    queryFn: () =>
      getWithRetry(
        `/pharmacies/${pharmacyId}/dues/analytics${year ? `?year=${year}` : ''}`
      ),
    enabled: !!pharmacyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Due Types
export function useDueTypes(includeInactive = false) {
  return useQuery<{ success: boolean; data: DueType[] }, AxiosError<ApiError>>({
    queryKey: [DUE_TYPES_KEY, { includeInactive }],
    queryFn: () =>
      getWithRetry(`${DUE_TYPES_ENDPOINT}?includeInactive=${includeInactive}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDueType(id: string | undefined) {
  return useFetchResource<DueType>(
    DUE_TYPES_ENDPOINT,
    id,
    [DUE_TYPES_KEY, id as string],
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useCreateDueType() {
  const queryClient = useQueryClient();

  return useCreateResource<DueType, Partial<DueType>>(
    DUE_TYPES_ENDPOINT,
    [DUE_TYPES_KEY],
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DUE_TYPES_KEY] });
      },
    }
  );
}

export function useUpdateDueType() {
  const queryClient = useQueryClient();

  return useUpdateResource<DueType, Partial<DueType>>(
    DUE_TYPES_ENDPOINT,
    [DUE_TYPES_KEY],
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [DUE_TYPES_KEY, data._id] });
        queryClient.invalidateQueries({ queryKey: [DUE_TYPES_KEY] });
      },
    }
  );
}

export function useDeleteDueType() {
  const queryClient = useQueryClient();

  return useDeleteResource<DueType>(DUE_TYPES_ENDPOINT, [DUE_TYPES_KEY], {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DUE_TYPES_KEY] });
    },
  });
}

// Clearance certificate
export function useGenerateClearanceCertificate(
  pharmacyId: string | undefined,
  year?: number
) {
  return useMutation<
    { success: boolean; data: { certificateUrl: string } },
    AxiosError<ApiError>,
    void
  >({
    mutationFn: () =>
      getWithRetry(
        `/pharmacies/${pharmacyId}/dues/certificate${
          year ? `?year=${year}` : ''
        }`
      ),
  });
}
