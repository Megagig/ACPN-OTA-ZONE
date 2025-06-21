import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useToast,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Divider,
  Flex,
  Container,
  Avatar,
  Checkbox,
  ButtonGroup,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import userManagementService from '../../services/userManagement.service';
import type { User } from '../../types/auth.types';
import type { Role } from '../../services/userManagement.service';

const MotionBox = motion(Box);

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newThisMonth: number;
}

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    newThisMonth: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Modal controls
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const { isOpen: isBulkDeleteAlertOpen, onOpen: onBulkDeleteAlertOpen, onClose: onBulkDeleteAlertClose } = useDisclosure();

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        userService.getUsers(),
        userManagementService.getRoles(),
      ]);

      const usersData = usersResponse.data || [];
      const rolesData = rolesResponse.data || [];

      setUsers(usersData);
      setRoles(rolesData);

      // Calculate stats
      const totalUsers = usersData.length;
      const activeUsers = usersData.filter((u: User) => u.status === 'active').length;
      const pendingUsers = usersData.filter((u: User) => u.status === 'pending').length;
      const suspendedUsers = usersData.filter((u: User) => u.status === 'suspended').length;
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      const newThisMonth = usersData.filter((u: User) => 
        u.createdAt && new Date(u.createdAt) > thisMonth
      ).length;

      setStats({
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        newThisMonth,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.pcnLicense?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: string) => {    try {
      setSaving(true);
      await userService.updateUser(userId, { status: newStatus });
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, status: newStatus } : u
      ));
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await userService.deleteUser(selectedUser._id);
      setUsers(prev => prev.filter(u => u._id !== selectedUser._id));
      onDeleteAlertClose();
      setSelectedUser(null);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk operations
  const handleBulkDelete = async () => {
    try {
      setSaving(true);
      await Promise.all(selectedUsers.map(userId => userService.deleteUser(userId)));
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u._id)));
      setSelectedUsers([]);
      onBulkDeleteAlertClose();
      toast({
        title: 'Success',
        description: `${selectedUsers.length} users deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error deleting users:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete users',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    onViewModalOpen();
  };

  const openDeleteAlert = (user: User) => {
    setSelectedUser(user);
    onDeleteAlertOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'superadmin': return 'red';
      case 'treasurer': return 'blue';
      case 'secretary': return 'cyan';
      default: return 'gray';
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <VStack spacing={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textColor}>Loading users...</Text>
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
                  Users Management
                </Heading>
                <Text color={textColor}>
                  Manage user accounts, roles, and permissions
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
                  leftIcon={<FiDownload />}
                  variant="outline"
                  colorScheme="gray"
                >
                  Export
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={() => navigate('/admin/users/create')}
                >
                  Add User
                </Button>
              </HStack>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6}>
              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Users</StatLabel>
                    <StatNumber>{stats.totalUsers}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Registered
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Active</StatLabel>
                    <StatNumber color="green.500">{stats.activeUsers}</StatNumber>
                    <StatHelpText>
                      {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Pending</StatLabel>
                    <StatNumber color="yellow.500">{stats.pendingUsers}</StatNumber>
                    <StatHelpText>Awaiting approval</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Suspended</StatLabel>
                    <StatNumber color="red.500">{stats.suspendedUsers}</StatNumber>
                    <StatHelpText>Restricted access</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>New This Month</StatLabel>
                    <StatNumber color="blue.500">{stats.newThisMonth}</StatNumber>
                    <StatHelpText>Recent registrations</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters and Bulk Actions */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={4} wrap="wrap" w="full">
                    <InputGroup maxW="300px">
                      <InputLeftElement>
                        <FiSearch />
                      </InputLeftElement>
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>

                    <Select
                      maxW="200px"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </Select>

                    <Select
                      maxW="200px"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </Select>

                    {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </HStack>

                  {/* Bulk Actions */}
                  {selectedUsers.length > 0 && (
                    <HStack spacing={3} w="full" p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium">
                        {selectedUsers.length} user(s) selected
                      </Text>
                      <ButtonGroup size="sm" spacing={2}>
                        <Button colorScheme="green" variant="outline">
                          Activate
                        </Button>
                        <Button colorScheme="yellow" variant="outline">
                          Suspend
                        </Button>
                        <Button 
                          colorScheme="red" 
                          variant="outline"
                          onClick={onBulkDeleteAlertOpen}
                        >
                          Delete
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => setSelectedUsers([])}
                        >
                          Clear
                        </Button>
                      </ButtonGroup>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Users Table */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md" color={headingColor}>
                    Users List ({filteredUsers.length})
                  </Heading>
                  {filteredUsers.length > 0 && (
                    <Checkbox
                      isChecked={selectedUsers.length === filteredUsers.length}
                      isIndeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    >
                      Select All
                    </Checkbox>
                  )}
                </HStack>
              </CardHeader>
              <CardBody>
                {filteredUsers.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Text color={textColor} textAlign="center">
                      No users found matching your criteria
                    </Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="brand"
                      onClick={() => navigate('/admin/users/create')}
                    >
                      Add First User
                    </Button>
                  </VStack>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Select</Th>
                          <Th>User</Th>
                          <Th>Contact</Th>
                          <Th>Role</Th>
                          <Th>Status</Th>
                          <Th>Joined</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredUsers.map((user) => (
                          <Tr key={user._id}>
                            <Td>
                              <Checkbox
                                isChecked={selectedUsers.includes(user._id)}
                                onChange={(e) => handleSelectUser(user._id, e.target.checked)}
                              />
                            </Td>
                            <Td>
                              <HStack spacing={3}>
                                <Avatar
                                  size="sm"
                                  name={`${user.firstName} ${user.lastName}`}
                                  src={user.profilePicture}
                                />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">
                                    {user.firstName} {user.lastName}
                                  </Text>
                                  {user.pcnLicense && (
                                    <Text fontSize="sm" color={textColor}>
                                      PCN: {user.pcnLicense}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm">{user.email}</Text>
                                {user.phone && (
                                  <Text fontSize="sm" color={textColor}>
                                    {user.phone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getRoleColor(user.role)}
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {user.role}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getStatusColor(user.status)}
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {user.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {user.createdAt 
                                  ? new Date(user.createdAt).toLocaleDateString()
                                  : 'N/A'
                                }
                              </Text>
                            </Td>
                            <Td>
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
                                    onClick={() => openViewModal(user)}
                                  >
                                    View Details
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FiEdit2 />}
                                    onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                                  >
                                    Edit User
                                  </MenuItem>
                                  <Divider />
                                  {user.status === 'pending' && (
                                    <MenuItem
                                      icon={<FiCheckCircle />}
                                      onClick={() => handleStatusChange(user._id, 'active')}
                                      color="green.600"
                                    >
                                      Approve
                                    </MenuItem>
                                  )}
                                  {user.status === 'active' && (
                                    <MenuItem
                                      icon={<FiXCircle />}
                                      onClick={() => handleStatusChange(user._id, 'suspended')}
                                      color="orange.600"
                                    >
                                      Suspend
                                    </MenuItem>
                                  )}
                                  {user.status === 'suspended' && (
                                    <MenuItem
                                      icon={<FiCheckCircle />}
                                      onClick={() => handleStatusChange(user._id, 'active')}
                                      color="green.600"
                                    >
                                      Reactivate
                                    </MenuItem>
                                  )}
                                  <Divider />
                                  <MenuItem
                                    icon={<FiTrash2 />}
                                    onClick={() => openDeleteAlert(user)}
                                    color="red.600"
                                  >
                                    Delete User
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </VStack>
        </MotionBox>

        {/* View User Modal */}
        <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>User Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedUser && (
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Avatar
                      size="lg"
                      name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      src={selectedUser.profilePicture}
                    />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="semibold">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={getRoleColor(selectedUser.role)} textTransform="capitalize">
                          {selectedUser.role}
                        </Badge>
                        <Badge colorScheme={getStatusColor(selectedUser.status)} textTransform="capitalize">
                          {selectedUser.status}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>

                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Email</Text>
                      <Text>{selectedUser.email}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Phone</Text>
                      <Text>{selectedUser.phone || 'Not provided'}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>PCN License</Text>
                      <Text>{selectedUser.pcnLicense || 'Not provided'}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Joined Date</Text>
                      <Text>
                        {selectedUser.createdAt 
                          ? new Date(selectedUser.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Last Login</Text>                      <Text>
                        {(selectedUser as any).lastLogin 
                          ? new Date((selectedUser as any).lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Email Verified</Text>
                      <Badge colorScheme={selectedUser.isEmailVerified ? 'green' : 'red'}>
                        {selectedUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </Box>
                  </SimpleGrid>
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
                Delete User
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? 
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteUser} 
                  ml={3}
                  isLoading={saving}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isBulkDeleteAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onBulkDeleteAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Multiple Users
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete {selectedUsers.length} selected users? 
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onBulkDeleteAlertClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleBulkDelete} 
                  ml={3}
                  isLoading={saving}
                >
                  Delete All
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default UsersManagement;
