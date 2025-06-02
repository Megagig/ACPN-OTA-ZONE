import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy, PharmacyStats } from '../../types/pharmacy.types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
}

interface PharmacyFilters {
  status?: 'active' | 'pending' | 'expired' | 'suspended';
  search?: string;
}

const initialStats: PharmacyStats = {
  totalPharmacies: 0,
  activePharmacies: 0,
  pendingApproval: 0,
  recentlyAdded: 0,
  duesCollected: 0,
  duesOutstanding: 0,
};

const StatsCardSkeleton = () => (
  <div className="bg-card overflow-hidden shadow rounded-lg animate-pulse">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-muted"></div>
        <div className="ml-5 w-0 flex-1">
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="h-4 bg-muted rounded w-3/4"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="h-4 bg-muted rounded w-1/3"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="h-4 bg-muted rounded w-1/4"></div>
    </td>
    <td className="whitespace-nowrap px-3 py-4">
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </td>
  </tr>
);

const PharmaciesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<PharmacyStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'pending' | 'expired' | 'suspended'
  >('all');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const itemsPerPage = 10;

  const fetchPharmacies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PharmacyFilters = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await pharmacyService.getPharmacies(
        currentPage,
        itemsPerPage,
        filters
      );
      const pharmacyData = response?.pharmacies ?? [];
      const total = response?.total ?? 0;

      setPharmacies(pharmacyData);
      setTotalPages(Math.ceil(total / itemsPerPage));
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
    setCurrentPage(1);
    fetchPharmacies();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    // Sort pharmacies locally
    const sortedPharmacies = [...pharmacies].sort((a, b) => {
      let aValue = (a as any)[field];
      let bValue = (b as any)[field];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setPharmacies(sortedPharmacies);
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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/admin/pharmacies/add')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-auto"
          >
            Add Pharmacy
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
        stats && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-3">
                    <i className="fas fa-hospital text-primary-foreground text-xl" />
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
                    <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-xl" />
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
                    <i className="fas fa-clock text-yellow-600 dark:text-yellow-400 text-xl" />
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
        )
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-6 rounded-md bg-destructive/10 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i
                className="fas fa-exclamation-circle text-destructive"
                aria-hidden="true"
              />
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
            <i className="fas fa-store text-4xl text-muted-foreground" />
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

      {/* Search and Filter */}
      <div className="mt-8 grid grid-cols-1 sm:flex sm:flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[250px]">
          <div className="flex rounded-md shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pharmacies..."
              className="block w-full rounded-l-md border-input bg-background py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm"
            />
            <button
              type="submit"
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <i className="fas fa-search"></i>
              <span className="sr-only">Search</span>
            </button>
          </div>
        </form>

        <div className="w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="block w-full rounded-md border-input bg-background py-2 px-3 text-foreground shadow-sm focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Pharmacies List */}
      {!error && pharmacies.length > 0 && (
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow ring-1 ring-border md:rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === 'name' && (
                            <i
                              className={`fas fa-sort-${
                                sortDirection === 'asc' ? 'up' : 'down'
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('address')}
                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-1">
                          Location
                          {sortField === 'address' && (
                            <i
                              className={`fas fa-sort-${
                                sortDirection === 'asc' ? 'up' : 'down'
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('pcnLicense')}
                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-1">
                          Registration
                          {sortField === 'pcnLicense' && (
                            <i
                              className={`fas fa-sort-${
                                sortDirection === 'asc' ? 'up' : 'down'
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('registrationStatus')}
                        className="px-3 py-3.5 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === 'registrationStatus' && (
                            <i
                              className={`fas fa-sort-${
                                sortDirection === 'asc' ? 'up' : 'down'
                              } ml-1`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {loading ? (
                      <>
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                      </>
                    ) : (
                      pharmacies.map((pharmacy) => (
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
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                pharmacy.registrationStatus === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              }`}
                            >
                              {pharmacy.registrationStatus === 'active'
                                ? 'Active'
                                : 'Pending'}
                            </span>
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
                      ))
                    )}
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
