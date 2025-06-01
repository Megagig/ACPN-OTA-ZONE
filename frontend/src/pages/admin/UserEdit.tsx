import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import userManagementService from '../../services/userManagement.service';
import type { Role } from '../../services/userManagement.service';
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
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  useToast,
} from '../../components/ui';

const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    status: '',
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(id!);
      setUser(response.data);

      // Initialize form data
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        role: response.data.role || '',
        status: response.data.status || '',
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
      toast({
        title: 'Error',
        description: 'Failed to fetch roles. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch data on component mount
  useEffect(() => {
    if (id) {
      fetchUser();
      fetchRoles();
    }
  }, [id, fetchUser, fetchRoles]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update user profile
      await userService.updateUser(id!, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      });

      // Update user status if changed
      if (user?.status !== formData.status) {
        await userManagementService.updateUserStatus(id!, formData.status);
      }

      // Update user role if changed
      if (user?.role !== formData.role) {
        // Find role ID by name
        const role = roles.find((r) => r.name === formData.role);
        if (role) {
          await userManagementService.assignUserRole(id!, role._id);
        }
      }

      toast({
        title: 'Success',
        description: 'User updated successfully.',
      });

      // Navigate back to user details
      navigate(`/admin/users/${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
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
          edit it.
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
          <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
          <p className="text-muted-foreground">
            Edit user information and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/users/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Update the user's personal information, role, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-8">
            <ProfilePictureUploader
              user={user}
              onPictureUpdate={(newPictureUrl) => {
                setUser((prev) =>
                  prev ? { ...prev, profilePicture: newPictureUrl } : prev
                );
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email (cannot be changed)</Label>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
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

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate(`/admin/users/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserEdit;
