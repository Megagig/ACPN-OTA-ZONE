import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import financialService from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';
import type { Pharmacy, PharmacyDue } from '../../types/pharmacy.types';

const PharmacyDues: React.FC = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [dues, setDues] = useState<PharmacyDue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDue, setSelectedDue] = useState<PharmacyDue | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: '',
    paymentReference: '',
    receipt: null as File | null,
  });
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);

  const fetchPharmacyAndDues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const pharmacyData = await pharmacyService.getPharmacyByUser();

      if (pharmacyData) {
        setPharmacy(pharmacyData);

        // Use the new API to get dues
        const response = await financialService.getRealDues({
          pharmacyId: pharmacyData._id,
          page: currentPage,
          limit: itemsPerPage,
          ...(filterStatus !== 'all' && { paymentStatus: filterStatus }),
        });

        setDues((response.dues as unknown as PharmacyDue[]) || []);
        setTotalPages(
          Math.ceil((response.pagination?.total || 0) / itemsPerPage)
        );
      } else {
        setError(
          'Pharmacy profile not found. Please register your pharmacy first.'
        );
        setDues([]);
      }
    } catch (err) {
      setError('Failed to load dues data');
      setDues([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filterStatus]);

  const fetchPaymentHistory = async (pharmacyId: string) => {
    try {
      const history = await financialService.getPharmacyPaymentHistory(
        pharmacyId
      );
      setPayments(history || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    }
  };

  useEffect(() => {
    fetchPharmacyAndDues();
  }, [fetchPharmacyAndDues]);

  useEffect(() => {
    if (pharmacy && showPaymentHistory) {
      fetchPaymentHistory(pharmacy._id);
    }
  }, [pharmacy, showPaymentHistory]);

  const handleDueSelection = (due: PharmacyDue) => {
    setSelectedDue(due);
    setPaymentData({
      amount: due.balance,
      paymentMethod: '',
      paymentReference: '',
      receipt: null,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedDue ||
      !pharmacy ||
      !paymentData.amount ||
      !paymentData.paymentMethod ||
      !paymentData.receipt
    ) {
      setError('Please fill all required payment fields and upload a receipt');
      return;
    }

    if (paymentData.amount > selectedDue.balance) {
      setError('Payment amount cannot exceed the outstanding balance');
      return;
    }

    try {
      setSubmittingPayment(true);

      const formData = new FormData();
      formData.append('dueId', selectedDue._id);
      formData.append('pharmacyId', pharmacy._id);
      formData.append('amount', paymentData.amount.toString());
      formData.append('paymentMethod', paymentData.paymentMethod);
      if (paymentData.paymentReference) {
        formData.append('paymentReference', paymentData.paymentReference);
      }
      formData.append('receipt', paymentData.receipt);

      await financialService.submitPayment(formData);

      // Refresh dues list
      fetchPharmacyAndDues();

      // Reset form and close modal
      setSelectedDue(null);
      setPaymentData({
        amount: 0,
        paymentMethod: '',
        paymentReference: '',
        receipt: null,
      });
      setShowPaymentModal(false);
      setError(null);

      // Show success message
      alert(
        'Payment submitted successfully! It will be reviewed by an administrator.'
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err && err.response
          ? (err.response as { data?: { message?: string } })?.data?.message ||
            'Failed to submit payment'
          : 'Failed to submit payment';
      setError(errorMessage);
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const downloadClearanceCertificate = async (dueId: string) => {
    try {
      const response = await financialService.generateClearanceCertificate(
        dueId
      );

      // Open certificate URL in a new window/tab
      if (response.certificateUrl) {
        window.open(response.certificateUrl, '_blank');
      } else {
        setError('Certificate not available. Please contact an administrator.');
      }
    } catch (err) {
      setError('Failed to download clearance certificate');
      console.error(err);
    }
  };

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-gray-600">Loading dues information...</p>
        </div>
      </div>
    );
  }

  if (error && !pharmacy) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <Link
            to="/my-pharmacy/create"
            className="text-red-700 hover:text-red-900 underline"
          >
            Register Pharmacy
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <button
            onClick={() => {
              setError(null);
              fetchPharmacyAndDues();
            }}
            className="text-red-700 hover:text-red-900 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/my-pharmacy"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Pharmacy Profile
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Dues & Payments</h1>
          {pharmacy && (
            <p className="text-gray-600">
              Pharmacy: <span className="font-medium">{pharmacy.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Dues Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Paid Amount</h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => due.paymentStatus === 'paid')
                    .reduce((sum, due) => sum + due.amountPaid, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">
                Outstanding Balance
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => due.paymentStatus !== 'paid')
                    .reduce((sum, due) => sum + due.balance, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Penalties</h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || []).reduce(
                    (sum, due) =>
                      sum +
                      due.penalties.reduce(
                        (penSum, penalty) => penSum + penalty.amount,
                        0
                      ),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <i className="fas fa-calendar text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">
                Due This Month
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => {
                      const dueDate = new Date(due.dueDate);
                      const now = new Date();
                      return (
                        dueDate.getMonth() === now.getMonth() &&
                        dueDate.getFullYear() === now.getFullYear() &&
                        due.paymentStatus !== 'paid'
                      );
                    })
                    .reduce((sum, due) => sum + due.balance, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i className="fas fa-history mr-2"></i>
            Payment History
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Submit Payment for {selectedDue.title}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDue(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Total Amount:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedDue.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Outstanding Balance:
                    </span>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(selectedDue.balance)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Amount Paid:
                    </span>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedDue.amountPaid)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <p className="text-gray-900">
                      {formatDate(selectedDue.dueDate)}
                    </p>
                  </div>
                </div>
                {selectedDue.penalties.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="font-medium text-gray-700">
                      Penalties:
                    </span>
                    <div className="mt-1 space-y-1">
                      {selectedDue.penalties.map((penalty, index) => (
                        <div key={index} className="text-sm text-red-600">
                          {penalty.reason}: {formatCurrency(penalty.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount *
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          amount: Number(e.target.value),
                        }))
                      }
                      max={selectedDue.balance}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum: {formatCurrency(selectedDue.balance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="mobile_payment">Mobile Payment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.paymentReference}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        paymentReference: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Transaction ID, cheque number, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Receipt *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        receipt: e.target.files?.[0] || null,
                      }))
                    }
                    required
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload receipt in PDF, JPG, JPEG, or PNG format (max 5MB)
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedDue(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      submittingPayment ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submittingPayment ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Submit Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      {showPaymentHistory && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Payment History
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 text-center">
              <i className="fas fa-history text-gray-400 text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No payment history
              </h3>
              <p className="text-gray-500">
                You haven't made any payments yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Use Due ID instead of title since Payment type doesn't have a title property */}
                        {payment.dueId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {/* Payment from financial.types doesn't have paymentMethod property */}
                        Unknown
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.status === 'approved' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : payment.status === 'rejected' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.receiptUrl && (
                          <a
                            href={`${process.env.REACT_APP_API_URL}${payment.receiptUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Receipt
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dues List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Dues History</h2>
        </div>

        {(dues || []).length === 0 ? (
          <div className="p-6 text-center">
            <i className="fas fa-file-invoice-dollar text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No dues found
            </h3>
            <p className="text-gray-500">
              You currently have no dues assigned to your pharmacy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(dues || []).map((due) => (
                  <tr
                    key={due._id}
                    className={
                      due.paymentStatus === 'paid' ? 'bg-green-50' : ''
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">
                          {due.title}
                        </span>
                        {due.dueTypeId?.isRecurring && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {due.description || due.dueTypeId?.description || '-'}
                      </div>
                      {due.penalties.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          Penalties:{' '}
                          {formatCurrency(
                            due.penalties.reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          Total: {formatCurrency(due.totalAmount)}
                        </div>
                        <div className="text-green-600">
                          Paid: {formatCurrency(due.amountPaid)}
                        </div>
                        <div className="text-red-600">
                          Balance: {formatCurrency(due.balance)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Due: {formatDate(due.dueDate)}</div>
                      {due.assignedAt && (
                        <div className="text-xs text-gray-400">
                          Assigned: {formatDate(due.assignedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(due.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {due.paymentStatus === 'paid'
                        ? formatDate(due.updatedAt)
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {due.paymentStatus !== 'paid' && due.balance > 0 && (
                        <button
                          onClick={() => handleDueSelection(due)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Pay Now
                        </button>
                      )}
                      {due.paymentStatus === 'paid' && (
                        <button
                          onClick={() => downloadClearanceCertificate(due._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Certificate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      (dues || []).length + (currentPage - 1) * itemsPerPage
                    )}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">
                    {(dues || []).length + (currentPage - 1) * itemsPerPage}
                  </span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyDues;
