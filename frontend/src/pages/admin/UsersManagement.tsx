import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../services/user.service';
import userManagementService from '../../services/userManagement.service';
import type { User } from '../../types/auth.types';
import type { Role } from '../../services/userManagement.service';
import BulkOperationsToolbar from '../../components/user/BulkOperationsToolbar';
import { useToast } from '../../hooks/useToast';

// UI Components
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Badge,
  Pagination,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui';

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'destructive',
  pending: 'secondary',
  rejected: 'destructive',
};

const UsersManagement: React.FC = () => {
  const { toast } = useToast();

  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [bulkActionValue, setBulkActionValue] = useState<string>('');
  const [showBulkActionDialog, setShowBulkActionDialog] =
    useState<boolean>(false);

  // Fetch users on component mount and when filters change
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        status?: string;
        role?: string;
      } = {
        page,
        limit,
      };

      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const response = await userService.getUsers(params);
      setUsers(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, page, limit, statusFilter, roleFilter]);

  const fetchRoles = async () => {
    try {
      const response = await userManagementService.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.pcnNumber?.toLowerCase().includes(searchLower)
    );
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user._id));
    }
  };

  const executeBulkAction = async () => {
    try {
      if (bulkActionType === 'status') {
        await userManagementService.bulkUpdateUserStatus(
          selectedUsers,
          bulkActionValue
        );
        toast({
          title: 'Success',
          description: `Status updated for ${selectedUsers.length} users.`,
        });
      } else if (bulkActionType === 'role') {
        await userManagementService.bulkAssignUserRole(
          selectedUsers,
          bulkActionValue
        );
        toast({
          title: 'Success',
          description: `Role assigned for ${selectedUsers.length} users.`,
        });
      }

      // Refresh users
      fetchUsers();
      // Clear selection
      setSelectedUsers([]);
      // Reset values
      setBulkActionValue('');
    } catch (error) {
      console.error('Error executing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Users Management
          </h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/roles">
            <Button variant="outline">Manage Roles</Button>
          </Link>
          <Link to="/admin/permissions">
            <Button variant="outline">Manage Permissions</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:w-2/5">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <BulkOperationsToolbar
                selectedCount={selectedUsers.length}
                onClearSelection={() => setSelectedUsers([])}
                onBulkStatusChange={(status) => {
                  setBulkActionType('status');
                  setBulkActionValue(status);
                  executeBulkAction();
                }}
                onBulkRoleAssign={(roleId) => {
                  setBulkActionType('role');
                  setBulkActionValue(roleId);
                  executeBulkAction();
                }}
                roles={roles}
              />
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <Checkbox
                        checked={
                          selectedUsers.length > 0 &&
                          selectedUsers.length === filteredUsers.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">PCN Number</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={() =>
                              handleUserSelection(user._id)
                            }
                          />
                        </td>
                        <td className="p-2">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.pcnNumber}</td>
                        <td className="p-2">
                          <span className="capitalize">{user.role}</span>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              statusColors[user.status] as
                                | 'success'
                                | 'warning'
                                | 'destructive'
                                | 'secondary'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Link to={`/admin/users/${user._id}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                            <Link to={`/admin/users/${user._id}/edit`}>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <div>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <AlertDialog
        open={showBulkActionDialog}
        onOpenChange={setShowBulkActionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionType === 'status'
                ? 'Update Status for Selected Users'
                : 'Assign Role to Selected Users'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will be applied to {selectedUsers.length} selected
              users.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bulkActionType === 'status' ? (
            <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              disabled={!bulkActionValue}
            >
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement;
