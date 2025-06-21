import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  InputGroup,
  InputLeftElement,
  Flex,
  Container,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Checkbox,
  CheckboxGroup,
  Stack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,  FiMoreVertical,
  FiSearch,
  FiRefreshCw,
  FiEye,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import userManagementService from '../../services/userManagement.service';
import type { Role, Permission } from '../../services/userManagement.service';

const MotionBox = motion(Box);

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

const ModernRolesManagement: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Modal controls
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        userManagementService.getRoles(),
        userManagementService.getPermissions(),
      ]);      setRoles(rolesData?.data || rolesData || []);
      setPermissions(permissionsData?.data || permissionsData || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles
  const filteredRoles = roles.filter((role) => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create role
  const handleCreateRole = async () => {
    try {
      setSaving(true);
      const response = await userManagementService.createRole(formData);
      setRoles(prev => [...prev, response?.data || response]);
      onCreateModalClose();
      resetForm();
      toast({
        title: 'Success',
        description: 'Role created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit role
  const handleEditRole = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      const response = await userManagementService.updateRole(selectedRole._id, formData);
      setRoles(prev => prev.map(r => r._id === selectedRole._id ? (response?.data || response) : r));
      onEditModalClose();
      resetForm();
      toast({
        title: 'Success',
        description: 'Role updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await userManagementService.deleteRole(selectedRole._id);
      setRoles(prev => prev.filter(r => r._id !== selectedRole._id));
      onDeleteAlertClose();
      setSelectedRole(null);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setSelectedRole(null);
  };

  const openCreateModal = () => {
    resetForm();
    onCreateModalOpen();
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map(p => typeof p === 'string' ? p : p._id) || [],
    });
    onEditModalOpen();
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    onViewModalOpen();
  };

  const openDeleteAlert = (role: Role) => {
    setSelectedRole(role);
    onDeleteAlertOpen();
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return 'purple';
      case 'superadmin': return 'red';
      case 'treasurer': return 'blue';
      case 'secretary': return 'cyan';
      case 'member': return 'green';
      default: return 'gray';
    }
  };
  // Group permissions by category for better organization
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = (permission as any).resource || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <VStack spacing={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textColor}>Loading roles...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" p={6}>
      <Container maxW="7xl">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <VStack spacing={6} align="stretch">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="lg" color={headingColor} mb={2}>
                  Roles Management
                </Heading>
                <Text color={textColor}>
                  Manage user roles and permissions
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={loadData}
                  isLoading={loading}
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={openCreateModal}
                >
                  Create Role
                </Button>
              </HStack>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Roles</StatLabel>
                    <StatNumber>{roles.length}</StatNumber>
                    <StatHelpText>System roles defined</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Permissions</StatLabel>
                    <StatNumber>{permissions.length}</StatNumber>
                    <StatHelpText>Available permissions</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Permission Categories</StatLabel>
                    <StatNumber>{Object.keys(groupedPermissions).length}</StatNumber>
                    <StatHelpText>Resource categories</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Search */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardBody>
                <InputGroup maxW="400px">
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </CardBody>
            </Card>

            {/* Roles Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredRoles.map((role) => (
                <MotionBox
                  key={role._id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card bg={cardBg} shadow="sm" borderColor={borderColor} h="full">
                    <CardHeader>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Badge
                              colorScheme={getRoleColor(role.name)}
                              variant="solid"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="capitalize"
                            >
                              {role.name}
                            </Badge>
                            {(role as any).isSystemRole && (
                              <Badge colorScheme="gray" variant="outline" size="sm">
                                System
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color={textColor} noOfLines={2}>
                            {role.description || 'No description provided'}
                          </Text>
                        </VStack>

                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="More actions"
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiEye />}
                              onClick={() => openViewModal(role)}
                            >
                              View Details
                            </MenuItem>                            <MenuItem
                              icon={<FiEdit2 />}
                              onClick={() => openEditModal(role)}
                              isDisabled={(role as any).isSystemRole}
                            >
                              Edit Role
                            </MenuItem>
                            <Divider />
                            <MenuItem
                              icon={<FiTrash2 />}                              onClick={() => openDeleteAlert(role)}
                              color="red.600"
                              isDisabled={(role as any).isSystemRole}
                            >
                              Delete Role
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                            Permissions ({role.permissions?.length || 0})
                          </Text>                          <Wrap spacing={1}>
                            {role.permissions?.slice(0, 6).map((permission) => (
                              <WrapItem key={(permission as any)._id}>
                                <Tag size="sm" variant="subtle" colorScheme="blue">
                                  <TagLabel fontSize="xs">{(permission as any).name}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                            {(role.permissions?.length || 0) > 6 && (
                              <WrapItem>
                                <Tag size="sm" variant="outline">
                                  <TagLabel fontSize="xs">
                                    +{(role.permissions?.length || 0) - 6} more
                                  </TagLabel>
                                </Tag>
                              </WrapItem>
                            )}
                          </Wrap>
                        </Box>

                        <HStack spacing={2} w="full">
                          <Button
                            size="sm"
                            variant="outline"
                            flex={1}
                            onClick={() => openViewModal(role)}
                          >
                            View Details
                          </Button>
                          <Button                            size="sm"
                            colorScheme="brand"
                            flex={1}
                            onClick={() => openEditModal(role)}
                            isDisabled={(role as any).isSystemRole}
                          >
                            Edit
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              ))}
            </SimpleGrid>

            {filteredRoles.length === 0 && (
              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Text color={textColor} textAlign="center">
                      No roles found matching your search criteria
                    </Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="brand"
                      onClick={openCreateModal}
                    >
                      Create First Role
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </MotionBox>

        {/* Create Role Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Role</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Role Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Permissions</FormLabel>
                  <Box maxH="300px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={4}>
                    <VStack align="stretch" spacing={4}>
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <Box key={category}>
                          <Text fontWeight="semibold" mb={2} color={headingColor}>
                            {category}
                          </Text>
                          <CheckboxGroup
                            value={formData.permissions}
                            onChange={(values) => setFormData({ ...formData, permissions: values as string[] })}
                          >
                            <Stack spacing={2}>
                              {categoryPermissions.map((permission) => (
                                <Checkbox key={permission._id} value={permission._id}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">{permission.name}</Text>
                                    {permission.description && (
                                      <Text fontSize="xs" color={textColor}>
                                        {permission.description}
                                      </Text>
                                    )}
                                  </VStack>
                                </Checkbox>
                              ))}
                            </Stack>
                          </CheckboxGroup>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleCreateRole}
                isLoading={saving}
                loadingText="Creating..."
              >
                Create Role
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Role Modal */}
        <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Role</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Role Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Permissions</FormLabel>
                  <Box maxH="300px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={4}>
                    <VStack align="stretch" spacing={4}>
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <Box key={category}>
                          <Text fontWeight="semibold" mb={2} color={headingColor}>
                            {category}
                          </Text>
                          <CheckboxGroup
                            value={formData.permissions}
                            onChange={(values) => setFormData({ ...formData, permissions: values as string[] })}
                          >
                            <Stack spacing={2}>
                              {categoryPermissions.map((permission) => (
                                <Checkbox key={permission._id} value={permission._id}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">{permission.name}</Text>
                                    {permission.description && (
                                      <Text fontSize="xs" color={textColor}>
                                        {permission.description}
                                      </Text>
                                    )}
                                  </VStack>
                                </Checkbox>
                              ))}
                            </Stack>
                          </CheckboxGroup>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleEditRole}
                isLoading={saving}
                loadingText="Updating..."
              >
                Update Role
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View Role Modal */}
        <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Role Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedRole && (
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Badge
                      colorScheme={getRoleColor(selectedRole.name)}
                      variant="solid"
                      px={4}
                      py={2}
                      borderRadius="full"
                      textTransform="capitalize"
                      fontSize="md"
                    >
                      {selectedRole.name}
                    </Badge>                    {(selectedRole as any).isSystemRole && (
                      <Badge colorScheme="gray" variant="outline">
                        System Role
                      </Badge>
                    )}
                  </HStack>

                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>Description</Text>
                    <Text>{selectedRole.description || 'No description provided'}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color={textColor} mb={3}>
                      Permissions ({selectedRole.permissions?.length || 0})
                    </Text>
                    <VStack align="stretch" spacing={3}>
                      {Object.entries(                        selectedRole.permissions?.reduce((acc, permission) => {
                          const category = (permission as any).resource || 'General';
                          if (!acc[category]) {
                            acc[category] = [];
                          }
                          acc[category].push(permission as Permission);
                          return acc;
                        }, {} as Record<string, Permission[]>) || {}
                      ).map(([category, categoryPermissions]) => (
                        <Box key={category}>
                          <Text fontWeight="semibold" mb={2} color={headingColor}>
                            {category}
                          </Text>
                          <Wrap spacing={2}>                            {categoryPermissions.map((permission) => (
                              <WrapItem key={(permission as any)._id}>
                                <Tag colorScheme="blue" variant="subtle">
                                  <TagLabel>{(permission as any).name}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={onViewModalClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Role
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete the role "{selectedRole?.name}"? 
                This action cannot be undone and may affect users assigned to this role.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteRole} 
                  ml={3}
                  isLoading={saving}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default ModernRolesManagement;
