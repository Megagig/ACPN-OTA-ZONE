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
      setDues((response.dues || []) as any[]);
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
      pending:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      partially_paid:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] ||
          'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300'
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Penalty Management
        </h1>
        <p className="text-muted-foreground">
          Add penalties to existing dues for late payments or violations
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card shadow-sm rounded-lg p-6 mb-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search Dues
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-card shadow-lg rounded-lg overflow-hidden border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Dues Available for Penalty Assignment ({filteredDues.length})
          </h2>
        </div>

        {filteredDues.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No dues found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Current Penalties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredDues.map((due) => (
                  <tr
                    key={due._id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {due.title}
                        </div>
                        {due.description && (
                          <div className="text-sm text-muted-foreground">
                            {due.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/70">
                          {typeof due.dueTypeId === 'object'
                            ? due.dueTypeId.name
                            : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {formatCurrency(due.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Paid: {formatCurrency(due.amountPaid)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(due.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(due.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(due.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {due.penalties.length} penalties
                      </div>
                      <div className="text-xs text-muted-foreground">
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
                        className="text-destructive hover:text-destructive/80 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  Add Penalty
                </h3>
                <button
                  onClick={closePenaltyModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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

              <div className="mb-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium text-foreground">
                  {selectedDue.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Current Total: {formatCurrency(selectedDue.totalAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Existing Penalties: {selectedDue.penalties.length}
                </p>
              </div>

              <form onSubmit={handlePenaltySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter penalty amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Explain why this penalty is being added..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closePenaltyModal}
                    className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-md hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-destructive text-destructive-foreground py-2 px-4 rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
