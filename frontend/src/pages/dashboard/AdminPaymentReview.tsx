import React, { useState, useEffect } from 'react';
import {
  usePayments,
  usePendingPayments,
  useReviewPayment,
  useDeletePayment,
  PaymentApprovalStatus,
  type Payment,
} from '../../hooks/usePayments';
import { 
  Eye, 
  Check, 
  X, 
  Trash2, 
  CreditCard, 
  Calendar, 
  User, 
  Building, 
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminPaymentReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    rejectionReason: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payments from API
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(
    currentPage,
    10,
    activeTab !== 'all' ? { approvalStatus: activeTab as PaymentApprovalStatus } : {}
  );

  // Helper: get payments array from API response
  let payments: Payment[] = [];
  if (Array.isArray(paymentsData)) {
    payments = paymentsData;
  } else if (paymentsData) {
    if (Array.isArray(paymentsData.data)) {
      payments = paymentsData.data;
    } else if (paymentsData.payments) {
      payments = paymentsData.payments;
    } else if (paymentsData.data && Array.isArray(paymentsData.data.payments)) {
      payments = paymentsData.data.payments;
    }
  }

  // Filter by search
  const filteredPayments = payments.filter(payment => {
    const pharmacyName = typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
      ? payment.pharmacyId.name.toLowerCase()
      : '';
    const submittedBy = typeof payment.submittedBy === 'object' && payment.submittedBy !== null
      ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`.toLowerCase()
      : '';
    return (
      pharmacyName.includes(searchTerm.toLowerCase()) ||
      submittedBy.includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = paymentsData?.pagination?.totalPages || 1;

  // UI helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Building className="w-4 h-4" />;
      case 'cash': return <CreditCard className="w-4 h-4" />;
      case 'check': return <FileText className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  const getPaymentTitle = (payment: Payment) => {
    if ((payment as any).paymentType === 'event_fee') {
      return (payment as any).meta?.eventId || 'Event Fee';
    }
    if ((payment as any).paymentType === 'transportation') {
      return `Transportation - ${(payment as any).meta?.participant || 'N/A'}`;
    }
    return (payment as any).meta?.purpose || (payment as any).meta?.description || 'Payment';
  };

  // React Query hooks for review and delete
  const {
    mutate: reviewPayment,
    isPending: isReviewing,
    error: reviewError,
  } = useReviewPayment(selectedPayment?._id);

  const {
    mutate: deletePayment,
    isPending: isDeleting,
    error: deleteError,
  } = useDeletePayment();

  // Show error toasts for API errors
  useEffect(() => {
    if (paymentsError) {
      toast.error(`Error loading payments: ${paymentsError.message || paymentsError}`);
    }
    if (reviewError) {
      toast.error(`Error reviewing payment: ${reviewError.message || reviewError}`);
    }
    if (deleteError) {
      toast.error(`Error deleting payment: ${deleteError.message || deleteError}`);
    }
  }, [paymentsError, reviewError, deleteError]);

  // Modal handlers
  const openReviewModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setReviewData({ action: 'approve', rejectionReason: '' });
    setShowReviewModal(true);
  };
  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };
  const closeModals = () => {
    setShowReviewModal(false);
    setShowDeleteModal(false);
    setSelectedPayment(null);
    setReviewData({ action: 'approve', rejectionReason: '' });
  };
  const handleReviewSubmit = () => {
    if (!selectedPayment) return;
    reviewPayment(
      {
        action: reviewData.action,
        rejectionReason: reviewData.action === 'reject' ? reviewData.rejectionReason : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            reviewData.action === 'approve'
              ? 'Payment approved successfully'
              : 'Payment rejected successfully'
          );
          closeModals();
          refetchPayments();
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message || 'Failed to review payment.'}`);
        },
      }
    );
  };
  const handleDeletePayment = () => {
    if (!selectedPayment) return;
    deletePayment(selectedPayment._id, {
      onSuccess: () => {
        toast.success('Payment deleted successfully');
        closeModals();
        refetchPayments();
      },
      onError: (error: any) => {
        toast.error(`Error: ${error.message || 'Failed to delete payment.'}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Payment Review Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage and review all pharmacy payment submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Payments List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab as 'all' | 'pending' | 'approved' | 'rejected'); setCurrentPage(1); }}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {paymentsLoading ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading payments...</h3>
                <p className="text-gray-500">Please wait while payments are loaded.</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-500">There are no payments matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                                ? payment.pharmacyId.name
                                : typeof payment.pharmacyId === 'string'
                                ? payment.pharmacyId
                                : 'Unknown Pharmacy'}
                            </h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.approvalStatus)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(payment.approvalStatus)}
                                <span className="capitalize">{payment.approvalStatus}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{getPaymentTitle(payment)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="flex items-center text-gray-500 text-sm mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(payment.submittedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {getPaymentMethodIcon(payment.paymentMethod || '')}
                          <span className="capitalize">
                            {(payment.paymentMethod || '').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>
                            {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                              ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Receipt className="w-4 h-4" />
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View Receipt
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openReviewModal(payment)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                          disabled={isReviewing || isDeleting}
                        >
                          {isReviewing ? <span className="animate-spin mr-2"><Clock className="w-4 h-4" /></span> : <Eye className="w-4 h-4 mr-2" />}
                          Review
                        </button>
                        <button
                          onClick={() => openDeleteModal(payment)}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                          disabled={isReviewing || isDeleting}
                        >
                          {isDeleting ? <span className="animate-spin mr-2"><Clock className="w-4 h-4" /></span> : <Trash2 className="w-4 h-4 mr-2" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Review Modal */}
      {showReviewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Review Payment</h2>
              <p className="text-gray-600 text-sm mt-1">
                Review the payment details and choose your action
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{selectedPayment.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="capitalize">{(selectedPayment.paymentMethod || '').replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{('paymentType' in selectedPayment ? (selectedPayment as any).paymentType : '').replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pharmacy:</span>
                    <span>{typeof selectedPayment.pharmacyId === 'object' && selectedPayment.pharmacyId !== null && 'name' in selectedPayment.pharmacyId ? selectedPayment.pharmacyId.name : 'Unknown Pharmacy'}</span>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Action</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReviewData({ ...reviewData, action: 'approve' })}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      reviewData.action === 'approve'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    <Check className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Approve</span>
                  </button>
                  <button
                    onClick={() => setReviewData({ ...reviewData, action: 'reject' })}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      reviewData.action === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <X className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Reject</span>
                  </button>
                </div>
              </div>
              {/* Rejection Reason */}
              {reviewData.action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={reviewData.rejectionReason}
                    onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                disabled={isReviewing}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={isReviewing || (reviewData.action === 'reject' && !reviewData.rejectionReason)}
                className="flex-1 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isReviewing ? 'Processing...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delete Payment</h2>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  You are about to permanently delete the payment from{' '}
                  <span className="font-medium">{typeof selectedPayment.pharmacyId === 'object' && selectedPayment.pharmacyId !== null && 'name' in selectedPayment.pharmacyId ? selectedPayment.pharmacyId.name : 'Unknown Pharmacy'}</span>{' '}
                  for <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayment}
                  className="flex-1 px-4 py-2 bg-red-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentReview;