import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy, PharmacyStats } from '../../types/pharmacy.types';
import type { AxiosError } from 'axios';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();

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
          <h1 className="text-2xl font-semibold text-foreground">
            Pharmacies Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage all registered pharmacies in the system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary rounded-md p-3">
                  <i className="fas fa-hospital text-primary-foreground text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Total Pharmacies
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      {stats.totalPharmacies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                  <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Active Pharmacies
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      {stats.activePharmacies}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 rounded-md p-3">
                  <i className="fas fa-clock text-yellow-600 dark:text-yellow-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Pending Approval
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
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
              className="flex-1 rounded-l-md border-input bg-background text-foreground focus:border-ring focus:ring-ring px-3 py-2"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
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
          className="rounded-md border-input bg-background text-foreground focus:border-ring focus:ring-ring px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-destructive/10 border-l-4 border-destructive p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-destructive"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pharmacies.length === 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <i className="fas fa-store text-4xl text-muted-foreground"></i>
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground">
            No pharmacies found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
              <div className="overflow-hidden shadow ring-1 ring-border md:rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Location
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Registration
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {pharmacies.map((pharmacy) => (
                      <tr key={pharmacy._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                          {pharmacy.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                          {pharmacy.address}, {pharmacy.townArea}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                          PCN: {pharmacy.pcnLicense}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {pharmacy.registrationStatus === 'active' ? (
                            <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 text-xs font-semibold leading-5 text-green-800 dark:text-green-300">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 text-xs font-semibold leading-5 text-yellow-800 dark:text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                          <button
                            onClick={() => handleViewDetails(pharmacy._id)}
                            className="text-primary hover:text-primary/80 mr-4"
                          >
                            View Details
                          </button>
                          {pharmacy.registrationStatus !== 'active' && (
                            <button
                              onClick={() => handleApprove(pharmacy._id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
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
              className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
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
                        ? 'z-10 bg-primary/10 border-primary text-primary'
                        : 'bg-card border-input text-muted-foreground hover:bg-muted'
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
