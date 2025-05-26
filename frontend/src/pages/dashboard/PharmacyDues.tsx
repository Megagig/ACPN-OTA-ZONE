import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy, PharmacyDue } from '../../types/pharmacy.types';

const PharmacyDues: React.FC = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [dues, setDues] = useState<PharmacyDue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDueId, setSelectedDueId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  useEffect(() => {
    fetchPharmacyAndDues();
  }, [currentPage]);

  const fetchPharmacyAndDues = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const pharmacyData = await pharmacyService.getPharmacyByUser();

      if (pharmacyData) {
        setPharmacy(pharmacyData);

        const duesData = await pharmacyService.getPharmacyDues(
          pharmacyData._id,
          currentPage,
          itemsPerPage
        );

        setDues(duesData.dues || []); // Ensure it's always an array
        setTotalPages(Math.ceil((duesData.total || 0) / itemsPerPage));
      } else {
        setError(
          'Pharmacy profile not found. Please register your pharmacy first.'
        );
        setDues([]); // Reset dues to empty array
      }
    } catch (err) {
      setError('Failed to load dues data');
      setDues([]); // Reset dues to empty array on error
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDueSelection = (dueId: string, amount: number) => {
    setSelectedDueId(dueId);
    setPaymentAmount(amount);
    setPaymentMethod('');
    setPaymentReference('');
  };

  const handlePayment = async () => {
    if (!selectedDueId || !pharmacy || !paymentAmount || !paymentMethod) {
      setError('Please fill all required payment fields');
      return;
    }

    try {
      setProcessingPayment(true);

      await pharmacyService.payDue(pharmacy._id, selectedDueId, {
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference,
        paymentDate: new Date().toISOString(),
      });

      // Refresh dues list
      fetchPharmacyAndDues();

      // Reset payment form
      setSelectedDueId(null);
      setPaymentAmount(0);
      setPaymentMethod('');
      setPaymentReference('');
    } catch (err) {
      setError('Failed to process payment');
      console.error(err);
    } finally {
      setProcessingPayment(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Paid Dues</h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => due.isPaid)
                    .reduce((sum, due) => sum + due.amount, 0)
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
                Outstanding Dues
              </h2>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => !due.isPaid)
                    .reduce((sum, due) => sum + due.amount, 0)
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
                        !due.isPaid
                      );
                    })
                    .reduce((sum, due) => sum + due.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {selectedDueId && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Make Payment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="paymentAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Amount*
              </label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Method*
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Payment Method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="online_payment">Online Payment</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="paymentReference"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Reference
              </label>
              <input
                type="text"
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter reference number if available"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDueId(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={processingPayment || !paymentAmount || !paymentMethod}
              className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                processingPayment || !paymentAmount || !paymentMethod
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {processingPayment ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-money-bill-wave mr-2"></i>
                  Make Payment
                </>
              )}
            </button>
          </div>
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
                  <tr key={due._id} className={due.isPaid ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 capitalize">
                        {due.dueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-500">
                        {due.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(due.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(due.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {due.isPaid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {due.paidDate ? formatDate(due.paidDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!due.isPaid && (
                        <button
                          onClick={() =>
                            handleDueSelection(due._id, due.amount)
                          }
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Pay Now
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
