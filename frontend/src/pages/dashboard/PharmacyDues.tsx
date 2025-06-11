import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import financialService from '../../services/financial.service';
import submitPaymentWithAxios from '../../services/submitPaymentWithAxios'; // Import the new function
import type { Payment } from '../../types/financial.types';
import type { Pharmacy, PharmacyDue } from '../../types/pharmacy.types';
import CertificateView from '../../components/certificate/CertificateView';
import { useTheme } from '../../context/ThemeContext';

// Enhanced payment interface that extends Payment with a dueInfo property
interface EnhancedPayment extends Omit<Payment, 'dueInfo'> {
  dueInfo?: PharmacyDue;
}

const PharmacyDues: React.FC = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [dues, setDues] = useState<PharmacyDue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDue, setSelectedDue] = useState<PharmacyDue | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0.01, // Initialize with a valid minimum amount
    paymentMethod: '',
    paymentReference: '',
    receipt: null as File | null,
  });
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [payments, setPayments] = useState<EnhancedPayment[]>([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] =
    useState<boolean>(false);
  const [selectedCertificateDueId, setSelectedCertificateDueId] = useState<
    string | null
  >(null);
  const { theme } = useTheme();

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
      const response = await financialService.getPharmacyPaymentHistory(
        pharmacyId
      );

      // Check if we have both payments and dues in the response
      const payments = response.data || [];
      const duesFromPaymentHistory = response.dues || [];

      // Set both dues and payments
      if (duesFromPaymentHistory.length > 0) {
        // Update the dues state with the data from payment history
        // This ensures we have the most current dues information with payment status
        setDues(duesFromPaymentHistory);
      }

      // Enhance payments with due information if needed
      const enhancedPayments = await Promise.all(
        payments.map(async (payment) => {
          try {
            // For each payment, get the associated due to show detailed info
            if (payment.dueId && typeof payment.dueId === 'string') {
              // Try to find the due in our duesFromPaymentHistory array first
              const existingDue = duesFromPaymentHistory.find(
                (due) => due._id === payment.dueId
              );

              if (existingDue) {
                return {
                  ...payment,
                  dueInfo: existingDue,
                } as EnhancedPayment;
              }

              // If not found, fetch it directly
              const dueInfo = await financialService.getRealDueById(
                payment.dueId
              );

              // Convert Due to PharmacyDue - first cast to unknown, then to PharmacyDue
              // We need to handle the type differences safely
              const convertedDueInfo = dueInfo
                ? ({
                    ...dueInfo,
                    pharmacyId: payment.pharmacyId, // Use payment's pharmacyId
                    paymentStatus: 'pending' as const, // Default status
                    amountPaid: 0,
                    balance: dueInfo.amount,
                    penalties: [],
                    totalAmount: dueInfo.amount,
                    assignmentType: 'individual' as const,
                    assignedBy: '',
                    assignedAt: dueInfo.createdAt || new Date().toISOString(),
                    year: new Date(dueInfo.dueDate).getFullYear(),
                    isRecurring: dueInfo.frequency !== 'one-time',
                  } as unknown as PharmacyDue)
                : undefined;

              return {
                ...payment,
                dueInfo: convertedDueInfo,
              } as EnhancedPayment;
            }
            return payment as EnhancedPayment;
          } catch (err) {
            console.error(
              `Error fetching due info for payment ${payment._id}:`,
              err
            );
            return payment as EnhancedPayment;
          }
        })
      );

      setPayments(enhancedPayments);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    }
  };

  useEffect(() => {
    fetchPharmacyAndDues();
  }, [fetchPharmacyAndDues]);

  // Separate useEffect to handle payment history loading
  useEffect(() => {
    if (pharmacy && showPaymentHistory) {
      fetchPaymentHistory(pharmacy._id);
    }
  }, [pharmacy, showPaymentHistory]);

  const handleDueSelection = (due: PharmacyDue) => {
    // Don't allow selection of dues with zero balance
    if (due.balance <= 0) {
      setError('This due has already been fully paid');
      return;
    }

    setSelectedDue(due);
    setPaymentData({
      // Ensure the amount is at least 0.01 to avoid validation errors
      amount: due.balance > 0 ? due.balance : 0.01,
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
      !paymentData.amount || // Always require an amount
      !paymentData.paymentMethod ||
      !paymentData.receipt
    ) {
      setError('Please fill all required payment fields and upload a receipt');
      return;
    }

    // Validate payment amount
    if (paymentData.amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (paymentData.amount > selectedDue.balance) {
      setError('Payment amount cannot exceed the outstanding balance');
      return;
    }

    // Don't allow submission if balance is 0
    if (selectedDue.balance === 0) {
      setError('This due has already been fully paid');
      return;
    }

    try {
      setSubmittingPayment(true);

      // Verify we have the receipt file
      if (!paymentData.receipt) {
        setError('Receipt file is required');
        setSubmittingPayment(false);
        return;
      }

      console.log('Preparing payment submission with data:', {
        dueId: selectedDue._id,
        pharmacyId: pharmacy._id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        hasReceipt: !!paymentData.receipt,
        receiptName: paymentData.receipt?.name,
        receiptType: paymentData.receipt?.type,
        receiptSize: paymentData.receipt?.size,
      });

      // Create a fresh FormData for better reliability
      const formData = new FormData();

      // Add all text fields first
      formData.append('dueId', selectedDue._id);
      formData.append('pharmacyId', pharmacy._id);
      formData.append('amount', paymentData.amount.toString());
      formData.append('paymentMethod', paymentData.paymentMethod);
      if (paymentData.paymentReference) {
        formData.append('paymentReference', paymentData.paymentReference);
      }

      // Ensure receipt is properly added to FormData
      if (paymentData.receipt instanceof File) {
        // Check if file size is reasonable before uploading
        if (paymentData.receipt.size > 8 * 1024 * 1024) {
          // 8MB limit on client side
          throw new Error(
            'Receipt file is too large. Please use a file smaller than 8MB.'
          );
        }
        try {
          // Add the file with explicit filename and content type for better MIME handling
          const cleanFileName = paymentData.receipt.name
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove problematic characters
            .toLowerCase(); // Standardize case

          // Make sure we're appending with the original filename
          formData.append(
            'receipt',
            paymentData.receipt,
            cleanFileName // Use sanitized filename
          );

          console.log(
            'Added receipt file to form data:',
            cleanFileName,
            'Type:',
            paymentData.receipt.type,
            'Size:',
            paymentData.receipt.size,
            'Is File object:',
            paymentData.receipt instanceof File
          );
        } catch (fileError) {
          console.error('Error adding file to FormData:', fileError);
          throw new Error(
            'Error processing file. Please try a different file.'
          );
        }
      } else {
        throw new Error('Receipt is not a valid File object');
      }

      console.log('Submitting payment...');
      // Use the new Axios-based implementation instead of the original function
      const response = await submitPaymentWithAxios(formData);
      console.log('Payment submission successful:', response);

      // Refresh dues list
      fetchPharmacyAndDues();

      // Reset form and close modal
      setSelectedDue(null);
      setPaymentData({
        amount: 0.01, // Reset to valid minimum amount
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
      console.error('Payment submission error:', err);

      // Extract the most helpful error message
      let errorMessage = 'Failed to submit payment';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Check for specific network errors
        if (
          errorMessage.includes('Network Error') ||
          errorMessage.includes('timeout')
        ) {
          errorMessage =
            'Network timeout occurred. Your file may be too large or your connection is slow. Please try again with a smaller file or better connection.';
        } else if (
          errorMessage.includes('Unexpected end of form') ||
          errorMessage.includes('interrupted') ||
          errorMessage.includes('incomplete')
        ) {
          errorMessage =
            'Your file upload was interrupted. Please try again with a smaller file or check your internet connection.';
        } else if (
          errorMessage.includes('entity too large') ||
          errorMessage.includes('too large')
        ) {
          errorMessage =
            'The file is too large. Please reduce the size and try again (maximum 8MB).';
        } else if (errorMessage.includes('timeout')) {
          errorMessage =
            'The upload timed out. Please try with a smaller file or on a faster connection.';
        }
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        if (errorObj.response?.data?.error) {
          errorMessage = errorObj.response.data.error;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }

      if (err instanceof Error) {
        errorMessage = err.message;

        // Check for Axios error with response data
        if ('response' in err && err.response) {
          const axiosErr = err as {
            response: {
              data?:
                | {
                    error?: string;
                    message?: string;
                  }
                | string;
              status?: number;
            };
          };
          if (axiosErr.response.data) {
            if (typeof axiosErr.response.data === 'object') {
              if (axiosErr.response.data.error) {
                errorMessage = axiosErr.response.data.error;
              } else if (axiosErr.response.data.message) {
                errorMessage = axiosErr.response.data.message;
              }
            } else if (typeof axiosErr.response.data === 'string') {
              errorMessage = axiosErr.response.data;
            }
          }

          // Add status code for more context
          if (axiosErr.response.status) {
            errorMessage = `${errorMessage} (Status ${axiosErr.response.status})`;
          }
        }
      }

      setError(errorMessage);
      console.error('Payment submission failed:', errorMessage);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const downloadClearanceCertificate = (dueId: string) => {
    setSelectedCertificateDueId(dueId);
    setShowCertificateModal(true);
  };

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
            Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            Overdue
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-muted text-muted-foreground">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      // Format the date as DD/MM/YYYY
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
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
          <div className="spinner-border text-primary" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-muted-foreground">
            Loading dues information...
          </p>
        </div>
      </div>
    );
  }

  if (error && !pharmacy) {
    return (
      <div
        className="bg-destructive/15 border-l-4 border-destructive/20 text-destructive p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <Link
            to="/my-pharmacy/create"
            className="text-destructive hover:text-destructive/80 underline"
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
        className="bg-destructive/15 border-l-4 border-destructive/20 text-destructive p-4"
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
            className="text-destructive hover:text-destructive/80 underline"
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
            className="text-primary hover:text-primary/80 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Pharmacy Profile
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Dues & Payments
          </h1>
          {pharmacy && (
            <p className="text-muted-foreground">
              Pharmacy: <span className="font-medium">{pharmacy.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Dues Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Paid Amount
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => due.paymentStatus === 'paid')
                    .reduce((sum, due) => sum + due.amountPaid, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-exclamation-circle text-red-600 dark:text-red-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Outstanding Balance
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(
                  (dues || [])
                    .filter((due) => due.paymentStatus !== 'paid')
                    .reduce((sum, due) => sum + due.balance, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Penalties
              </h2>
              <p className="text-2xl font-semibold text-foreground">
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

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-calendar text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Due This Month
              </h2>
              <p className="text-2xl font-semibold text-foreground">
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
            className="rounded-md border border-border shadow-sm px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <i className="fas fa-history mr-2"></i>
            Payment History
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-11/12 md:w-1/2 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  Submit Payment for {selectedDue.title}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDue(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Total Amount:
                    </span>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(selectedDue.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Outstanding Balance:
                    </span>
                    <p className="text-lg font-semibold text-destructive">
                      {formatCurrency(selectedDue.balance)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Amount Paid:
                    </span>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedDue.amountPaid)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Due Date:
                    </span>
                    <p className="text-foreground">
                      {formatDate(selectedDue.dueDate)}
                    </p>
                  </div>
                </div>
                {selectedDue.penalties.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="font-medium text-muted-foreground">
                      Penalties:
                    </span>
                    <div className="mt-1 space-y-1">
                      {selectedDue.penalties.map((penalty, index) => (
                        <div key={index} className="text-sm text-destructive">
                          {penalty.reason}: {formatCurrency(penalty.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handlePaymentSubmit}
                className="space-y-4"
                encType="multipart/form-data"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Payment Amount *
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => {
                        // Ensure value is at least 0.01 and at most the due balance
                        const value = Number(e.target.value);
                        const validValue = Math.min(
                          Math.max(value, 0.01),
                          selectedDue.balance
                        );

                        setPaymentData((prev) => ({
                          ...prev,
                          amount: validValue,
                        }));
                      }}
                      max={selectedDue.balance}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full rounded-md border border-border shadow-sm px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                    />
                    <div className="mt-1 flex flex-col">
                      <p className="text-xs text-muted-foreground">
                        Minimum: ₦0.01 | Maximum:{' '}
                        {formatCurrency(selectedDue.balance)}
                      </p>
                      {paymentData.amount <= 0 && (
                        <p className="text-xs text-destructive">
                          Payment amount must be greater than zero
                        </p>
                      )}
                      {paymentData.amount > selectedDue.balance && (
                        <p className="text-xs text-destructive">
                          Payment cannot exceed the outstanding balance
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
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
                      className="w-full rounded-md border border-border shadow-sm px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                  <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full rounded-md border border-border shadow-sm px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Transaction ID, cheque number, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Payment Receipt *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          // Reset any previous errors
                          setError(null);

                          // Check file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            setError(
                              'File size must be less than 5MB. Please select a smaller file.'
                            );
                            e.target.value = ''; // Clear the file input
                            return;
                          }

                          // Check file type
                          const validTypes = [
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'application/pdf',
                          ];

                          // More reliable type checking using both MIME type and extension
                          const fileExtension = file.name
                            .substring(file.name.lastIndexOf('.'))
                            .toLowerCase();

                          const validExtensions = [
                            '.pdf',
                            '.jpg',
                            '.jpeg',
                            '.png',
                          ];

                          if (
                            !validTypes.includes(file.type) ||
                            !validExtensions.includes(fileExtension)
                          ) {
                            setError(
                              'File must be PDF, JPG, JPEG, or PNG format'
                            );
                            e.target.value = ''; // Clear the file input
                            return;
                          }

                          try {
                            console.log(
                              'Processing file:',
                              file.name,
                              'type:',
                              file.type,
                              'size:',
                              file.size
                            );

                            // Create a more reliable filename
                            const timestamp = new Date().getTime();
                            const simpleName = `receipt_${timestamp}${fileExtension}`;

                            // Read the file as an ArrayBuffer
                            const arrayBuffer = await file.arrayBuffer();
                            console.log(
                              'File read as ArrayBuffer successfully, size:',
                              arrayBuffer.byteLength
                            );

                            // Create a new, clean file object with a controlled size
                            const maxSize = 4 * 1024 * 1024; // 4MB max to be safe
                            if (arrayBuffer.byteLength > maxSize) {
                              setError(
                                'File content is too large after processing. Please use a smaller or simpler file.'
                              );
                              e.target.value = ''; // Clear the file input
                              return;
                            }

                            // Create a new, clean file object
                            const cleanFile = new File(
                              [arrayBuffer],
                              simpleName,
                              {
                                type: file.type,
                                lastModified: timestamp,
                              }
                            );

                            console.log('Clean file created successfully:', {
                              name: cleanFile.name,
                              type: cleanFile.type,
                              size: cleanFile.size,
                            });

                            setPaymentData((prev) => ({
                              ...prev,
                              receipt: cleanFile,
                            }));
                          } catch (error) {
                            console.error('Error processing file:', error);
                            setError(
                              'Error processing file. Please try a different file or format.'
                            );
                            e.target.value = ''; // Clear the file input
                          }
                        } else {
                          setPaymentData((prev) => ({
                            ...prev,
                            receipt: null,
                          }));
                        }
                      }}
                      required
                      className="w-full rounded-md border border-border shadow-sm px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {paymentData.receipt && (
                      <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                        <i className="fas fa-check-circle mr-1"></i>
                        File selected: {paymentData.receipt.name} (
                        {Math.round(paymentData.receipt.size / 1024)}KB)
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
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
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className={`px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
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
        <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 bg-muted border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Payment History
            </h2>
          </div>

          {/* Combine dues with no payment and actual payments */}
          {payments.length === 0 &&
          dues.filter((d) => d.paymentStatus !== 'paid').length === 0 ? (
            <div className="p-6 text-center">
              <i className="fas fa-history text-muted-foreground text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No payment history
              </h3>
              <p className="text-muted-foreground">
                You haven't made any payments yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Due Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {/* Show all dues as pending if no payment exists for them */}
                  {(dues || [])
                    .filter((due) => {
                      // Only show dues that are not fully paid and have no payment record in payments
                      const hasPayment = payments.some((p) =>
                        typeof p.dueId === 'string'
                          ? p.dueId === due._id
                          : (p.dueId as { _id: string })?._id === due._id
                      );
                      return !hasPayment && due.paymentStatus !== 'paid';
                    })
                    .map((due) => (
                      <tr
                        key={due._id + '-pending'}
                        className="hover:bg-muted/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(due.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {due.title ||
                            (due.dueTypeId &&
                              typeof due.dueTypeId === 'object' &&
                              (due.dueTypeId as { name?: string })?.name) ||
                            'Unknown Due'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {formatCurrency(due.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(due.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDueSelection(due)}
                            className="text-primary hover:text-primary/80 mr-3"
                          >
                            Make Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  {/* Show actual payment records */}
                  {payments.map((payment) => {
                    // Extract due info from either enhanced payment or direct dueId
                    const dueInfo =
                      payment.dueInfo ||
                      (typeof payment.dueId === 'object'
                        ? (payment.dueId as PharmacyDue)
                        : null);
                    return (
                      <tr key={payment._id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {payment.paymentDate
                            ? formatDate(payment.paymentDate)
                            : formatDate(payment.createdAt) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {dueInfo?.title ||
                            (dueInfo?.dueTypeId &&
                              typeof dueInfo.dueTypeId === 'object' &&
                              (dueInfo.dueTypeId as { name?: string })?.name) ||
                            'Unknown Due'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                          {payment.paymentMethod ||
                            payment.paymentReference ||
                            'Bank Transfer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payment.status === 'approved' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Approved
                            </span>
                          ) : payment.status === 'rejected' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.receiptUrl && (
                            <a
                              href={
                                payment.receiptUrl.startsWith('http')
                                  ? payment.receiptUrl
                                  : `${process.env.REACT_APP_API_URL || ''}${
                                      payment.receiptUrl
                                    }`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 mr-3"
                            >
                              View Receipt
                            </a>
                          )}
                          {payment.status === 'approved' && dueInfo && (
                            <button
                              onClick={() =>
                                downloadClearanceCertificate(
                                  typeof payment.dueId === 'string'
                                    ? payment.dueId
                                    : (payment.dueId as { _id: string })?._id
                                )
                              }
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            >
                              Certificate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dues List */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="p-6 bg-muted border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Dues History
          </h2>
        </div>

        {(dues || []).length === 0 ? (
          <div className="p-6 text-center">
            <i className="fas fa-file-invoice-dollar text-muted-foreground text-5xl mb-4"></i>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No dues found
            </h3>
            <p className="text-muted-foreground">
              You currently have no dues assigned to your pharmacy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {(dues || []).map((due) => (
                  <tr
                    key={due._id}
                    className={
                      due.paymentStatus === 'paid'
                        ? 'bg-green-50 dark:bg-green-950/30'
                        : ''
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-medium text-foreground capitalize">
                          {due.title}
                        </span>
                        {due.dueTypeId?.isRecurring && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {due.description || due.dueTypeId?.description || '-'}
                      </div>
                      {due.penalties.length > 0 && (
                        <div className="text-xs text-destructive mt-1">
                          Penalties:{' '}
                          {formatCurrency(
                            due.penalties.reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                          Total: {formatCurrency(due.totalAmount)}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          Paid: {formatCurrency(due.amountPaid)}
                        </div>
                        <div className="text-destructive">
                          Balance: {formatCurrency(due.balance)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div>Due: {formatDate(due.dueDate)}</div>
                      {due.assignedAt && (
                        <div className="text-xs text-muted-foreground/70">
                          Assigned: {formatDate(due.assignedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(due.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {due.paymentStatus === 'paid'
                        ? formatDate(due.updatedAt)
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {due.paymentStatus !== 'paid' && due.balance > 0 && (
                        <button
                          onClick={() => handleDueSelection(due)}
                          className="text-primary hover:text-primary/80"
                        >
                          Pay Now
                        </button>
                      )}
                      {due.paymentStatus === 'paid' && (
                        <button
                          onClick={() => downloadClearanceCertificate(due._id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
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
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
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
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium ${
                      currentPage === 1
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-primary/10 border-primary text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-muted'
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

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificateDueId && (
        <CertificateView
          dueId={selectedCertificateDueId}
          isVisible={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedCertificateDueId(null);
          }}
        />
      )}
    </div>
  );
};

export default PharmacyDues;
