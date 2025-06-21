import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,  FormLabel,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Spinner,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiKey,
} from 'react-icons/fi';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { type Permission } from '../../hooks/usePermissions';
import userManagementService from '../../services/userManagement.service';

const ModernPermissionsManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen: isPermissionOpen, onOpen: onPermissionOpen, onClose: onPermissionClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // State variables
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
  });

  // Available options
  const resources = ['users', 'roles', 'permissions', 'pharmacies', 'dues', 'documents', 'events', 'elections', 'finances'];
  const actions = ['create', 'read', 'update', 'delete', 'manage', 'view', 'approve'];

  // Load permissions
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userManagementService.getPermissions();
      setPermissions(response.data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Filter permissions
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = !resourceFilter || permission.resource === resourceFilter;
    const matchesAction = !actionFilter || permission.action === actionFilter;
    
    return matchesSearch && matchesResource && matchesAction;
  });

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (isEditing && selectedPermission) {
        await userManagementService.updatePermission(selectedPermission._id, formData);
        toast({
          title: 'Success',
          description: 'Permission updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await userManagementService.createPermission(formData);
        toast({
          title: 'Success',
          description: 'Permission created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onPermissionClose();
      loadPermissions();
      resetForm();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} permission`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedPermission) return;

    try {
      await userManagementService.deletePermission(selectedPermission._id);
      toast({
        title: 'Success',
        description: 'Permission deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
      loadPermissions();
      setSelectedPermission(null);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete permission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: '',
    });
    setSelectedPermission(null);
    setIsEditing(false);
  };

  // Open edit dialog
  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || '',
      resource: permission.resource,
      action: permission.action,
    });
    setIsEditing(true);
    onPermissionOpen();
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    onPermissionOpen();
  };

  // Open delete dialog
  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    onDeleteOpen();
  };

  // Get stats
  const stats = {
    total: permissions.length,
    byResource: resources.reduce((acc, resource) => {
      acc[resource] = permissions.filter(p => p.resource === resource).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />} mb={4}>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/admin/dashboard">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Permissions Management</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <Flex align="center" mb={6}>
            <Box>
              <Heading size="lg" mb={2}>Permissions Management</Heading>
              <Text color="gray.600">Manage system permissions and access controls</Text>
            </Box>
            <Spacer />
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={openCreateDialog}
            >
              Create Permission
            </Button>
          </Flex>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Permissions</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>User Permissions</StatLabel>
                <StatNumber>{stats.byResource.users || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Role Permissions</StatLabel>
                <StatNumber>{stats.byResource.roles || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>System Permissions</StatLabel>
                <StatNumber>{stats.byResource.permissions || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Search</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Resource</FormLabel>
                <Select
                  placeholder="All resources"
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                >
                  {resources.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Action</FormLabel>
                <Select
                  placeholder="All actions"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Permissions Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Permissions ({filteredPermissions.length})</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" />
              </Flex>
            ) : filteredPermissions.length === 0 ? (
              <Text textAlign="center" py={8} color="gray.500">
                No permissions found
              </Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Resource</Th>
                    <Th>Action</Th>
                    <Th>Description</Th>
                    <Th width="120px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPermissions.map((permission) => (
                    <Tr key={permission._id}>
                      <Td>
                        <HStack>
                          <FiKey />
                          <Text fontWeight="medium">{permission.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" variant="subtle">
                          {permission.resource}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="green" variant="subtle">
                          {permission.action}
                        </Badge>
                      </Td>
                      <Td>
                        <Text color="gray.600" noOfLines={2}>
                          {permission.description || 'No description'}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="Edit Permission">
                            <IconButton
                              icon={<FiEdit2 />}
                              aria-label="Edit permission"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(permission)}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Permission">
                            <IconButton
                              icon={<FiTrash2 />}
                              aria-label="Delete permission"
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => openDeleteDialog(permission)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Permission Modal */}
      <Modal isOpen={isPermissionOpen} onClose={onPermissionClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Permission' : 'Create Permission'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Permission Name</FormLabel>
                <Input
                  placeholder="e.g., manage_users"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Resource</FormLabel>
                <Select
                  placeholder="Select resource"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                >
                  {resources.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Action</FormLabel>
                <Select
                  placeholder="Select action"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                >
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Describe what this permission allows..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPermissionClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={!formData.name || !formData.resource || !formData.action}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Permission
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete the permission "{selectedPermission?.name}"?
              This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default ModernPermissionsManagement;
