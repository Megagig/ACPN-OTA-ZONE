import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { PaymentSubmission } from '../../types/pharmacy.types';
import type { Payment } from '../../types/financial.types';

interface PaymentWithDetails
  extends Omit<PaymentSubmission, 'dueId' | 'pharmacyId'> {
  dueId: {
    _id: string;
    title: string;
    dueTypeId: {
      _id: string;
      name: string;
    };
  };
  pharmacyId: {
    _id: string;
    name: string;
    registrationNumber: string;
  };
}

// Define response types
interface PaginatedResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type PaymentsResponse = Payment[] | PaginatedResponse;

import NotificationModal from '../../components/common/NotificationModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const AdminPaymentReview: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    rejectionReason: '',
  });
  const [processingReview, setProcessingReview] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Add function to show notifications
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  // Function to close notification
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching payments with filter:', filterStatus);

      let response: PaymentsResponse;
      if (filterStatus === 'pending') {
        response = await financialService.getPendingPayments();
      } else {
        response = await financialService.getAllPayments({
          page: currentPage,
          limit: itemsPerPage,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        });
      }

      console.log('API Response:', response);

      // Handle both array response and paginated response formats
      if (Array.isArray(response)) {
        console.log('Response is an array with length:', response.length);

        // Normalize status field to handle both 'status' and 'approvalStatus'
        const normalizedPayments = response.map((payment) => {
          // Create a normalized copy that ensures status field exists
          const normalizedPayment = { ...payment } as any;

          // If approvalStatus exists but status doesn't, copy it to status
          if (normalizedPayment.approvalStatus && !normalizedPayment.status) {
            normalizedPayment.status = normalizedPayment.approvalStatus;
          }

          if (debugMode) {
            console.log('Payment data:', {
              id: normalizedPayment._id,
              status: normalizedPayment.status,
              approvalStatus: normalizedPayment.approvalStatus,
            });
          }

          return normalizedPayment;
        });

        setPayments(normalizedPayments as unknown as PaymentWithDetails[]);
        setTotalPages(1); // No pagination info available
      } else {
        console.log(
          'Response is paginated with payments:',
          response.payments?.length
        );

        // Normalize status field in paginated response
        const normalizedPayments = response.payments?.map((payment) => {
          // Create a normalized copy that ensures status field exists
          const normalizedPayment = { ...payment } as any;

          // If approvalStatus exists but status doesn't, copy it to status
          if (normalizedPayment.approvalStatus && !normalizedPayment.status) {
            normalizedPayment.status = normalizedPayment.approvalStatus;
          }

          if (debugMode) {
            console.log('Payment data:', {
              id: normalizedPayment._id,
              status: normalizedPayment.status,
              approvalStatus: normalizedPayment.approvalStatus,
            });
          }

          return normalizedPayment;
        });

        setPayments(normalizedPayments as unknown as PaymentWithDetails[]);
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load payments';
      console.error('Error details:', err);
      setError(errorMessage);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  // We're using direct action buttons instead
  // const handleReviewPayment = (payment: PaymentWithDetails) => {
  //   setSelectedPayment(payment);
  //   setReviewData({
  //     status: 'approved',
  //     rejectionReason: '',
  //   });
  //   setShowReviewModal(true);
  // };

  // Handle approving a payment directly
  const handleApprovePayment = async (payment: PaymentWithDetails) => {
    if (processingAction) return;

    try {
      setProcessingAction(true);
      setError(null);

      await financialService.approvePayment(payment._id);

      // Show success notification
      showNotification('success', 'Success', 'Payment approved successfully!');

      // Refresh payments list
      fetchPayments();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve payment';
      setError(errorMessage);
      showNotification('error', 'Error', errorMessage);
      console.error('Error approving payment:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle rejecting a payment
  const handleRejectPayment = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Handle deleting a payment
  const handleDeletePayment = (paymentId: string) => {
    setConfirmDeleteId(paymentId);
    setShowConfirmDelete(true);
  };

  // Submit rejection with reason
  const submitRejection = async () => {
    if (!selectedPayment || !rejectionReason.trim() || processingAction) return;

    try {
      setProcessingAction(true);
      setError(null);

      await financialService.rejectPayment(selectedPayment._id, {
        rejectionReason: rejectionReason.trim(),
      });

      // Show success notification
      showNotification('success', 'Success', 'Payment rejected successfully!');

      // Reset state and close modal
      setRejectionReason('');
      setSelectedPayment(null);
      setShowRejectModal(false);

      // Refresh payments list
      fetchPayments();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reject payment';
      setError(errorMessage);
      showNotification('error', 'Error', errorMessage);
      console.error('Error rejecting payment:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) {
      return;
    }
    if (
      reviewData.status === 'rejected' &&
      !reviewData.rejectionReason.trim()
    ) {
      setError('Please provide a reason for rejection');
      showNotification(
        'error',
        'Error',
        'Please provide a reason for rejection'
      );
      return;
    }

    try {
      setProcessingReview(true);

      await financialService.reviewPayment(selectedPayment._id, {
        status: reviewData.status,
        rejectionReason:
          reviewData.status === 'rejected'
            ? reviewData.rejectionReason
            : undefined,
      });

      // Refresh payments list
      fetchPayments();

      // Close modal
      setSelectedPayment(null);
      setShowReviewModal(false);
      setError(null);

      // Show success notification
      showNotification(
        'success',
        'Success',
        `Payment ${reviewData.status} successfully!`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to review payment';
      setError(errorMessage);
    } finally {
      setProcessingReview(false);
    }
  };

  const openReceiptViewer = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  const getStatusBadgeClass = (status: string): string => {
    // Handle potential undefined or empty status
    const paymentStatus = status?.toLowerCase() || 'pending';

    switch (paymentStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // These methods have been properly consolidated

  // Define a method to get payment status that checks both status and approvalStatus fields
  const getPaymentStatus = (payment: PaymentWithDetails): string => {
    return payment?.status || (payment as any)?.approvalStatus || 'pending';
  };

  // Confirm and execute payment deletion
  const confirmDelete = async () => {
    if (!confirmDeleteId || processingAction) return;

    try {
      setProcessingAction(true);
      setError(null);

      await financialService.deletePayment(confirmDeleteId);

      // Show success notification
      showNotification('success', 'Success', 'Payment deleted successfully!');

      // Reset state and close modal
      setConfirmDeleteId(null);
      setShowConfirmDelete(false);

      // Refresh payments list
      fetchPayments();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      console.error('Error deleting payment:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Payment Review
              </h1>
              <p className="mt-2 text-gray-600">
                Review and approve payment submissions from pharmacies
              </p>
            </div>
            <Link
              to="/dashboard/financial-management"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Financial Management
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status Filter
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Payments</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setDebugMode(!debugMode);
                    // Force a refresh of the data with debug mode
                    fetchPayments();
                  }}
                  className={`text-xs font-medium rounded px-3 py-1 mt-6 ${
                    debugMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <div className="mb-6 bg-gray-800 text-white p-4 rounded-lg overflow-auto max-h-64">
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300">
                  Payment Count
                </h4>
                <p className="text-xs">Total: {payments?.length || 0}</p>
                <p className="text-xs">
                  Pending:{' '}
                  {payments?.filter((p) => getPaymentStatus(p) === 'pending')
                    ?.length || 0}
                </p>
                <p className="text-xs">
                  Approved:{' '}
                  {payments?.filter((p) => getPaymentStatus(p) === 'approved')
                    ?.length || 0}
                </p>
                <p className="text-xs">
                  Rejected:{' '}
                  {payments?.filter((p) => getPaymentStatus(p) === 'rejected')
                    ?.length || 0}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300">Filter</h4>
                <p className="text-xs">Current filter: {filterStatus}</p>
                <p className="text-xs">Current page: {currentPage}</p>
                <p className="text-xs">Total pages: {totalPages}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300">
                First 3 Payments
              </h4>
              <pre className="text-xs mt-2 overflow-auto max-h-32">
                {JSON.stringify(
                  payments?.slice(0, 3).map((p) => ({
                    id: p._id,
                    status: p.status,
                    approvalStatus: (p as any).approvalStatus,
                    calculatedStatus: getPaymentStatus(p),
                    pharmacy:
                      typeof p.pharmacyId === 'object'
                        ? p.pharmacyId.name
                        : 'unknown',
                    amount: p.amount,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Review
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {payments?.filter((p) => getPaymentStatus(p) === 'pending')
                      ?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {payments?.filter((p) => getPaymentStatus(p) === 'approved')
                      ?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rejected
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {payments?.filter((p) => getPaymentStatus(p) === 'rejected')
                      ?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(
                      payments?.reduce((sum, p) => sum + p.amount, 0) || 0
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Submissions
              </h3>
              <button
                onClick={() => fetchPayments()}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!payments || payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof payment.pharmacyId === 'object'
                              ? payment.pharmacyId.name
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {typeof payment.pharmacyId === 'object'
                              ? payment.pharmacyId.registrationNumber
                              : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof payment.dueId === 'object'
                              ? payment.dueId.title
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {typeof payment.dueId === 'object'
                              ? payment.dueId.dueTypeId.name
                              : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </div>
                        {payment.paymentReference && (
                          <div className="text-sm text-gray-500">
                            Ref: {payment.paymentReference}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            getPaymentStatus(payment)
                          )}`}
                        >
                          {getPaymentStatus(payment)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() =>
                              openReceiptViewer(payment.receiptUrl)
                            }
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium flex items-center justify-center"
                          >
                            <svg
                              className="w-3.5 h-3.5 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Receipt
                          </button>
                          {/* Always show action buttons regardless of status */}
                          <button
                            onClick={() => handleApprovePayment(payment)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium flex items-center justify-center"
                          >
                            <svg
                              className="w-3.5 h-3.5 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium flex items-center justify-center"
                          >
                            <svg
                              className="w-3.5 h-3.5 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment._id)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-medium flex items-center justify-center"
                          >
                            <svg
                              className="w-3.5 h-3.5 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Review Payment
                </h3>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Pharmacy:</strong>{' '}
                    {typeof selectedPayment.pharmacyId === 'object'
                      ? selectedPayment.pharmacyId.name
                      : 'N/A'}
                  </p>
                  <p className="text-sm">
                    <strong>Due:</strong>{' '}
                    {typeof selectedPayment.dueId === 'object'
                      ? selectedPayment.dueId.title
                      : 'N/A'}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong>{' '}
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-sm">
                    <strong>Method:</strong>{' '}
                    {selectedPayment.paymentMethod.replace('_', ' ')}
                  </p>
                </div>

                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <select
                      value={reviewData.status}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          status: e.target.value as 'approved' | 'rejected',
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>

                  {reviewData.status === 'rejected' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={reviewData.rejectionReason}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            rejectionReason: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedPayment(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingReview}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                        reviewData.status === 'approved'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {processingReview
                        ? 'Processing...'
                        : `${
                            reviewData.status === 'approved'
                              ? 'Approve'
                              : 'Reject'
                          } Payment`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedPayment && (
          <ConfirmationModal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setSelectedPayment(null);
            }}
            onConfirm={submitRejection}
            title="Reject Payment"
            message={`Please provide a reason for rejecting the payment of ${formatCurrency(
              selectedPayment.amount
            )} from ${
              typeof selectedPayment.pharmacyId === 'object'
                ? selectedPayment.pharmacyId.name
                : 'Unknown Pharmacy'
            }`}
            confirmText={processingAction ? 'Processing...' : 'Reject Payment'}
            cancelText="Cancel"
          >
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Pharmacy:</strong>{' '}
                {typeof selectedPayment.pharmacyId === 'object'
                  ? selectedPayment.pharmacyId.name
                  : 'N/A'}
              </p>
              <p className="text-sm">
                <strong>Due:</strong>{' '}
                {typeof selectedPayment.dueId === 'object'
                  ? selectedPayment.dueId.title
                  : 'N/A'}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong>{' '}
                {formatCurrency(selectedPayment.amount)}
              </p>
              <p className="text-sm">
                <strong>Method:</strong>{' '}
                {selectedPayment.paymentMethod.replace('_', ' ')}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          </ConfirmationModal>
        )}

        {/* Confirm Delete Modal */}
        {showConfirmDelete && (
          <ConfirmationModal
            isOpen={showConfirmDelete}
            onClose={() => setShowConfirmDelete(false)}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message="Are you sure you want to delete this payment? This action cannot be undone."
            confirmText={processingAction ? 'Processing...' : 'Delete Payment'}
            cancelText="Cancel"
          />
        )}

        {/* Notification Modal */}
        {notification.isOpen && (
          <NotificationModal
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={closeNotification}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPaymentReview;
