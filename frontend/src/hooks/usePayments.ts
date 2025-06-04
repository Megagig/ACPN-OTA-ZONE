import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import financialService from '../services/financial.service';
import type { Payment } from '../types/financial.types';

// Export Payment approval status constants
export const PaymentApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type PaymentApprovalStatus =
  (typeof PaymentApprovalStatus)[keyof typeof PaymentApprovalStatus];

// Export Payment type
export type { Payment };

// Custom hook for fetching all payments with pagination and filters
export const usePayments = (
  page = 1,
  limit = 10,
  filters: { approvalStatus?: PaymentApprovalStatus } = {}
) => {
  return useQuery({
    queryKey: ['payments', page, limit, filters],
    queryFn: () =>
      financialService.getAllPayments({
        page,
        limit,
        status: filters.approvalStatus,
      }),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching pending payments
export const usePendingPayments = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['pendingPayments', page, limit],
    queryFn: () => financialService.getPendingPayments(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Custom hook for reviewing a payment (approve/reject)
export const useReviewPayment = (paymentId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      if (data.action === 'approve') {
        return financialService.approvePayment(paymentId);
      } else {
        if (!data.rejectionReason) {
          throw new Error('Rejection reason is required');
        }
        return financialService.rejectPayment(paymentId, {
          rejectionReason: data.rejectionReason,
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    },
  });
};

// Custom hook for deleting a payment
export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) =>
      financialService.deletePayment(paymentId),
    onSuccess: () => {
      // Invalidate and refetch payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    },
  });
};

// Custom hook for submitting a new payment
export const useSubmitPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => financialService.submitPayment(data),
    onSuccess: () => {
      // Invalidate and refetch payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    },
  });
};

// Custom hook for fetching payments by due ID
export const usePaymentsByDue = (dueId: string) => {
  return useQuery({
    queryKey: ['paymentsByDue', dueId],
    queryFn: () => financialService.getPaymentsByDue(dueId),
    enabled: !!dueId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching pharmacy payment history
export const usePharmacyPaymentHistory = (pharmacyId: string) => {
  return useQuery({
    queryKey: ['pharmacyPaymentHistory', pharmacyId],
    queryFn: () => financialService.getPharmacyPaymentHistory(pharmacyId),
    enabled: !!pharmacyId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
};
