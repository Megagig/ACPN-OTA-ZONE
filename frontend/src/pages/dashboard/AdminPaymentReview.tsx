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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/shadcn/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/shadcn/dropdown-menu';
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
  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData?.pagination?.totalPages || 1;
  const pendingCount = pendingPaymentsData?.length || 0;

  // Loading and error states
  const isLoading = paymentsLoading || pendingLoading;
  const error = paymentsError || pendingError || reviewError || deleteError;

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
      <Alert className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load payments: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Review</h1>
          <p className="text-muted-foreground">
            Manage and review payment submissions
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            {pendingCount} Pending Payments
          </Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            Review, approve, and reject payment submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={PaymentApprovalStatus.PENDING}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={PaymentApprovalStatus.PENDING}>
                Pending
              </TabsTrigger>
              <TabsTrigger value={PaymentApprovalStatus.APPROVED}>
                Approved
              </TabsTrigger>
              <TabsTrigger value={PaymentApprovalStatus.REJECTED}>
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pharmacy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-8 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-4 text-center text-muted-foreground"
                        >
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment: Payment) => (
                        <tr key={payment._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {payment.pharmacyId.toString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {payment.dueId.toString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {getPaymentMethodDisplay(
                              payment.paymentMethod || ''
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={getStatusBadgeColor(
                                (payment.approvalStatus ||
                                  payment.status) as PaymentApprovalStatus
                              )}
                            >
                              {payment.approvalStatus || payment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <a
                                    href={payment.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer"
                                  >
                                    View Receipt
                                  </a>
                                </DropdownMenuItem>

                                {payment.approvalStatus ===
                                  PaymentApprovalStatus.PENDING && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => openReviewModal(payment)}
                                    >
                                      Review Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openDeleteModal(payment)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      Delete Payment
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
            <DialogDescription>
              Review the payment details and approve or reject the submission.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Method
                  </p>
                  <p className="text-lg">
                    {getPaymentMethodDisplay(
                      selectedPayment.paymentMethod || ''
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reference
                  </p>
                  <p className="text-lg">
                    {selectedPayment.paymentReference || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Receipt
                </p>
                <a
                  href={selectedPayment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-muted px-4 py-2 rounded-md text-foreground hover:bg-accent transition-colors"
                >
                  View Receipt
                </a>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Decision
                </p>
                <Select
                  value={reviewData.action}
                  onValueChange={(value: string) =>
                    setReviewData({
                      ...reviewData,
                      action: value as 'approve' | 'reject',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reviewData.action === 'reject' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Reason for Rejection
                  </p>
                  <Textarea
                    value={reviewData.rejectionReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setReviewData({
                        ...reviewData,
                        rejectionReason: e.target.value,
                      })
                    }
                    placeholder="Provide a reason for rejection"
                    rows={3}
                  />
                  {reviewData.action === 'reject' &&
                    !reviewData.rejectionReason && (
                      <p className="text-sm text-red-500 mt-1">
                        Rejection reason is required
                      </p>
                    )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={
                isReviewing ||
                (reviewData.action === 'reject' && !reviewData.rejectionReason)
              }
              className={
                reviewData.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {isReviewing
                ? 'Processing...'
                : reviewData.action === 'approve'
                ? 'Approve Payment'
                : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot
              be undone.
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
              {isDeleting ? 'Deleting...' : 'Delete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentReview;
