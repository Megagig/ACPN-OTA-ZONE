import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';
import type { User } from '../../types/auth.types';
import { Button } from '../shadcn/button';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/ConfirmationModal'; // Import the modal

interface ApprovedUserType extends User {
  createdAt?: string;
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
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
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
      toast.success('User deleted successfully.');
      closeDeleteModal();
      // Refresh the list after deletion
      fetchApprovedUsers(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user.';
      toast.error(errorMessage);
      closeDeleteModal();
    }
  };

  if (loading && approvedUsers.length === 0) {
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
      <div className="px-4 py-5 sm:p-6 text-center text-muted-foreground">
        No approved users found.
      </div>
    );
  }

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-lg mt-8">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-foreground">
          Approved Users
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          List of users whose accounts have been activated. (Total:{' '}
          {pagination.total})
        </p>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {approvedUsers
          .filter((user): user is ApprovedUserType => !!user)
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
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
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
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteModal(user._id)}
                  className="w-full sm:w-auto"
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
            {approvedUsers
              .filter((user): user is ApprovedUserType => !!user)
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
                      user.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteModal(user._id)}
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
                    fetchApprovedUsers(pagination.page - 1, pagination.limit)
                  }
                  disabled={pagination.page <= 1}
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    fetchApprovedUsers(pagination.page + 1, pagination.limit)
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
