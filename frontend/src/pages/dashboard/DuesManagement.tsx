import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { Due, DuePayment } from '../../types/financial.types';

const DuesManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dues' | 'payments'>('dues');
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<DuePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'dues') {
        const duesData = await financialService.getDues();
        if (Array.isArray(duesData)) {
          setDues(duesData);
        } else {
          console.error('Invalid dues data format:', duesData);
          setError('Received invalid dues data format from server');
          setDues([]);
        }
      } else {
        const paymentsData = await financialService.getDuePayments();
        if (Array.isArray(paymentsData)) {
          setPayments(paymentsData);
        } else {
          console.error('Invalid payments data format:', paymentsData);
          setError('Received invalid payments data format from server');
          setPayments([]);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching ${activeTab}:`, error);
      setError(`Failed to load ${activeTab} data: ${message}`);
      if (activeTab === 'dues') {
        setDues([]);
      } else {
        setPayments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage]);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (activeTab === 'dues' ? dues : payments).slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(
    (activeTab === 'dues' ? dues.length : payments.length) / itemsPerPage
  );

  const handleDeleteDue = async (dueId: string) => {
    if (!window.confirm('Are you sure you want to delete this due?')) {
      return;
    }

    try {
      await financialService.deleteDue(dueId);
      setDues(dues.filter((due) => due._id !== dueId));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting due:', error);
      setError(`Failed to delete due: ${message}`);
    }
  };

  const handlePaymentStatusChange = async (
    paymentId: string,
    newStatus: 'pending' | 'approved' | 'rejected'
  ) => {
    try {
      if (newStatus === 'approved') {
        await financialService.approvePayment(paymentId);
      } else if (newStatus === 'rejected') {
        // Note: rejectionReason should be provided for rejections
        await financialService.reviewPayment(paymentId, {
          status: newStatus,
          rejectionReason: 'Payment rejected',
        });
      }

      setPayments(
        payments.map((payment) =>
          payment._id === paymentId
            ? { ...payment, approvalStatus: newStatus, status: newStatus }
            : payment
        )
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating payment status:', error);
      setError(`Failed to update payment status: ${message}`);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error: unknown) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'rejected':
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'partially_paid':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300';
    }
  };

  const formatStatus = (status: string): string => {
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dues Management</h1>
          <p className="text-muted-foreground">Manage all dues and payments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
          {activeTab === 'dues' ? (
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 flex items-center gap-2"
              onClick={() => navigate('/finances/dues/new')}
            >
              <i className="fas fa-plus"></i>
              Create Due
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 flex items-center gap-2"
              onClick={() => navigate('/finances/payments/new')}
            >
              <i className="fas fa-plus"></i>
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 transition-colors ${
              activeTab === 'dues'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('dues')}
          >
            <i className="fas fa-list mr-2"></i>Dues
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 transition-colors ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            <i className="fas fa-money-check-alt mr-2"></i>Payments
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 border-l-4 border-destructive/20 text-destructive p-4 mb-6 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-border">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin text-primary text-3xl mb-2">
              <i className="fas fa-circle-notch"></i>
            </div>
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-muted rounded w-full mb-2"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {activeTab === 'dues' ? 'Title' : 'Due'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {activeTab === 'dues' ? 'Due Date' : 'Payment Date'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      <i className="fas fa-info-circle text-2xl mb-2"></i>
                      <div>No {activeTab} found</div>
                    </td>
                  </tr>
                ) : activeTab === 'dues' ? (
                  currentItems.map((item) => {
                    const due = item as Due;
                    return (
                      <tr
                        key={due._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {due.title}
                              </div>
                              {due.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {due.description.length > 50
                                    ? `${due.description.substring(0, 50)}...`
                                    : due.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {formatCurrency(due.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(due.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              due.paymentStatus
                            )}`}
                          >
                            {formatStatus(due.paymentStatus || 'pending')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              className="text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-primary/20 bg-primary/5"
                              onClick={() =>
                                navigate(`/finances/dues/${due._id}`)
                              }
                              title="View Due"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded border border-blue-400/20 bg-blue-100/10"
                              onClick={() =>
                                navigate(`/finances/dues/${due._id}/edit`)
                              }
                              title="Edit Due"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded border border-destructive/20 bg-destructive/5"
                              onClick={() => handleDeleteDue(due._id)}
                              title="Delete Due"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  currentItems.map((item) => {
                    const payment = item as DuePayment;
                    return (
                      <tr
                        key={payment._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {payment.dueId &&
                          typeof payment.dueId === 'object' &&
                          'title' in payment.dueId
                            ? payment.dueId.title
                            : 'Unknown Due'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(
                            payment.paymentDate || payment.createdAt || ''
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              payment.status ||
                                payment.approvalStatus ||
                                'pending'
                            )}`}
                          >
                            {formatStatus(
                              payment.status ||
                                payment.approvalStatus ||
                                'pending'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              className="text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-primary/20 bg-primary/5"
                              onClick={() =>
                                navigate(`/finances/payments/${payment._id}`)
                              }
                              title="View Payment"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {(payment.status === 'pending' ||
                              payment.approvalStatus === 'pending') && (
                              <>
                                <button
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors px-2 py-1 rounded border border-green-400/20 bg-green-100/10"
                                  onClick={() =>
                                    handlePaymentStatusChange(
                                      payment._id,
                                      'approved'
                                    )
                                  }
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-400/20 bg-red-100/10"
                                  onClick={() =>
                                    handlePaymentStatusChange(
                                      payment._id,
                                      'rejected'
                                    )
                                  }
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && !isLoading && (
          <div className="bg-card px-4 py-3 border-t border-border sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {indexOfFirstItem + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-foreground">
                      {Math.min(
                        indexOfLastItem,
                        (activeTab === 'dues' ? dues : payments).length
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-foreground">
                      {(activeTab === 'dues' ? dues : payments).length}
                    </span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'z-10 bg-primary/10 border-primary text-primary'
                              : 'bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuesManagement;
