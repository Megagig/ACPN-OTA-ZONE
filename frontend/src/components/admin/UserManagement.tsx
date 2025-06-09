import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import dashboardService, {
  type UserManagementStats,
} from '../../services/dashboard.service';
import userManagementService from '../../services/userManagement.service';
import type { User as BaseUser } from '../../types/auth.types';

// Extend the base User type with additional fields for management
interface User extends BaseUser {
  lastLogin?: string;
}

interface FilterOptions {
  role: string;
  status: string;
  search: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    status: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userManagementService.getFilteredUsers({
        role: filters.role !== 'all' ? filters.role : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        page: currentPage,
        limit: 10,
      });

      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers]);

  const fetchStats = async () => {
    try {
      const statsData = await dashboardService.getUserManagementStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: 'approve' | 'suspend' | 'activate' | 'delete'
  ) => {
    try {
      switch (action) {
        case 'approve':
          await userManagementService.updateUserStatus(userId, 'active');
          break;
        case 'suspend':
          await userManagementService.updateUserStatus(userId, 'suspended');
          break;
        case 'activate':
          await userManagementService.updateUserStatus(userId, 'active');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            // Would need to implement delete endpoint
            console.log('Delete user:', userId);
          }
          return;
      }
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(`Error ${action} user:`, err);
    }
  };

  const handleBulkAction = async (
    action: 'approve' | 'suspend' | 'activate' | 'delete'
  ) => {
    if (selectedUsers.length === 0) return;

    try {
      switch (action) {
        case 'approve':
        case 'suspend':
        case 'activate':
          await userManagementService.bulkUpdateUserStatus(
            selectedUsers,
            action === 'approve' || action === 'activate'
              ? 'active'
              : 'suspended'
          );
          break;
        case 'delete':
          if (
            window.confirm(
              `Are you sure you want to delete ${selectedUsers.length} users?`
            )
          ) {
            // Would need to implement bulk delete endpoint
            console.log('Bulk delete users:', selectedUsers);
          }
          return;
      }
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(`Error bulk ${action} users:`, err);
    }
  };

  const handleExportUsers = async () => {
    try {
      await dashboardService.exportDashboardData('users');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      superadmin:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      secretary:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      treasurer:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      member: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[role] || colors.member;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[status] || colors.inactive;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportUsers}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card rounded-lg shadow-md p-3 sm:p-4 border border-border">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Total Users
                </p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-md p-3 sm:p-4 border border-border">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Active Users
                </p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {stats.activeUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-md p-4 border border-border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <UserX className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pendingUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-md p-4 border border-border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.suspendedUsers}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-md p-3 sm:p-4 border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, role: e.target.value }))
            }
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
            <option value="secretary">Secretary</option>
            <option value="treasurer">Treasurer</option>
            <option value="member">Member</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          {selectedUsers.length > 0 && (
            <div className="flex">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 w-full text-sm"
              >
                <span>{selectedUsers.length} selected</span>
                <Filter className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium mb-2">Bulk Actions:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                Activate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 shadow-sm animate-pulse"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-muted rounded flex-1"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching your criteria
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="bg-card border border-border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="rounded border-border"
                  />
                  <div>
                    <h4 className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                {user.pharmacy ? (
                  <div>
                    <p className="font-medium text-foreground">
                      {user.pharmacy.name}
                    </p>
                    <p className="text-xs">
                      {user.pharmacy.registrationNumber}
                    </p>
                  </div>
                ) : (
                  <p>No pharmacy</p>
                )}
                <p>
                  <span className="font-medium">Last Login:</span>{' '}
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => console.log('View user:', user._id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="View User"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => console.log('Edit user:', user._id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Edit User"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {user.status === 'pending' && (
                    <button
                      onClick={() => handleUserAction(user._id, 'approve')}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      title="Approve User"
                    >
                      Approve
                    </button>
                  )}
                  {user.status === 'active' && (
                    <button
                      onClick={() => handleUserAction(user._id, 'suspend')}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      title="Suspend User"
                    >
                      Suspend
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button
                      onClick={() => handleUserAction(user._id, 'activate')}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      title="Activate User"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => console.log('More actions for:', user._id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card rounded-lg shadow-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map((u) => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-border"
                  />
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  User
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  Role
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  Status
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  Pharmacy
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  Last Login
                </th>
                <th className="p-3 text-left text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-3">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.pharmacy ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.pharmacy.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.pharmacy.registrationNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No pharmacy
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => console.log('View user:', user._id)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => console.log('Edit user:', user._id)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.status === 'pending' && (
                          <button
                            onClick={() =>
                              handleUserAction(user._id, 'approve')
                            }
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Approve User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() =>
                              handleUserAction(user._id, 'suspend')
                            }
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Suspend User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() =>
                              handleUserAction(user._id, 'activate')
                            }
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Activate User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            console.log('More actions for:', user._id)
                          }
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex space-x-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
