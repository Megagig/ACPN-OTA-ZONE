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

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
    } catch (err: any) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(
        `Failed to load ${activeTab} data: ${err?.message || 'Unknown error'}`
      );
      if (activeTab === 'dues') {
        setDues([]);
      } else {
        setPayments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDueStatusChange = async (
    dueId: string,
    newStatus: 'active' | 'inactive'
  ) => {
    try {
      await financialService.updateDue(dueId, { status: newStatus });
      // Update local state
      setDues(
        dues.map((due) =>
          due._id === dueId ? { ...due, status: newStatus } : due
        )
      );
    } catch (err) {
      console.error('Error updating due status:', err);
      setError('Failed to update due status. Please try again.');
    }
  };

  const handlePaymentStatusChange = async (
    paymentId: string,
    newStatus: 'pending' | 'approved' | 'rejected'
  ) => {
    try {
      // For approved/rejected, use the specific endpoints
      if (newStatus === 'approved') {
        await api.post(`/payments/${paymentId}/approve`, {});
      } else if (newStatus === 'rejected') {
        await api.post(`/payments/${paymentId}/reject`, {});
      } else {
        // For 'pending' or any other status, use the review endpoint
        await financialService.updateDuePayment(paymentId, {
          status: newStatus,
        });
      }

      // Update local state
      setPayments(
        payments.map((payment) =>
          payment._id === paymentId
            ? { ...payment, status: newStatus }
            : payment
        )
      );
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
    }
  };

  const handleDeleteDue = async (dueId: string) => {
    if (!window.confirm('Are you sure you want to delete this due?')) {
      return;
    }

    try {
      await financialService.deleteDue(dueId);
      // Update local state
      setDues(dues.filter((due) => due._id !== dueId));
    } catch (err) {
      console.error('Error deleting due:', err);
      setError('Failed to delete due. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await financialService.deleteDuePayment(paymentId);
      // Update local state
      setPayments(payments.filter((payment) => payment._id !== paymentId));
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Failed to delete payment. Please try again.');
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    try {
      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        return 'N/A';
      }
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(Number(amount));
    } catch (error) {
      console.error('Error formatting currency:', error);
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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

      {/* Tabs */}
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

      {/* Content based on active tab */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        ) : activeTab === 'dues' ? (
          // Dues Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Frequency
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
                {dues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-muted-foreground"
                    >
                      No dues found
                    </td>
                  </tr>
                ) : (
                  dues
                    .filter((due) => due && due._id)
                    .map((due) => (
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
                          {due.lateAmount && (
                            <div className="text-xs text-muted-foreground">
                              Late: {formatCurrency(due.lateAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(due.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                          {due.frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              due.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {due.status && typeof due.status === 'string'
                              ? due.status.charAt(0).toUpperCase() +
                                due.status.slice(1)
                              : 'Unknown'}
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
                            className={`mr-3 transition-colors ${
                              due.status === 'active'
                                ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300'
                                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                            }`}
                            onClick={() =>
                              handleDueStatusChange(
                                due._id,
                                due.status === 'active' ? 'inactive' : 'active'
                              )
                            }
                          >
                            {due.status === 'active' ? (
                              <i className="fas fa-ban"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                          </button>
                          <button
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            onClick={() => handleDeleteDue(due._id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Payments Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Method
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
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-muted-foreground"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments
                    .filter((payment) => payment && payment._id)
                    .map((payment) => (
                      <tr
                        key={payment._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {/* Handle all possible formats of due data */}
                          {(() => {
                            // If due is a string, show it directly
                            if (typeof payment.due === 'string') {
                              return payment.due;
                            }

                            // If due is an object with title
                            if (
                              payment.due &&
                              typeof payment.due === 'object' &&
                              payment.due.title
                            ) {
                              return payment.due.title;
                            }

                            // If dueId is populated from backend
                            if (
                              payment.dueId &&
                              typeof payment.dueId === 'object' &&
                              'title' in payment.dueId
                            ) {
                              return payment.dueId.title;
                            }

                            // If dueId is a string, show it directly
                            if (typeof payment.dueId === 'string') {
                              return payment.dueId;
                            }

                            // Fallback
                            return 'Unknown Due';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {(() => {
                            // If payment.user is available
                            if (payment.user) {
                              if (typeof payment.user === 'string') {
                                return payment.user;
                              }

                              if (typeof payment.user === 'object') {
                                const firstName = payment.user.firstName || '';
                                const lastName = payment.user.lastName || '';
                                return (
                                  `${firstName} ${lastName}`.trim() ||
                                  payment.user.email ||
                                  'Unknown User'
                                );
                              }
                            }

                            // If submittedBy is available
                            if (payment.submittedBy) {
                              if (typeof payment.submittedBy === 'object') {
                                const firstName =
                                  payment.submittedBy.firstName || '';
                                const lastName =
                                  payment.submittedBy.lastName || '';
                                return (
                                  `${firstName} ${lastName}`.trim() ||
                                  payment.submittedBy.email ||
                                  'Unknown User'
                                );
                              }
                              return payment.submittedBy;
                            }

                            // If pharmacyId and it has a name
                            if (
                              payment.pharmacyId &&
                              typeof payment.pharmacyId === 'object' &&
                              payment.pharmacyId.name
                            ) {
                              return payment.pharmacyId.name;
                            }

                            return 'Unknown User';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(payment.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {(() => {
                            // Check for valid date strings in multiple properties
                            if (payment.paymentDate) {
                              try {
                                return formatDate(payment.paymentDate);
                              } catch (e) {
                                console.error(
                                  'Invalid date format:',
                                  payment.paymentDate
                                );
                              }
                            }

                            if (payment.submittedAt) {
                              try {
                                return formatDate(payment.submittedAt);
                              } catch (e) {
                                console.error(
                                  'Invalid date format:',
                                  payment.submittedAt
                                );
                              }
                            }

                            if (payment.createdAt) {
                              try {
                                return formatDate(payment.createdAt);
                              } catch (e) {
                                console.error(
                                  'Invalid date format:',
                                  payment.createdAt
                                );
                              }
                            }

                            return 'Unknown date';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                          {(() => {
                            if (!payment.paymentMethod) {
                              return 'Unknown';
                            }

                            if (typeof payment.paymentMethod === 'string') {
                              return payment.paymentMethod.replace(/_/g, ' ');
                            }

                            // Handle cases where paymentMethod might be an object
                            if (
                              typeof payment.paymentMethod === 'object' &&
                              payment.paymentMethod !== null
                            ) {
                              if ('name' in payment.paymentMethod) {
                                return payment.paymentMethod.name;
                              }
                              if ('type' in payment.paymentMethod) {
                                return payment.paymentMethod.type;
                              }
                              return JSON.stringify(payment.paymentMethod);
                            }

                            return 'Unknown';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'approved' ||
                              payment.approvalStatus === 'approved'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : payment.status === 'pending' ||
                                  payment.approvalStatus === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : payment.status === 'rejected' ||
                                  payment.approvalStatus === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {(() => {
                              // Try to get the status from various properties
                              const status =
                                payment.status ||
                                payment.approvalStatus ||
                                (payment.status === false
                                  ? 'rejected'
                                  : null) ||
                                (payment.approvalStatus === false
                                  ? 'rejected'
                                  : null) ||
                                'unknown';

                              if (typeof status === 'string') {
                                return (
                                  status.charAt(0).toUpperCase() +
                                  status.slice(1)
                                );
                              } else if (typeof status === 'boolean') {
                                return status ? 'Approved' : 'Rejected';
                              }

                              return 'Unknown';
                            })()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {payment._id && (
                            <button
                              className="text-primary hover:text-primary/80 mr-3 transition-colors"
                              onClick={() =>
                                navigate(`/finances/payments/${payment._id}`)
                              }
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          )}
                          {(payment.status === 'pending' ||
                            payment.approvalStatus === 'pending') &&
                            payment._id && (
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
                          {payment._id && (
                            <button
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              onClick={() => handleDeletePayment(payment._id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuesManagement;
