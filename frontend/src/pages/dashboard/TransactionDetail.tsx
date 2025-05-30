import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { FinancialRecord } from '../../types/financial.types';

const TransactionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<FinancialRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    try {
      const data = await financialService.getFinancialRecordById(id!);
      setTransaction(data);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm('Are you sure you want to delete this transaction?')
    ) {
      return;
    }

    try {
      await financialService.deleteFinancialRecord(id);
      // Navigate back to transactions list
      navigate('/finances/transactions');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction');
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
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error || 'Transaction not found'}
        </div>
        <button
          className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
          onClick={() => navigate('/finances/transactions')}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Transaction Details
        </h1>
        <div className="flex space-x-2">
          <button
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate('/finances/transactions')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate(`/finances/transactions/${id}/edit`)}
          >
            <i className="fas fa-edit mr-2"></i>
            Edit
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={handleDelete}
          >
            <i className="fas fa-trash mr-2"></i>
            Delete
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
        {/* Header with transaction type and status */}
        <div className="bg-muted p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                  transaction.type === 'income'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                } mr-3`}
              >
                {transaction.type === 'income' ? (
                  <i className="fas fa-arrow-down"></i>
                ) : (
                  <i className="fas fa-arrow-up"></i>
                )}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {transaction.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  ID: {transaction._id}
                </p>
              </div>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  transaction.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : transaction.status === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}
              >
                {transaction.status.charAt(0).toUpperCase() +
                  transaction.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction amount */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-1">
              {transaction.type === 'income'
                ? 'Income Amount'
                : 'Expense Amount'}
            </p>
            <p
              className={`text-3xl font-bold ${
                transaction.type === 'income'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>

        {/* Transaction details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Details
              </h3>
              <table className="min-w-full">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 text-sm text-muted-foreground font-medium w-1/3">
                      Type
                    </td>
                    <td className="py-2 text-sm text-foreground">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-muted-foreground font-medium">
                      Category
                    </td>
                    <td className="py-2 text-sm text-foreground capitalize">
                      {transaction.category}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-muted-foreground font-medium">
                      Date
                    </td>
                    <td className="py-2 text-sm text-foreground">
                      {formatDate(transaction.date)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-muted-foreground font-medium">
                      Payment Method
                    </td>
                    <td className="py-2 text-sm text-foreground capitalize">
                      {transaction.paymentMethod.replace(/_/g, ' ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-muted-foreground font-medium">
                      Created By
                    </td>
                    <td className="py-2 text-sm text-foreground">
                      {transaction.createdBy || 'System'}
                    </td>
                  </tr>
                  {transaction.createdAt && (
                    <tr>
                      <td className="py-2 text-sm text-muted-foreground font-medium">
                        Created On
                      </td>
                      <td className="py-2 text-sm text-foreground">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  )}
                  {transaction.pharmacy && (
                    <tr>
                      <td className="py-2 text-sm text-muted-foreground font-medium">
                        Pharmacy
                      </td>
                      <td className="py-2 text-sm text-foreground">
                        <a
                          href={`/pharmacies/${transaction.pharmacy}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded"
                        >
                          View Pharmacy
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Description
              </h3>
              <div className="bg-muted p-4 rounded-md mb-6 border border-border">
                <p className="text-sm text-foreground whitespace-pre-line">
                  {transaction.description || 'No description provided.'}
                </p>
              </div>

              {/* Attachments */}
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Attachments
              </h3>
              {!transaction.attachments ||
              transaction.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments</p>
              ) : (
                <ul className="space-y-2">
                  {transaction.attachments.map((attachment, index) => (
                    <li key={index} className="text-sm">
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded"
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        Attachment {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
