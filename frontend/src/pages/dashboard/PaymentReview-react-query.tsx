import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  usePayment,
  useReviewPayment,
  PaymentApprovalStatus,
} from '../../hooks/usePayments';

const PaymentReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch payment data using React Query
  const { data: paymentData, isLoading, error } = usePayment(id);

  // Review mutation hook
  const {
    mutate: reviewPayment,
    isPending: isSubmitting,
    error: reviewError,
    isSuccess: isReviewSuccess,
  } = useReviewPayment(id);

  const handleApprove = () => {
    reviewPayment({
      action: 'approve',
    });
  };

  const handleReject = () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }

    reviewPayment({
      action: 'reject',
      rejectionReason,
    });

    setShowRejectModal(false);
  };

  const openRejectModal = () => {
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // After successful review, navigate back to payments list
  if (isReviewSuccess) {
    navigate('/finances/payments');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error loading payment: {(error as Error).message}</p>
      </div>
    );
  }

  const payment = paymentData;
  if (!payment) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        <p>Payment not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Payment Review</h1>
        <button
          onClick={() => navigate('/finances/payments')}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to Payments
        </button>
      </div>

      {/* Alert for errors */}
      {reviewError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{(reviewError as Error).message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Details */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-muted border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Payment Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Payment ID
                  </p>
                  <p className="text-foreground font-medium">{payment._id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-foreground font-medium text-lg">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Payment Method
                  </p>
                  <p className="text-foreground font-medium capitalize">
                    {typeof payment.paymentMethod === 'string'
                      ? payment.paymentMethod.replace('_', ' ')
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Payment Reference
                  </p>
                  <p className="text-foreground font-medium">
                    {payment.paymentReference || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Submitted On
                  </p>
                  <p className="text-foreground font-medium">
                    {formatDate(payment.submittedAt || payment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.approvalStatus === PaymentApprovalStatus.APPROVED
                        ? 'bg-green-100 text-green-800'
                        : payment.approvalStatus ===
                          PaymentApprovalStatus.REJECTED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {payment.approvalStatus}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Due Information
                </p>
                <div className="bg-muted p-4 rounded-md">
                  {typeof payment.dueId === 'object' &&
                  payment.dueId &&
                  'title' in payment.dueId ? (
                    <div>
                      <p className="font-medium">{payment.dueId.title}</p>
                      {payment.dueId.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {payment.dueId.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="italic text-muted-foreground">
                      Due information not available
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Pharmacy Information
                </p>
                <div className="bg-muted p-4 rounded-md">
                  {typeof payment.pharmacyId === 'object' &&
                  payment.pharmacyId &&
                  'name' in payment.pharmacyId ? (
                    <div>
                      <p className="font-medium">{payment.pharmacyId.name}</p>
                      {payment.pharmacyId.registrationNumber && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Registration: {payment.pharmacyId.registrationNumber}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="italic text-muted-foreground">
                      Pharmacy information not available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt and Actions */}
        <div>
          <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-muted border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Receipt</h2>
            </div>
            <div className="p-6">
              {payment.receiptUrl ? (
                <div className="flex flex-col items-center">
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4"
                  >
                    <img
                      src={payment.receiptUrl}
                      alt="Payment Receipt"
                      className="max-w-full h-auto rounded-md"
                    />
                  </a>
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    View Full Size
                  </a>
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic">
                  No receipt uploaded
                </p>
              )}
            </div>
          </div>

          {/* Actions Panel (only show if payment is pending) */}
          {payment.approvalStatus === PaymentApprovalStatus.PENDING && (
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-muted border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Approve Payment'}
                  </button>
                  <button
                    onClick={openRejectModal}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reject Payment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Reject Payment
            </h3>
            <p className="text-muted-foreground mb-4">
              Please provide a reason for rejecting this payment:
            </p>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rejection reason"
            ></textarea>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReview;
