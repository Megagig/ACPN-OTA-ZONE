import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import userManagementService from '../../services/userManagement.service';
import type {
  Role,
  AuditTrailEntry,
} from '../../services/userManagement.service';
import type { User } from '../../types/auth.types';
import ProfilePictureUploader from '../../components/user/ProfilePictureUploader';

// UI Components
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast,
} from '../../components/ui';

const statusColors: Record<
  string,
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary'
  | 'default'
  | 'outline'
  | 'info'
  | 'gray'
> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'destructive',
  pending: 'secondary',
  rejected: 'destructive',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showStatusDialog, setShowStatusDialog] = useState<boolean>(false);
  const [showRoleDialog, setShowRoleDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const [newStatus, setNewStatus] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userManagementService.getUserById(id!);
      setUser(response.data);

      // Initialize form data
      setEditFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await userManagementService.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  const fetchAuditTrail = useCallback(async () => {
    try {
      const response = await userManagementService.getUserAuditTrail(id!);
      setAuditTrail(response.data);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    }
  }, [id]);

  // Fetch data on component mount
  useEffect(() => {
    if (id) {
      fetchUser();
      fetchRoles();
      fetchAuditTrail();
    }
  }, [id, fetchUser, fetchRoles, fetchAuditTrail]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await userManagementService.updateUser(id!, editFormData);
      toast({
        title: 'Success',
        description: 'User details updated successfully.',
      });

      // Refresh user data
      fetchUser();
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async () => {
    try {
      await userManagementService.updateUserStatus(id!, newStatus);
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}.`,
      });

      // Refresh user data
      fetchUser();
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async () => {
    try {
      await userManagementService.assignUserRole(id!, newRole);
      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });

      // Refresh user data
      fetchUser();
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userManagementService.deleteUser(id!);
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });

      // Navigate back to users list
      navigate('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">User not found</h2>
        <p className="text-muted-foreground mt-2">
          The requested user could not be found or you don't have permission to
          view it.
        </p>
        <Button className="mt-4" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
          <p className="text-muted-foreground">
            View and manage user information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            Back to Users
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>User's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <ProfilePictureUploader
                user={user}
                onPictureUpdate={(newPictureUrl) => {
                  setUser((prev) =>
                    prev ? { ...prev, profilePicture: newPictureUrl } : prev
                  );
                }}
              />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-medium">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2">
                <Badge variant={statusColors[user.status] || 'default'}>
                  {user.status}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PCN Number</p>
                  <p className="font-medium">{user.pcnNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button onClick={() => setShowEditDialog(true)}>
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(true)}
              >
                Change Status
              </Button>
              <Button variant="outline" onClick={() => setShowRoleDialog(true)}>
                Change Role
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="details">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Information</CardTitle>
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h4 className="font-medium">Full Name</h4>
                    <p>
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Email</h4>
                    <p>{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Phone</h4>
                    <p>{user.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">PCN Number</h4>
                    <p>{user.pcnNumber || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Address</h4>
                    <p>{user.address || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Status</h4>
                    <p>
                      <Badge variant={statusColors[user.status] || 'default'}>
                        {user.status}
                      </Badge>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Role</h4>
                    <p className="capitalize">{user.role}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">Member Since</h4>
                    <p>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Last Updated</h4>
                  <p>{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</p>
                </div>

                {user.pharmacy && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Associated Pharmacy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <h4 className="text-sm text-muted-foreground">Name</h4>
                        <p>{user.pharmacy.name}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm text-muted-foreground">
                          Registration Number
                        </h4>
                        <p>{user.pharmacy.registrationNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm text-muted-foreground">
                          Address
                        </h4>
                        <p>{user.pharmacy.address || 'N/A'}</p>
                      </div>
                    </div>
                    <Button className="mt-4" variant="outline" asChild>
                      <Link to={`/admin/pharmacies/${user.pharmacy._id}`}>
                        View Pharmacy Details
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Action</th>
                        <th className="text-left p-2">Resource</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditTrail.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            No audit trail records found
                          </td>
                        </tr>
                      ) : (
                        auditTrail.map((entry) => (
                          <tr
                            key={entry._id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="p-2 capitalize">
                              {entry.action.toLowerCase()}
                            </td>
                            <td className="p-2 capitalize">
                              {entry.resourceType.toLowerCase()}
                            </td>
                            <td className="p-2">
                              {formatDate(entry.createdAt)}
                            </td>
                            <td className="p-2">{entry.ipAddress}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog isOpen={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update the user's profile information. Email and PCN number cannot
              be changed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email (cannot be changed)</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label>PCN Number (cannot be changed)</Label>
                <Input value={user.pcnNumber || 'N/A'} disabled />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Update the status of this user account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog isOpen={showRoleDialog} onClose={() => setShowRoleDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Assign a different role to this user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDetail;
