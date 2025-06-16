import React, { useState } from 'react';
import {
  usePayments,
  usePendingPayments,
  useReviewPayment,
  useDeletePayment,
  PaymentApprovalStatus,
  type Payment,
} from '../../hooks/usePayments';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/shadcn/card';
import { Button } from '../../components/shadcn/button';
import { Badge } from '../../components/shadcn/badge';
import { Skeleton } from '../../components/shadcn/skeleton';
import { Pagination } from '../../components/shadcn/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/shadcn/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/shadcn/alert';
import { Textarea } from '../../components/shadcn/textarea';
import { toast } from 'react-toastify';

const AdminPaymentReview: React.FC = () => {
  // State for UI management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<PaymentApprovalStatus | 'all'>(
    PaymentApprovalStatus.PENDING
  );

  // State for payment review
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    rejectionReason: '',
  });

  // React Query hooks
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(
    currentPage,
    itemsPerPage,
    activeTab !== 'all' ? { approvalStatus: activeTab } : {}
  );

  const {
    data: pendingPaymentsData,
    isLoading: pendingLoading,
    error: pendingError,
  } = usePendingPayments(1, 5);

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

  // Derived data
  const payments = paymentsData?.data || [];
  const totalPages = paymentsData?.pagination?.totalPages || 1;
  const pendingCount = pendingPaymentsData?.length || 0;

  // Loading and error states
  const isLoading = paymentsLoading || pendingLoading;
  const error = paymentsError || pendingError || reviewError || deleteError;

  // Debug logging
  if (error) {
    console.error('AdminPaymentReview error:', error);
  }
  console.log('AdminPaymentReview payments:', payments);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as PaymentApprovalStatus | 'all');
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open review modal
  const openReviewModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setReviewData({
      action: 'approve',
      rejectionReason: '',
    });
    setShowReviewModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  // Close all modals
  const closeModals = () => {
    setShowReviewModal(false);
    setShowDeleteModal(false);
    setSelectedPayment(null);
    setReviewData({
      action: 'approve',
      rejectionReason: '',
    });
  };

  // Handle review submission
  const handleReviewSubmit = () => {
    if (!selectedPayment) return;

    reviewPayment(
      {
        action: reviewData.action,
        rejectionReason:
          reviewData.action === 'reject'
            ? reviewData.rejectionReason
            : undefined,
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
        onError: (error) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  // Handle payment deletion
  const handleDeletePayment = () => {
    if (!selectedPayment) return;

    deletePayment(selectedPayment._id, {
      onSuccess: () => {
        toast.success('Payment deleted successfully');
        closeModals();
        refetchPayments();
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Check';
      default:
        return method.replace('_', ' ');
    }
  };

  // Get payment type display name
  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case 'event_fee':
        return 'Event Fee';
      case 'transportation':
        return 'Transportation';
      case 'due':
        return 'Dues';
      case 'donation':
        return 'Donation';
      default:
        return type.replace('_', ' ');
    }
  };

  // Get payment title/description
  const getPaymentTitle = (payment: Payment) => {
    if ((payment as any).paymentType === 'event_fee') {
      const participant = (payment as any).meta?.participant;
      const eventId = (payment as any).meta?.eventId;
      return participant ? `${eventId || 'Event'} - ${participant}` : (eventId || 'Event Fee');
    }
    if ((payment as any).paymentType === 'transportation') {
      const participant = (payment as any).meta?.participant;
      return participant ? `Transportation - ${participant}` : 'Transportation';
    }
    return (payment as any).meta?.purpose || (payment as any).meta?.description || 'N/A';
  };

  // Status badge color mapping
  const getStatusBadgeColor = (status: PaymentApprovalStatus) => {
    switch (status) {
      case PaymentApprovalStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case PaymentApprovalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case PaymentApprovalStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (error) {
    return (
      <Alert className="mb-6" variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' && error}
          {error && typeof error === 'object' && 'message' in error && (error as any).message}
          {!error && 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Payment Review</h1>
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={PaymentApprovalStatus.PENDING}>Pending</TabsTrigger>
          <TabsTrigger value={PaymentApprovalStatus.APPROVED}>Approved</TabsTrigger>
          <TabsTrigger value={PaymentApprovalStatus.REJECTED}>Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <div className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : payments.length === 0 ? (
              <Alert>
                <AlertTitle>No Payments Found</AlertTitle>
                <AlertDescription>There are no payments to review.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Payment) => (
                  <Card key={payment._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                              ? payment.pharmacyId.name
                              : typeof payment.pharmacyId === 'string'
                              ? payment.pharmacyId
                              : 'Unknown Pharmacy'}
                          </CardTitle>
                          <CardDescription>
                            {formatDate(payment.submittedAt || '')}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadgeColor(payment.approvalStatus)}>
                          {payment.approvalStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Payment Type:</span>
                            <span className="ml-2">{getPaymentTypeDisplay((payment as any).paymentType)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Title:</span>
                            <span className="ml-2">{getPaymentTitle(payment)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Amount:</span>
                            <span className="ml-2">{formatCurrency(payment.amount)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Method:</span>
                            <span className="ml-2">{getPaymentMethodDisplay(payment.paymentMethod || '')}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Submitted By:</span>
                            <span className="ml-2">
                              {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                                ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                                : 'Unknown'}
                            </span>
                          </div>
                          {payment.receiptUrl && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Receipt:</span>
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => openReviewModal(payment)}
                        >
                          Review
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => openDeleteModal(payment)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedPayment && (
        <Dialog isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Payment</DialogTitle>
              <DialogDescription>
                Review the payment details and choose to approve or reject.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Payment Details</h3>
                <div className="space-y-2">
                  <p>Amount: {formatCurrency(selectedPayment.amount)}</p>
                  <p>Method: {getPaymentMethodDisplay(selectedPayment.paymentMethod || '')}</p>
                  <p>Type: {getPaymentTypeDisplay((selectedPayment as any).paymentType)}</p>
                  <p>Title: {getPaymentTitle(selectedPayment)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant={reviewData.action === 'approve' ? 'default' : 'outline'}
                  onClick={() => setReviewData({ ...reviewData, action: 'approve' })}
                  className="w-full"
                >
                  Approve
                </Button>
                <Button
                  variant={reviewData.action === 'reject' ? 'destructive' : 'outline'}
                  onClick={() => setReviewData({ ...reviewData, action: 'reject' })}
                  className="w-full"
                >
                  Reject
                </Button>
                {reviewData.action === 'reject' && (
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={reviewData.rejectionReason}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, rejectionReason: e.target.value })
                    }
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModals}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewSubmit}
                disabled={isReviewing || (reviewData.action === 'reject' && !reviewData.rejectionReason)}
              >
                {isReviewing ? 'Processing...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayment && (
        <Dialog isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeModals}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePayment}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPaymentReview;
