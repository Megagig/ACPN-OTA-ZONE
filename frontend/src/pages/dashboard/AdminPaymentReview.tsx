import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { PaymentSubmission } from '../../types/pharmacy.types';

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

const AdminPaymentReview: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    rejectionReason: '',
  });
  const [processingReview, setProcessingReview] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (filterStatus === 'pending') {
        response = await financialService.getPendingPayments();
      } else {
        response = await financialService.getAllPayments({
          page: currentPage,
          limit: itemsPerPage,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        });
      }

      setPayments(response.data || response || []);
      if (response.pagination) {
        setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load payments';
      setError(errorMessage);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filterStatus]);

  const handleReviewPayment = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setReviewData({
      status: 'approved',
      rejectionReason: '',
    });
    setShowReviewModal(true);
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

      // Show success message
      alert(`Payment ${reviewData.status} successfully!`);
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
    switch (status) {
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
            </div>
          </div>
        </div>

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
                    {payments.filter((p) => p.status === 'pending').length}
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
                    {payments.filter((p) => p.status === 'approved').length}
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
                    {payments.filter((p) => p.status === 'rejected').length}
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
                      payments.reduce((sum, p) => sum + p.amount, 0)
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
            <h3 className="text-lg font-medium text-gray-900">
              Payment Submissions
            </h3>
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
                {payments.length === 0 ? (
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
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              openReceiptViewer(payment.receiptUrl)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Receipt
                          </button>
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleReviewPayment(payment)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Review
                            </button>
                          )}
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
      </div>
    </div>
  );
};

export default AdminPaymentReview;
