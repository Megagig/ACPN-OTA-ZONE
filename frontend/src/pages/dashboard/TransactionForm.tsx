import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import financialService from '../../services/financial.service';
import {
  FinancialRecord,
  FinancialCategory,
  PaymentMethod,
} from '../../types/financial.types';

const TransactionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState<Partial<FinancialRecord>>({
    title: '',
    description: '',
    amount: 0,
    type: 'expense',
    category: 'administrative',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    status: 'pending',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (isEditMode) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await financialService.getFinancialRecordById(id);
      setFormData({
        ...data,
        date: new Date(data.date).toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setAttachments(fileArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // In a real implementation, we would upload files to a service like Cloudinary
      // and then get back URLs to store in the database
      // For now, we'll just simulate this

      // const uploadedFiles = await uploadFiles(attachments);
      // const attachmentUrls = uploadedFiles.map(file => file.url);

      const submitData = {
        ...formData,
        // attachments: attachmentUrls,
      };

      let response;
      if (isEditMode && id) {
        response = await financialService.updateFinancialRecord(id, submitData);
      } else {
        response = await financialService.createFinancialRecord(submitData);
      }

      // Redirect to transaction details page
      navigate(`/finances/transactions/${response._id}`);
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
        </h1>
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm shadow"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transaction title"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Amount (NGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type || 'expense'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category || 'administrative'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="dues">Dues</option>
                <option value="donation">Donation</option>
                <option value="event">Event</option>
                <option value="administrative">Administrative</option>
                <option value="utility">Utility</option>
                <option value="rent">Rent</option>
                <option value="salary">Salary</option>
                <option value="miscellaneous">Miscellaneous</option>
                <option value="refund">Refund</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                value={formData.paymentMethod || 'bank_transfer'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="online_payment">Online Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status || 'pending'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transaction details..."
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="attachments"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Attachments
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                multiple
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload receipts, invoices, or any other supporting documents.
                Maximum 5 files, 2MB each.
              </p>
              {attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files:
                  </p>
                  <ul className="mt-1 text-sm text-gray-500">
                    {attachments.map((file, index) => (
                      <li key={index} className="flex items-center">
                        <i className="fas fa-file mr-2"></i>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSaving ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {isEditMode ? 'Update Transaction' : 'Save Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
