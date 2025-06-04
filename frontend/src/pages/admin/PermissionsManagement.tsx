import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type Permission } from '../../hooks/usePermissions';
import userManagementService from '../../services/userManagement.service';

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

const PermissionsManagement: React.FC = () => {
  const { toast } = useToast();

  // State variables
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [showPermissionDialog, setShowPermissionDialog] =
    useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
  });
  const [selectedPermissionForDelete, setSelectedPermissionForDelete] =
    useState<string>('');

  // Resources and actions (derived from your permission model)
  const resources = [
    'user',
    'pharmacy',
    'financial_record',
    'event',
    'document',
    'communication',
    'election',
    'poll',
    'donation',
    'due',
    'role',
    'permission',
    'audit_trail',
  ];

  const actions = [
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'reject',
    'assign',
    'manage',
    'export',
    'import',
  ];

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userManagementService.getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch permissions on component mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPermissions = permissions.filter((permission) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      permission.name.toLowerCase().includes(searchLower) ||
      permission.description.toLowerCase().includes(searchLower);

    const matchesResource = resourceFilter
      ? permission.resource === resourceFilter
      : true;
    const matchesAction = actionFilter
      ? permission.action === actionFilter
      : true;

    return matchesSearch && matchesResource && matchesAction;
  });

  const handleCreatePermission = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: '',
    });
    setShowPermissionDialog(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setDialogMode('edit');
    setCurrentPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
    });
    setShowPermissionDialog(true);
  };

  const handleDeletePermission = (permissionId: string) => {
    setSelectedPermissionForDelete(permissionId);
    setShowDeleteDialog(true);
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate name if both resource and action are set
    if (name === 'resource' && formData.action) {
      const autoName = `${formData.action}_${value}`;
      const autoDescription = `Permission to ${formData.action} ${value.replace(
        '_',
        ' '
      )}`;
      setFormData((prev) => ({
        ...prev,
        name: autoName,
        description: autoDescription,
      }));
    } else if (name === 'action' && formData.resource) {
      const autoName = `${value}_${formData.resource}`;
      const autoDescription = `Permission to ${value} ${formData.resource.replace(
        '_',
        ' '
      )}`;
      setFormData((prev) => ({
        ...prev,
        name: autoName,
        description: autoDescription,
      }));
    }
  };

  const handleSubmitPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (dialogMode === 'create') {
        await userManagementService.createPermission(formData);
        toast({
          title: 'Success',
          description: 'Permission created successfully.',
        });
      } else if (dialogMode === 'edit' && currentPermission) {
        await userManagementService.updatePermission(
          currentPermission._id,
          formData
        );
        toast({
          title: 'Success',
          description: 'Permission updated successfully.',
        });
      }

      // Refresh permissions
      fetchPermissions();
      setShowPermissionDialog(false);
    } catch (error) {
      console.error('Error saving permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await userManagementService.deletePermission(selectedPermissionForDelete);
      toast({
        title: 'Success',
        description: 'Permission deleted successfully.',
      });

      // Refresh permissions
      fetchPermissions();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete permission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const initializePermissions = async () => {
    try {
      setLoading(true);
      await userManagementService.initializePermissions();
      toast({
        title: 'Success',
        description: 'Default permissions initialized successfully.',
      });

      // Refresh permissions
      fetchPermissions();
    } catch (error) {
      console.error('Error initializing permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource for display
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
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
            Permissions Management
          </h2>
          <p className="text-muted-foreground">
            Create and manage system permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreatePermission}>Create Permission</Button>
          <Button variant="outline" onClick={initializePermissions}>
            Initialize Default Permissions
          </Button>
          <Link to="/admin/roles">
            <Button variant="outline">Manage Roles</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            View and manage all permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:w-2/5">
                <Select
                  value={resourceFilter}
                  onValueChange={setResourceFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Resources</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {resource.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    {actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions by Resource */}
            {loading ? (
              <div className="text-center py-4">Loading permissions...</div>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-center py-4">No permissions found</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div
                    key={resource}
                    className="border rounded-md overflow-hidden"
                  >
                    <div className="bg-muted p-3 font-medium capitalize">
                      {resource.replace('_', ' ')}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Description</th>
                            <th className="text-left p-2">Action</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perms.map((permission) => (
                            <tr
                              key={permission._id}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="p-2">{permission.name}</td>
                              <td className="p-2">{permission.description}</td>
                              <td className="p-2 capitalize">
                                {permission.action}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleEditPermission(permission)
                                    }
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeletePermission(permission._id)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Permission Dialog */}
      <Dialog
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create'
                ? 'Create New Permission'
                : 'Edit Permission'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new permission by defining its resource and action.'
                : 'Edit the permission details.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPermission}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="resource">Resource</Label>
                  <Select
                    value={formData.resource}
                    onValueChange={(value) =>
                      handleSelectChange('resource', value)
                    }
                  >
                    <SelectTrigger disabled={dialogMode === 'edit'}>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                          {resource.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="action">Action</Label>
                  <Select
                    value={formData.action}
                    onValueChange={(value) =>
                      handleSelectChange('action', value)
                    }
                  >
                    <SelectTrigger disabled={dialogMode === 'edit'}>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., create_user"
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
                  placeholder="Describe what this permission allows"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPermissionDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              permission and may affect roles that use it.
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

export default PermissionsManagement;
