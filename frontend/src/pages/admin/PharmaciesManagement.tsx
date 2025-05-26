import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy, PharmacyStats } from '../../types/pharmacy.types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
}

const initialStats: PharmacyStats = {
  totalPharmacies: 0,
  activePharmacies: 0,
  pendingApproval: 0,
  recentlyAdded: 0,
  duesCollected: 0,
  duesOutstanding: 0,
};

const PharmaciesManagement: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<PharmacyStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'approved' | 'pending'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const limit = 10;

  type Filter = {
    isApproved?: boolean;
    search?: string;
    registrationStatus?: string;
    townArea?: string;
    userId?: string;
  };

  const fetchPharmacies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: Filter = {};

      if (filterStatus === 'approved') {
        filters.isApproved = true;
      } else if (filterStatus === 'pending') {
        filters.isApproved = false;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await pharmacyService.getPharmacies(
        currentPage,
        limit,
        filters
      );
      const pharmacyData = response?.pharmacies ?? [];
      const total = response?.total ?? 0;

      setPharmacies(pharmacyData);
      setTotalPages(Math.ceil(total / limit));
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch pharmacies. Please try again later.'
      );
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await pharmacyService.getPharmacyStats();
      if (statsData) {
        // Ensure all required properties are present
        setStats({
          totalPharmacies: statsData.totalPharmacies ?? 0,
          activePharmacies: statsData.activePharmacies ?? 0,
          pendingApproval: statsData.pendingApproval ?? 0,
          recentlyAdded: statsData.recentlyAdded ?? 0,
          duesCollected: statsData.duesCollected ?? 0,
          duesOutstanding: statsData.duesOutstanding ?? 0,
        });
      } else {
        setStats(initialStats);
      }
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      console.error('Failed to fetch pharmacy stats:', error.message);
      // Don't show this error to the user, just use initial stats
      setStats(initialStats);
    }
  }, []);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewDetails = (pharmacyId: string) => {
    navigate(`/admin/pharmacies/${pharmacyId}`);
  };

  const handleApprove = async (pharmacyId: string) => {
    try {
      await pharmacyService.approvePharmacy(pharmacyId);
      fetchPharmacies();
      fetchStats();
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to approve pharmacy'
      );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPharmacies();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Pharmacies Management
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all registered pharmacies in the system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <i className="fas fa-hospital text-white text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Pharmacies
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPharmacies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <i className="fas fa-check-circle text-white text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Pharmacies
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activePharmacies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <i className="fas fa-clock text-white text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Approval
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingApproval}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex rounded-md shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pharmacies..."
              className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Search
            </button>
          </div>
        </form>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as 'all' | 'approved' | 'pending')
          }
          className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pharmacies.length === 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <i className="fas fa-store text-4xl text-gray-400"></i>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No pharmacies found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'No pharmacies match your search criteria'
              : filterStatus !== 'all'
              ? `No ${filterStatus} pharmacies found`
              : 'No pharmacies have been registered yet'}
          </p>
        </div>
      )}

      {/* Pharmacies List */}
      {!loading && !error && pharmacies.length > 0 && (
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Registration
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pharmacies.map((pharmacy) => (
                      <tr key={pharmacy._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {pharmacy.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {pharmacy.address}, {pharmacy.townArea}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          PCN: {pharmacy.pcnLicense}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {pharmacy.registrationStatus === 'active' ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <button
                            onClick={() => handleViewDetails(pharmacy._id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View Details
                          </button>
                          {pharmacy.registrationStatus !== 'active' && (
                            <button
                              onClick={() => handleApprove(pharmacy._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span>{' '}
                of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmaciesManagement;
