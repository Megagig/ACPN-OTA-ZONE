import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';
import type { User } from '../../types/auth.types';
import { Button } from '../shadcn/button';
import { useToast } from '../../hooks/useToast';
import ConfirmationModal from '../common/ConfirmationModal'; // Import the modal

interface ApprovedUserType extends User {
  createdAt?: string;
  phone?: string;
  pcnLicense?: string;
}

const ApprovedUsers: React.FC = () => {
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

  const fetchApprovedUsers = useCallback(
    async (page: number, limit: number) => {
      try {
        setLoading(true);
        // Fetch users with status 'active'
        const response = await userService.getUsers({
          page,
          limit,
          status: 'active',
        });
        setApprovedUsers(response.data as ApprovedUserType[]);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching approved users:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load approved users.';
        setError(errorMessage);
        toast({ title: 'Error', description: errorMessage, status: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchApprovedUsers(pagination.page, pagination.limit);
  }, [fetchApprovedUsers, pagination.page, pagination.limit]);

  const openDeleteModal = (userId: string) => {
    setUserIdToDelete(userId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserIdToDelete(null);
    setIsModalOpen(false);
  };

  const confirmDeleteUser = async () => {
    if (!userIdToDelete) return;

    try {
      await userService.deleteUser(userIdToDelete);
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
        status: 'success',
      });
      closeDeleteModal();
      // Refresh the list after deletion
      fetchApprovedUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user.';
      toast({ title: 'Error', description: errorMessage, status: 'error' });
      closeDeleteModal();
    }
  };

  if (loading && approvedUsers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          onClick={() => fetchApprovedUsers(pagination.page, pagination.limit)}
          className="ml-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!loading && approvedUsers.length === 0 && !error) {
    return (
      <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
        No approved users found.
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Approved Users
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          List of users whose accounts have been activated. (Total:{' '}
          {pagination.total})
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
            {approvedUsers
              .filter((user): user is ApprovedUserType => !!user)
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
                      user.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteModal(user._id)} // Open modal instead
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {pagination.total > 0 && pagination.totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() =>
                  fetchApprovedUsers(pagination.page - 1, pagination.limit)
                }
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  fetchApprovedUsers(pagination.page + 1, pagination.limit)
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
                      fetchApprovedUsers(pagination.page - 1, pagination.limit)
                    }
                    disabled={pagination.page <= 1}
                    variant="outline"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      fetchApprovedUsers(pagination.page + 1, pagination.limit)
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

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ApprovedUsers;
