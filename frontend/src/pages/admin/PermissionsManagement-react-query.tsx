// Full implementation of PermissionsManagement.tsx with React Query
import React, { useState } from 'react';
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  type Permission,
} from '../../hooks/usePermissions';
import {
  Box,
  Card,
  CardBody,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Spinner,
  Flex,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  FormControl,
  FormLabel,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';

const PermissionsManagement: React.FC = () => {
  const { toast } = useToast();

  // State variables
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
  const [page] = useState(1);

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

  // Use React Query hooks for data fetching
  const {
    data,
    isLoading: loading,
    refetch,
  } = usePermissions(page, 100, {
    resource: resourceFilter || undefined,
    action: actionFilter || undefined,
    search: searchTerm || undefined,
  });

  const filteredPermissions = data?.data || [];

  // Mutations
  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter permissions client-side as well
  const filteredPermissionsClient = filteredPermissions.filter((permission) => {
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

    if (!formData.name || !formData.resource || !formData.action) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
      });
      return;
    }

    try {
      if (dialogMode === 'edit' && currentPermission) {
        await updatePermissionMutation.mutateAsync({
          id: currentPermission._id,
          data: formData,
        });
        toast({
          title: 'Success',
          description: 'Permission updated successfully',
          status: 'success',
        });
      } else {
        await createPermissionMutation.mutateAsync(formData);
        toast({
          title: 'Success',
          description: 'Permission created successfully',
          status: 'success',
        });
      }

      setShowPermissionDialog(false);
      setFormData({
        name: '',
        description: '',
        resource: '',
        action: '',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save permission',
        status: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePermissionMutation.mutateAsync(selectedPermissionForDelete);
      toast({
        title: 'Success',
        description: 'Permission deleted successfully',
        status: 'success',
      });
      setShowDeleteDialog(false);
      setSelectedPermissionForDelete('');
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete permission',
        status: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Permissions Management
            </Text>
            <Text color="gray.600">
              Manage system permissions and access controls
            </Text>
          </Box>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={handleCreatePermission}
          >
            Create Permission
          </Button>
        </Flex>

        {/* Filters */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold">
                Filters
              </Text>
              <Flex gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                  <FormControl>
                    <FormLabel>Search</FormLabel>
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </FormControl>
                </Box>
                <Box flex="1" minW="200px">
                  <FormControl>
                    <FormLabel>Resource</FormLabel>
                    <Select
                      value={resourceFilter}
                      onChange={(e) => setResourceFilter(e.target.value)}
                      placeholder="All Resources"
                    >
                      {resources.map((resource) => (
                        <option key={resource} value={resource}>
                          {resource.replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box flex="1" minW="200px">
                  <FormControl>
                    <FormLabel>Action</FormLabel>
                    <Select
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                      placeholder="All Actions"
                    >
                      {actions.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        {/* Permissions Table */}
        <Card>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Description</Th>
                    <Th>Resource</Th>
                    <Th>Action</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPermissionsClient.map((permission) => (
                    <Tr key={permission._id}>
                      <Td fontWeight="medium">{permission.name}</Td>
                      <Td>{permission.description}</Td>
                      <Td>
                        <Badge colorScheme="blue">
                          {permission.resource.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="green">{permission.action}</Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit permission"
                            icon={<FaEdit />}
                            size="sm"
                            onClick={() => handleEditPermission(permission)}
                          />
                          <IconButton
                            aria-label="Delete permission"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeletePermission(permission._id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Create/Edit Permission Modal */}
        <Modal isOpen={showPermissionDialog} onClose={() => setShowPermissionDialog(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {dialogMode === 'create' ? 'Create Permission' : 'Edit Permission'}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Permission name"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Permission description"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Resource</FormLabel>
                  <Select
                    value={formData.resource}
                    onChange={(e) => handleSelectChange('resource', e.target.value)}
                    placeholder="Select resource"
                  >
                    {resources.map((resource) => (
                      <option key={resource} value={resource}>
                        {resource.replace('_', ' ')}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Action</FormLabel>
                  <Select
                    value={formData.action}
                    onChange={(e) => handleSelectChange('action', e.target.value)}
                    placeholder="Select action"
                  >
                    {actions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setShowPermissionDialog(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmitPermission}
                isLoading={createPermissionMutation.isPending || updatePermissionMutation.isPending}
              >
                {dialogMode === 'create' ? 'Create' : 'Update'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Permission</ModalHeader>
            <ModalBody>
              <Text>Are you sure you want to delete this permission? This action cannot be undone.</Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                isLoading={deletePermissionMutation.isPending}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default PermissionsManagement; 