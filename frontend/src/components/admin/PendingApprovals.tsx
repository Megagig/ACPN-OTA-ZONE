import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';
import type { User } from '../../types/auth.types';
import { Button } from '../shadcn/button';
import { useToast } from '../../hooks/useToast';

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
  const { toast } = useToast();

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
        toast({ title: 'Error', description: errorMessage, status: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  ); // Removed userService.getPendingApprovals from deps as it's a stable function from an imported object

  useEffect(() => {
    fetchPendingUsers(pagination.page, pagination.limit);
  }, [fetchPendingUsers, pagination.page, pagination.limit]);

  const handleApprove = async (userId: string) => {
    try {
      await userService.approveUser(userId);
      toast({
        title: 'Success',
        description: 'User approved successfully.',
        status: 'success',
      });
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error approving user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve user.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, status: 'error' });
    }
  };

  const handleDeny = async (userId: string) => {
    try {
      await userService.denyUser(userId);
      toast({
        title: 'Success',
        description: 'User denied successfully.',
        status: 'success',
      });
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error denying user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to deny user.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, status: 'error' });
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
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
        status: 'success',
      });
      fetchPendingUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, status: 'error' });
    }
  };

  if (loading && pendingUsers.length === 0) {
    // Show loader only on initial load or when users array is empty
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4"
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
      <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
        No pending approvals at this time.
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Pending Account Approvals
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Review and manage new user registrations that require approval.
          (Total: {pagination.total})
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PCN License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingUsers
              .filter((user): user is PendingUserType => !!user)
              .map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.pcnLicense || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(
                      user.createdAt || user.registrationDate || Date.now()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
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
                      className="text-green-600 hover:text-green-900 border-green-600 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDeny(user._id)}
                      variant="outline"
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-900 border-yellow-600 hover:bg-yellow-50"
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
        {/* Basic Pagination Controls */}
        {pagination.total > 0 && pagination.totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                <p className="text-sm text-gray-700">
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
