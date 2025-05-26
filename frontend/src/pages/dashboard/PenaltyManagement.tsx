import React, { useState, useEffect } from 'react';
import type { PharmacyDue } from '../../types/pharmacy.types';
import financialService from '../../services/financial.service';

interface PenaltyForm {
  dueId: string;
  amount: number;
  reason: string;
}

const PenaltyManagement: React.FC = () => {
  const [dues, setDues] = useState<PharmacyDue[]>([]);
  const [filteredDues, setFilteredDues] = useState<PharmacyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDue, setSelectedDue] = useState<PharmacyDue | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState<PenaltyForm>({
    dueId: '',
    amount: 0,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDues();
  }, []);

  useEffect(() => {
    filterDues();
  }, [dues, searchTerm, filterStatus]);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const response = await financialService.getRealDues();
      setDues(response.data || []);
    } catch (err) {
      console.error('Failed to fetch dues:', err);
      setError('Failed to load dues');
    } finally {
      setLoading(false);
    }
  };

  const filterDues = () => {
    let filtered = dues;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (due) =>
          due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          due.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((due) => due.paymentStatus === filterStatus);
    }

    setFilteredDues(filtered);
  };

  const openPenaltyModal = (due: PharmacyDue) => {
    setSelectedDue(due);
    setPenaltyForm({
      dueId: due._id,
      amount: 0,
      reason: '',
    });
    setShowPenaltyModal(true);
    setError('');
    setSuccess('');
  };

  const closePenaltyModal = () => {
    setShowPenaltyModal(false);
    setSelectedDue(null);
    setPenaltyForm({ dueId: '', amount: 0, reason: '' });
  };

  const handlePenaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.amount || !penaltyForm.reason) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await financialService.addPenaltyToDue(penaltyForm.dueId, {
        amount: penaltyForm.amount,
        reason: penaltyForm.reason,
      });

      setSuccess('Penalty added successfully!');
      closePenaltyModal();
      await fetchDues(); // Refresh the dues list
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add penalty';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partially_paid: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] ||
          'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Penalty Management
        </h1>
        <p className="text-gray-600">
          Add penalties to existing dues for late payments or violations
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Dues
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchDues}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dues Available for Penalty Assignment ({filteredDues.length})
          </h2>
        </div>

        {filteredDues.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No dues found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Penalties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDues.map((due) => (
                  <tr key={due._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {due.title}
                        </div>
                        {due.description && (
                          <div className="text-sm text-gray-500">
                            {due.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {typeof due.dueTypeId === 'object'
                            ? due.dueTypeId.name
                            : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(due.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paid: {formatCurrency(due.amountPaid)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Balance: {formatCurrency(due.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(due.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(due.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {due.penalties.length} penalties
                      </div>
                      <div className="text-xs text-gray-500">
                        Total:{' '}
                        {formatCurrency(
                          due.penalties.reduce(
                            (sum, penalty) => sum + penalty.amount,
                            0
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openPenaltyModal(due)}
                        className="text-red-600 hover:text-red-900 transition duration-200"
                      >
                        Add Penalty
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Penalty Modal */}
      {showPenaltyModal && selectedDue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Penalty
                </h3>
                <button
                  onClick={closePenaltyModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {selectedDue.title}
                </p>
                <p className="text-xs text-gray-500">
                  Current Total: {formatCurrency(selectedDue.totalAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  Existing Penalties: {selectedDue.penalties.length}
                </p>
              </div>

              <form onSubmit={handlePenaltySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penalty Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={penaltyForm.amount || ''}
                    onChange={(e) =>
                      setPenaltyForm((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter penalty amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Penalty *
                  </label>
                  <textarea
                    value={penaltyForm.reason}
                    onChange={(e) =>
                      setPenaltyForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this penalty is being added..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closePenaltyModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {submitting ? 'Adding...' : 'Add Penalty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenaltyManagement;
