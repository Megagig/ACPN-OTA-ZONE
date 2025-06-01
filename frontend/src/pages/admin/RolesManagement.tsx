import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import userManagementService from '../../services/userManagement.service';
import type { Role, Permission } from '../../services/userManagement.service';

// UI Components
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Checkbox,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
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

const RolesManagement: React.FC = () => {
  const { toast } = useToast();

  // State variables
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRoleDialog, setShowRoleDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showPermissionDialog, setShowPermissionDialog] =
    useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRoleForDelete, setSelectedRoleForDelete] =
    useState<string>('');

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userManagementService.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await userManagementService.getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredRoles = roles.filter((role) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(searchLower) ||
      role.description.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateRole = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
    });
    setSelectedPermissions([]);
    setShowRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setDialogMode('edit');
    setCurrentRole(role);
    setFormData({
      name: role.name,
      description: role.description,
    });

    // Set selected permissions
    const permissionIds = Array.isArray(role.permissions)
      ? role.permissions.map((p) => (typeof p === 'string' ? p : p._id))
      : [];

    setSelectedPermissions(permissionIds);
    setShowRoleDialog(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setSelectedRoleForDelete(roleId);
    setShowDeleteDialog(true);
  };

  const handleManagePermissions = (role: Role) => {
    setCurrentRole(role);

    // Set selected permissions
    const permissionIds = Array.isArray(role.permissions)
      ? role.permissions.map((p) => (typeof p === 'string' ? p : p._id))
      : [];

    setSelectedPermissions(permissionIds);
    setShowPermissionDialog(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (dialogMode === 'create') {
        await userManagementService.createRole({
          ...formData,
          permissions: selectedPermissions,
        });
        toast({
          title: 'Success',
          description: 'Role created successfully.',
        });
      } else if (dialogMode === 'edit' && currentRole) {
        await userManagementService.updateRole(currentRole._id, {
          ...formData,
          permissions: selectedPermissions,
        });
        toast({
          title: 'Success',
          description: 'Role updated successfully.',
        });
      }

      // Refresh roles
      fetchRoles();
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: 'Error',
        description: 'Failed to save role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await userManagementService.deleteRole(selectedRoleForDelete);
      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      });

      // Refresh roles
      fetchRoles();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;

    try {
      await userManagementService.updateRole(currentRole._id, {
        permissions: selectedPermissions,
      });
      toast({
        title: 'Success',
        description: 'Permissions updated successfully.',
      });

      // Refresh roles
      fetchRoles();
      setShowPermissionDialog(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const initializeDefaultRoles = async () => {
    try {
      setLoading(true);
      await userManagementService.initializeDefaultRoles();
      toast({
        title: 'Success',
        description: 'Default roles initialized successfully.',
      });

      // Refresh roles
      fetchRoles();
    } catch (error) {
      console.error('Error initializing default roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize default roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource for better organization
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Roles Management
          </h2>
          <p className="text-muted-foreground">
            Create and manage roles and their permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateRole}>Create Role</Button>
          <Button variant="outline" onClick={initializeDefaultRoles}>
            Initialize Default Roles
          </Button>
          <Link to="/admin/permissions">
            <Button variant="outline">Manage Permissions</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            View and manage all roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center">
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={handleSearch}
                className="max-w-sm"
              />
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Permissions</th>
                    <th className="text-left p-2">Default</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Loading roles...
                      </td>
                    </tr>
                  ) : filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        No roles found
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => (
                      <tr key={role._id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{role.name}</td>
                        <td className="p-2">{role.description}</td>
                        <td className="p-2">
                          {Array.isArray(role.permissions) && (
                            <Badge variant="outline">
                              {role.permissions.length} permissions
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {role.isDefault ? (
                            <Badge variant="default">Default</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManagePermissions(role)}
                            >
                              Permissions
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRole(role)}
                            >
                              Edit
                            </Button>
                            {!role.isDefault && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRole(role._id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Role Dialog */}
      <Dialog isOpen={showRoleDialog} onClose={() => setShowRoleDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create New Role' : 'Edit Role'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new role with specific permissions.'
                : 'Edit the role details and permissions.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRole}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Content Manager"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the role's responsibilities"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(
                    ([resource, perms]) => (
                      <div key={resource} className="mb-4">
                        <h4 className="font-medium mb-1 capitalize">
                          {resource}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`permission-${permission._id}`}
                                checked={selectedPermissions.includes(
                                  permission._id
                                )}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permission._id)
                                }
                              />
                              <label
                                htmlFor={`permission-${permission._id}`}
                                className="text-sm cursor-pointer"
                              >
                                {permission.action} {resource}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions for {currentRole?.name}
            </DialogTitle>
            <DialogDescription>
              Select the permissions you want to assign to this role.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="mb-4">
                <h4 className="font-medium mb-1 border-b pb-1 capitalize">
                  {resource}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {perms.map((permission) => (
                    <div
                      key={permission._id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`perm-${permission._id}`}
                        checked={selectedPermissions.includes(permission._id)}
                        onCheckedChange={() =>
                          handlePermissionToggle(permission._id)
                        }
                      />
                      <label
                        htmlFor={`perm-${permission._id}`}
                        className="text-sm cursor-pointer capitalize"
                      >
                        {permission.action}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPermissionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>Save Permissions</Button>
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
              role and any associations it may have.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

export default RolesManagement;
