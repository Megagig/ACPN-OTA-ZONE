import React, { useState, useEffect, useMemo, useCallback } from 'react';
// CSVLink removed, will implement manual download
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiDownload, // Keep FiDownload for the button icon
} from 'react-icons/fi';
import { getAllPayments } from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';

const ITEMS_PER_PAGE = 10;

// Helper function to get Due Title
const getDueTitle = (payment: Payment): string => {
  const { dueId, dueInfo } = payment;

  if (dueInfo && dueInfo.title) {
    return dueInfo.title;
  }
  if (dueInfo && dueInfo.dueTypeId && dueInfo.dueTypeId.name) {
    return dueInfo.dueTypeId.name;
  }
  if (typeof dueId === 'object' && dueId !== null) {
    if ('title' in dueId && typeof dueId.title === 'string') {
      return dueId.title;
    }
    if (
      'dueTypeId' in dueId &&
      typeof dueId.dueTypeId === 'object' &&
      dueId.dueTypeId !== null &&
      'name' in dueId.dueTypeId &&
      typeof dueId.dueTypeId.name === 'string'
    ) {
      return dueId.dueTypeId.name;
    }
  }
  if (typeof dueId === 'string') {
    return dueId;
  }
  return 'N/A';
};

// Helper function for date formatting
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

const getStatusBadge = (status: Payment['approvalStatus'] | undefined) => {
  const lowerStatus = status?.toLowerCase() || 'pending';
  switch (lowerStatus) {
    case 'approved':
      return (
        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
          Rejected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
          Pending
        </span>
      );
  }
};

// Helper function to get Payment Type label
const getPaymentTypeLabel = (payment: Payment): string => {
  if ((payment as any).paymentType) {
    switch ((payment as any).paymentType) {
      case 'due': return 'Dues';
      case 'donation': return 'Donation';
      case 'event_fee': return 'Event Fee';
      case 'registration_fee': return 'Registration Fee';
      case 'conference_fee': return 'Conference Fee';
      case 'accommodation': return 'Accommodation';
      case 'seminar': return 'Seminar';
      case 'transportation': return 'Transportation';
      case 'building': return 'Building';
      case 'other': return 'Other';
      default: return (payment as any).paymentType;
    }
  }
  return 'N/A';
};

// Helper function to get Payment Title/Description
const getPaymentTitle = (payment: Payment): string => {
  if ((payment as any).paymentType === 'due') {
    return getDueTitle(payment);
  }
  if ((payment as any).paymentType === 'donation') {
    return (payment as any).meta?.purpose || (payment as any).meta?.description || 'Donation';
  }
  if ((payment as any).paymentType === 'event_fee') {
    const participant = (payment as any).meta?.participant;
    const eventId = (payment as any).meta?.eventId;
    return participant ? `${eventId || 'Event'} - ${participant}` : (eventId || 'Event Fee');
  }
  if ((payment as any).paymentType === 'transportation') {
    const participant = (payment as any).meta?.participant;
    return participant ? `Transportation - ${participant}` : 'Transportation';
  }
  return (payment as any).meta?.purpose || (payment as any).meta?.description || (payment as any).meta?.participant || 'N/A';
};

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPayments({});

      if (response && response.data && Array.isArray(response.data)) {
        setPayments(response.data);
        setTotalItems(response.pagination?.total || response.data.length);
      } else {
        console.warn('Unexpected response structure from getAllPayments:', response);
        setPayments([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
      setError(err.message || 'Failed to fetch payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    if (!debouncedSearchTerm) {
      return payments;
    }
    return payments.filter((payment) => {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      const dueTitle = getDueTitle(payment).toLowerCase();
      const pharmacyName =
        typeof payment.pharmacyId === 'object' && payment.pharmacyId?.name
          ? payment.pharmacyId.name.toLowerCase()
          : '';
      const status = (payment.approvalStatus || '').toLowerCase();
      const paymentMethod = (
        typeof payment.paymentMethod === 'string' ? payment.paymentMethod : ''
      ).toLowerCase();
      const transactionId = (payment.paymentReference || '').toLowerCase();

      return (
        dueTitle.includes(searchTermLower) ||
        pharmacyName.includes(searchTermLower) ||
        status.includes(searchTermLower) ||
        paymentMethod.includes(searchTermLower) ||
        transactionId.includes(searchTermLower) ||
        payment.amount.toString().includes(searchTermLower)
      );
    });
  }, [payments, debouncedSearchTerm]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // CSV export logic
  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Due Title', key: 'dueTitle' },
    { label: 'Amount', key: 'amount' },
    { label: 'Status', key: 'status' },
    { label: 'Transaction ID', key: 'transactionId' },
    { label: 'Receipt', key: 'receipt' },
  ];

  const handleExportCSV = () => {
    const dataToExport = filteredPayments.map((payment) => ({
      date: formatDate(
        payment.paymentDate || payment.submittedAt || payment.createdAt
      ),
      dueTitle: getDueTitle(payment),
      amount: payment.amount.toFixed(2),
      status: payment.approvalStatus,
      transactionId: payment.paymentReference || 'N/A',
      receipt: payment.receiptUrl || 'N/A',
    }));

    // Convert headers to a CSV string row
    const headerRow = csvHeaders.map((header) => header.label).join(',');
    // Convert data rows to CSV string rows
    const dataRows = dataToExport.map((row) =>
      csvHeaders
        .map((header) => {
          // Ensure values are properly stringified and commas are handled
          const value = String(row[header.key as keyof typeof row]);
          return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        })
        .join(',')
    );

    const csvString = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Check for download attribute support
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'payment_history.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg"
        role="alert"
      >
        <FiAlertCircle className="inline w-5 h-5 mr-2" />
        <span className="font-medium">Error:</span> {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Payment History
      </h1>

      <div className="mb-4 flex justify-between items-center">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search payments..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        {filteredPayments.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn btn-primary flex items-center"
          >
            <FiDownload className="mr-2" />
            Export to CSV
          </button>
        )}
      </div>

      {filteredPayments.length === 0 && !loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No payment records found.</p>
          {debouncedSearchTerm && (
            <p className="text-gray-400 text-sm">
              Try adjusting your search term.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Payment Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title/Purpose
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transaction ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(
                      payment.paymentDate ||
                        payment.submittedAt ||
                        payment.createdAt
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getPaymentTypeLabel(payment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {getPaymentTitle(payment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {payment.amount?.toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'NGN',
                    }) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(payment.approvalStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paymentReference || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-400">No Receipt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            <FiChevronLeft /> Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} (Total: {totalItems} items)
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
