import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';
import type { User } from '../../types/auth.types';
import { Button } from '../shadcn/button';
import { toast } from 'react-toastify';

interface PendingUserType extends User {
  createdAt?: string; // This is fine as it's not in the frontend User type
  registrationDate?: string; // This is fine as it's not in the frontend User type
}

const PendingApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  const fetchPendingUsers = useCallback(
    async (page: number, limit: number) => {
      try {
        setLoading(true);
        const response = await userService.getPendingApprovals({ page, limit });
        setPendingUsers(response.data as PendingUserType[]);
        // Ensure all pagination fields are explicitly set
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching pending users:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load pending approvals.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [] // Removed toast from dependencies, fetchPendingUsers doesn't directly use it anymore in a way that requires it in deps
  ); // Removed userService.getPendingApprovals from deps as it's a stable function from an imported object

  useEffect(() => {
    fetchPendingUsers(pagination.page, pagination.limit);
  }, [fetchPendingUsers, pagination.page, pagination.limit]);

  const handleApprove = async (userId: string) => {
    try {
      await userService.approveUser(userId);
      toast.success('User approved successfully.');
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error approving user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve user.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeny = async (userId: string) => {
    try {
      await userService.denyUser(userId);
      toast.success('User denied successfully.');
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error denying user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to deny user.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully.');
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading && pendingUsers.length === 0) {
    // Show loader only on initial load or when users array is empty
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div
        className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative my-4"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <Button
          onClick={() => fetchPendingUsers(pagination.page, pagination.limit)}
          className="ml-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!loading && pendingUsers.length === 0 && !error) {
    return (
      <div className="px-4 py-5 sm:p-6 text-center text-muted-foreground">
        No pending approvals at this time.
      </div>
    );
  }

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-foreground">
          Pending Account Approvals
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review and manage new user registrations that require approval.
          (Total: {pagination.total})
        </p>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {pendingUsers
          .filter((user): user is PendingUserType => !!user)
          .map((user) => (
            <div
              key={user._id}
              className="bg-card border border-border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : user.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : user.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  {user.phone || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">PCN License:</span>{' '}
                  {user.pcnLicense || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Registered:</span>{' '}
                  {new Date(
                    user.createdAt || user.registrationDate || Date.now()
                  ).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleApprove(user._id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleDeny(user._id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 border-yellow-600 dark:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                >
                  Deny
                </Button>
                <Button
                  onClick={() => handleDelete(user._id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PCN License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {pendingUsers
              .filter((user): user is PendingUserType => !!user)
              .map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.pcnLicense || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(
                      user.createdAt || user.registrationDate || Date.now()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : user.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : user.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      onClick={() => handleApprove(user._id)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDeny(user._id)}
                      variant="outline"
                      size="sm"
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 border-yellow-600 dark:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                    >
                      Deny
                    </Button>
                    <Button
                      onClick={() => handleDelete(user._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && pagination.totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() =>
                fetchPendingUsers(pagination.page - 1, pagination.limit)
              }
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                fetchPendingUsers(pagination.page + 1, pagination.limit)
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <Button
                  onClick={() =>
                    fetchPendingUsers(pagination.page - 1, pagination.limit)
                  }
                  disabled={pagination.page <= 1}
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Previous
                </Button>
                {/* Consider adding page number buttons here for better UX */}
                <Button
                  onClick={() =>
                    fetchPendingUsers(pagination.page + 1, pagination.limit)
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
