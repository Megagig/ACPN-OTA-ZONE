import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import financialService from '../../services/financial.service';
import type { Due } from '../../types/financial.types';

interface OutstandingDue extends Due {
  pharmacyName?: string;
  daysPastDue: number;
  penaltyAmount: number;
  totalOwed: number;
}

const OutstandingDues: React.FC = () => {
  const [outstandingDues, setOutstandingDues] = useState<OutstandingDue[]>([]);
  const [filteredDues, setFilteredDues] = useState<OutstandingDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'penalty'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filterAndSortDues = useCallback(() => {
    let filtered = [...outstandingDues];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (due) =>
          due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          due.pharmacyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((due) => {
        switch (filterStatus) {
          case 'critical':
            return due.daysPastDue > 60;
          case 'warning':
            return due.daysPastDue > 30 && due.daysPastDue <= 60;
          case 'recent':
            return due.daysPastDue <= 30;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalOwed - a.totalOwed;
        case 'date':
          return b.daysPastDue - a.daysPastDue;
        case 'penalty':
          return b.penaltyAmount - a.penaltyAmount;
        default:
          return 0;
      }
    });

    setFilteredDues(filtered);
    setCurrentPage(1);
  }, [outstandingDues, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    fetchOutstandingDues();
  }, []);

  useEffect(() => {
    filterAndSortDues();
  }, [filterAndSortDues]);

  const fetchOutstandingDues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overdue dues from the API
      const response = await financialService.getOverdueDues(1, 100);
      const overdues = response.dues || [];

      // Transform and enrich the data
      const enrichedDues: OutstandingDue[] = overdues.map((due: Due) => {
        const dueDate = new Date(due.dueDate);
        const today = new Date();
        const daysPastDue = Math.max(
          0,
          Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        // Calculate penalty based on days past due
        const penaltyRate = 0.05; // 5% penalty
        const penaltyAmount = daysPastDue > 30 ? due.amount * penaltyRate : 0;
        const totalOwed = due.amount + penaltyAmount;

        return {
          ...due,
          pharmacyName: `Pharmacy ${Math.floor(Math.random() * 1000)}`, // Mock pharmacy name
          daysPastDue,
          penaltyAmount,
          totalOwed,
        };
      });

      setOutstandingDues(enrichedDues);
    } catch (err) {
      setError('Failed to fetch outstanding dues');
      console.error('Error fetching outstanding dues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      // Mock API call for sending reminder
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Reminder sent successfully!');
    } catch {
      alert('Failed to send reminder');
    }
  };

  const handleAddPenalty = async (dueId: string) => {
    const reason = prompt('Enter penalty reason:');
    if (!reason) return;

    const amount = prompt('Enter penalty amount:');
    if (!amount || isNaN(Number(amount))) return;

    try {
      await financialService.addPenaltyToDue(dueId, {
        amount: Number(amount),
        reason,
      });
      fetchOutstandingDues(); // Refresh data
      alert('Penalty added successfully!');
    } catch {
      alert('Failed to add penalty');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Outstanding Dues Report'],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      [
        'Due Title',
        'Pharmacy',
        'Amount',
        'Due Date',
        'Days Past Due',
        'Penalty',
        'Total Owed',
        'Status',
      ],
      ...filteredDues.map((due) => [
        due.title,
        due.pharmacyName || '',
        `₦${due.amount.toLocaleString()}`,
        new Date(due.dueDate).toLocaleDateString(),
        due.daysPastDue.toString(),
        `₦${due.penaltyAmount.toLocaleString()}`,
        `₦${due.totalOwed.toLocaleString()}`,
        due.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outstanding-dues.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPriorityColor = (daysPastDue: number) => {
    if (daysPastDue > 60) return 'text-red-600 bg-red-100';
    if (daysPastDue > 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (daysPastDue: number) => {
    if (daysPastDue > 60) return 'Critical';
    if (daysPastDue > 30) return 'Warning';
    return 'Recent';
  };

  // Pagination
  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDues = filteredDues.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Summary statistics
  const totalOutstanding = filteredDues.reduce(
    (sum, due) => sum + due.totalOwed,
    0
  );
  const totalPenalties = filteredDues.reduce(
    (sum, due) => sum + due.penaltyAmount,
    0
  );
  const criticalCount = filteredDues.filter(
    (due) => due.daysPastDue > 60
  ).length;
  const averageDaysOverdue =
    filteredDues.length > 0
      ? filteredDues.reduce((sum, due) => sum + due.daysPastDue, 0) /
        filteredDues.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchOutstandingDues}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Outstanding Dues</h1>
        <button
          onClick={exportData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-red-600">
                ₦{totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Penalties
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                ₦{totalPenalties.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Critical Cases
              </p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Days Overdue
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {averageDaysOverdue.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search dues or pharmacy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical (60+ days)</option>
            <option value="warning">Warning (30-60 days)</option>
            <option value="recent">Recent (0-30 days)</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'amount' | 'date' | 'penalty')
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="date">Sort by Days Overdue</option>
            <option value="amount">Sort by Amount</option>
            <option value="penalty">Sort by Penalty</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            {filteredDues.length} of {outstandingDues.length} items
          </span>
        </div>
      </div>

      {/* Outstanding Dues Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penalty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Owed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDues.map((due) => (
                <tr key={due._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {due.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(due.dueDate).toLocaleDateString()}
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          due.daysPastDue
                        )}`}
                      >
                        {getPriorityLabel(due.daysPastDue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {due.pharmacyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{due.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        due.daysPastDue
                      )}`}
                    >
                      {due.daysPastDue} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    ₦{due.penaltyAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₦{due.totalOwed.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSendReminder()}
                        className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-600 rounded"
                      >
                        Send Reminder
                      </button>
                      <button
                        onClick={() => handleAddPenalty(due._id)}
                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-600 rounded"
                      >
                        Add Penalty
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredDues.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{filteredDues.length}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingDues;
