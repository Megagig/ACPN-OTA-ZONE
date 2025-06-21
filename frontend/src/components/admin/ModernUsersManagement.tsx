import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Avatar,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Card,
  CardBody,
  SimpleGrid,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ModernTable from '../../components/ui/ModernTable';
import StatsCard from '../../components/dashboard/StatsCard';

// Mock data - replace with actual API calls
const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'member',
    status: 'active',
    isApproved: true,
    createdAt: '2024-01-15',
    pharmacy: { name: 'City Pharmacy' },
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'admin',
    status: 'active',
    isApproved: true,
    createdAt: '2024-01-10',
    pharmacy: { name: 'Health Plus Pharmacy' },
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    role: 'member',
    status: 'pending',
    isApproved: false,
    createdAt: '2024-01-20',
    pharmacy: { name: 'Community Pharmacy' },
  },
  // Add more mock data as needed
];

const ModernUsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const [users, setUsers] = useState(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');

  // Stats calculation
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
  };

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.pharmacy?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const columns = [    {
      key: 'avatar',
      label: 'Avatar',
      render: (_: any, row: any) => (
        <Avatar
          size="sm"
          name={`${row.firstName} ${row.lastName}`}
          src={row.profilePicture}
        />
      ),
    },{
      key: 'name',
      label: 'Name',
      render: (_: any, row: any) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="600">{`${row.firstName} ${row.lastName}`}</Text>
          <Text fontSize="sm" color="gray.500">{row.email}</Text>
        </VStack>
      ),
    },
    {
      key: 'pharmacy',
      label: 'Pharmacy',
      render: (_: any, row: any) => (
        <Text fontSize="sm">{row.pharmacy?.name || 'N/A'}</Text>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <Badge
          colorScheme={value === 'admin' ? 'purple' : value === 'member' ? 'blue' : 'gray'}
          variant="subtle"
          textTransform="capitalize"
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge
          colorScheme={
            value === 'active' ? 'green' :
            value === 'pending' ? 'yellow' :
            value === 'inactive' ? 'red' : 'gray'
          }
          variant="subtle"
          textTransform="capitalize"
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'isApproved',
      label: 'Approved',
      render: (value: boolean) => (
        <Badge
          colorScheme={value ? 'green' : 'red'}
          variant="subtle"
        >
          {value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value: string) => (
        <Text fontSize="sm">{new Date(value).toLocaleDateString()}</Text>
      ),
    },
  ];

  const actions = [
    {
      label: 'View Details',
      icon: <FiEye />,
      onClick: (user: any) => navigate(`/admin/users/${user.id}`),
    },
    {
      label: 'Edit User',
      icon: <FiEdit />,
      onClick: (user: any) => navigate(`/admin/users/${user.id}/edit`),
    },
    {
      label: 'Delete User',
      icon: <FiTrash2 />,
      color: 'red.500',
      onClick: (user: any) => {
        setSelectedUser(user);
        onOpen();
      },
    },
  ];

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onClose();
      setSelectedUser(null);
    }
  };

  const handleExportUsers = () => {
    // Implement export functionality
    toast({
      title: 'Export started',
      description: 'User data export has been initiated.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={1}>
          <Heading size="xl">User Management</Heading>
          <Text color="gray.500">
            Manage and monitor all registered users
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            onClick={handleExportUsers}
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

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          iconColor="blue.500"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon={FiUserCheck}
          iconColor="green.500"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingUsers}
          icon={FiClock}
          iconColor="yellow.500"
        />
        <StatsCard
          title="Administrators"
          value={stats.adminUsers}
          icon={FiUserX}
          iconColor="purple.500"
        />
      </SimpleGrid>

      {/* Filters and Search */}
      <Card bg={cardBg} mb={6} borderRadius="xl">
        <CardBody>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
          >
            <InputGroup maxW={{ base: 'full', md: '300px' }}>
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
              maxW={{ base: 'full', md: '200px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </Select>
            
            <Select
              maxW={{ base: 'full', md: '200px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="treasurer">Treasurer</option>
              <option value="secretary">Secretary</option>
            </Select>
          </Flex>
        </CardBody>
      </Card>

      {/* Users Table */}
      <ModernTable
        title={`Users (${filteredUsers.length})`}
        columns={columns}
        data={filteredUsers}
        actions={actions}
        loading={loading}
        emptyMessage="No users found"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete User
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete{' '}
              <Text as="span" fontWeight="bold">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </Text>
              ? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteUser}
                ml={3}
                isLoading={loading}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ModernUsersManagement;
