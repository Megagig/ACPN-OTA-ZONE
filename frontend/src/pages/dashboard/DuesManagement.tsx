import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import api from '../../services/api';
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

  const handleDueStatusChange = async (
    dueId: string,
    newStatus: 'pending' | 'paid' | 'overdue' | 'partially_paid'
  ) => {
    try {
      await financialService.updateDue(dueId, { paymentStatus: newStatus });
      setDues(
        dues.map((due) =>
          due._id === dueId ? { ...due, paymentStatus: newStatus } : due
        )
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating due status:', error);
      setError(`Failed to update due status: ${message}`);
    }
  };

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
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-4 md:mb-0">
          Dues Management
        </h1>
        <div className="flex space-x-2">
          {activeTab === 'dues' ? (
            <button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow transition-colors"
              onClick={() => navigate('/finances/dues/new')}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Due
            </button>
          ) : (
            <button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow transition-colors"
              onClick={() => navigate('/finances/payments/new')}
            >
              <i className="fas fa-plus mr-2"></i>
              Record Payment
            </button>
          )}
        </div>
      </div>

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
            Dues
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 transition-colors ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {activeTab === 'dues' ? 'Title' : 'Due'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {activeTab === 'dues' ? 'Due Date' : 'Payment Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-muted-foreground"
                    >
                      No {activeTab} found
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
                                <div className="text-sm text-muted-foreground">
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
                          <button
                            className="text-primary hover:text-primary/80 mr-3 transition-colors"
                            onClick={() =>
                              navigate(`/finances/dues/${due._id}`)
                            }
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3 transition-colors"
                            onClick={() =>
                              navigate(`/finances/dues/${due._id}/edit`)
                            }
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            onClick={() => handleDeleteDue(due._id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
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
                          {formatDate(payment.paymentDate || payment.createdAt)}
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
                          {payment._id && (
                            <>
                              <button
                                className="text-primary hover:text-primary/80 mr-3 transition-colors"
                                onClick={() =>
                                  navigate(`/finances/payments/${payment._id}`)
                                }
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              {(payment.status === 'pending' ||
                                payment.approvalStatus === 'pending') && (
                                <>
                                  <button
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 mr-3 transition-colors"
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
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 mr-3 transition-colors"
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
                            </>
                          )}
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
