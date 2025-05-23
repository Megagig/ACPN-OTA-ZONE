import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import { Due, DuePayment } from '../../types/financial.types';

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
        setDues(duesData);
      } else {
        const paymentsData = await financialService.getDuePayments();
        setPayments(paymentsData);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Failed to load ${activeTab} data. Please try again.`);
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
      await financialService.updateDuePayment(paymentId, { status: newStatus });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Dues Management
        </h1>
        <div className="flex space-x-2">
          {activeTab === 'dues' ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
              onClick={() => navigate('/finances/dues/new')}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Due
            </button>
          ) : (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
              onClick={() => navigate('/finances/payments/new')}
            >
              <i className="fas fa-plus mr-2"></i>
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
              activeTab === 'dues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dues')}
          >
            Dues
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : activeTab === 'dues' ? (
          // Dues Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No dues found
                    </td>
                  </tr>
                ) : (
                  dues.map((due) => (
                    <tr key={due._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {due.title}
                            </div>
                            {due.description && (
                              <div className="text-sm text-gray-500">
                                {due.description.length > 50
                                  ? `${due.description.substring(0, 50)}...`
                                  : due.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(due.amount)}
                        </div>
                        {due.lateAmount && (
                          <div className="text-xs text-gray-500">
                            Late: {formatCurrency(due.lateAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(due.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {due.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            due.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {due.status.charAt(0).toUpperCase() +
                            due.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => navigate(`/finances/dues/${due._id}`)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() =>
                            navigate(`/finances/dues/${due._id}/edit`)
                          }
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={`mr-3 ${
                            due.status === 'active'
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
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
                          className="text-red-600 hover:text-red-900"
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof payment.due === 'string'
                          ? payment.due
                          : payment.due.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {payment.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() =>
                            navigate(`/finances/payments/${payment._id}`)
                          }
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-900 mr-3"
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
                              className="text-red-600 hover:text-red-900 mr-3"
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
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeletePayment(payment._id)}
                          title="Delete"
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
        )}
      </div>
    </div>
  );
};

export default DuesManagement;
