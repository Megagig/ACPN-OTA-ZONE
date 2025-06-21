import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useDisclosure,
  Card,
  CardBody,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Switch,
  useToast,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import {
  FiBell,
  FiSearch,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSend,
  FiClock,
  FiEye,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipients: string[];
  sentAt: string;
  readCount: number;
  totalRecipients: number;
  status: 'sent' | 'scheduled' | 'draft';
  createdBy: string;
  category: 'announcement' | 'reminder' | 'alert' | 'system';
}

const ModernNotificationsManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Mock data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Monthly Dues Reminder',
      message: 'Dear members, this is a reminder that your monthly dues are due by the end of this month.',
      type: 'warning',
      recipients: ['all_members'],
      sentAt: '2024-01-15T10:30:00Z',
      readCount: 45,
      totalRecipients: 60,
      status: 'sent',
      createdBy: 'Admin User',
      category: 'reminder',
    },
    {
      id: '2',
      title: 'Annual General Meeting',
      message: 'The Annual General Meeting will be held on February 15th, 2024 at 2:00 PM.',
      type: 'info',
      recipients: ['all_members'],
      sentAt: '2024-01-10T14:00:00Z',
      readCount: 52,
      totalRecipients: 60,
      status: 'sent',
      createdBy: 'Secretary',
      category: 'announcement',
    },
    {
      id: '3',
      title: 'System Maintenance Notice',
      message: 'The system will be under maintenance on January 20th from 2:00 AM to 4:00 AM.',
      type: 'error',
      recipients: ['all_users'],
      sentAt: '2024-01-18T09:00:00Z',
      readCount: 38,
      totalRecipients: 65,
      status: 'sent',
      createdBy: 'System Admin',
      category: 'system',
    },
    {
      id: '4',
      title: 'New Member Welcome',
      message: 'Welcome our new members who joined this month!',
      type: 'success',
      recipients: ['new_members'],
      sentAt: '',
      readCount: 0,
      totalRecipients: 5,
      status: 'draft',
      createdBy: 'Admin User',
      category: 'announcement',
    },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  };

  const handleCreateNotification = () => {
    setSelectedNotification(null);
    onCreateOpen();
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    onEditOpen();
  };

  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    onDeleteOpen();
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    onViewOpen();
  };

  const confirmDelete = () => {
    if (selectedNotification) {
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      toast({
        title: 'Notification deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onDeleteClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'green';
      case 'scheduled': return 'blue';
      case 'draft': return 'gray';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    drafts: notifications.filter(n => n.status === 'draft').length,
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      p={8}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={2}>
          <Heading size="lg" color={headingColor}>
            Notifications Management
          </Heading>
          <Text color={textColor}>
            Manage and send notifications to users
          </Text>
        </VStack>
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="brand"
          size="lg"
          onClick={handleCreateNotification}
        >
          Create Notification
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardBody>
            <Flex align="center">
              <Box p={3} borderRadius="lg" bg="blue.100" mr={4}>
                <Icon as={FiBell} color="blue.500" fontSize="24" />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                  {stats.total}
                </Text>
                <Text color={textColor} fontSize="sm">
                  Total Notifications
                </Text>
              </VStack>
            </Flex>
          </CardBody>
        </MotionCard>

        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardBody>
            <Flex align="center">
              <Box p={3} borderRadius="lg" bg="green.100" mr={4}>
                <Icon as={FiCheck} color="green.500" fontSize="24" />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                  {stats.sent}
                </Text>
                <Text color={textColor} fontSize="sm">
                  Sent
                </Text>
              </VStack>
            </Flex>
          </CardBody>
        </MotionCard>

        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardBody>
            <Flex align="center">
              <Box p={3} borderRadius="lg" bg="blue.100" mr={4}>
                <Icon as={FiClock} color="blue.500" fontSize="24" />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                  {stats.scheduled}
                </Text>
                <Text color={textColor} fontSize="sm">
                  Scheduled
                </Text>
              </VStack>
            </Flex>
          </CardBody>
        </MotionCard>

        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardBody>
            <Flex align="center">
              <Box p={3} borderRadius="lg" bg="gray.100" mr={4}>
                <Icon as={FiEdit} color="gray.500" fontSize="24" />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                  {stats.drafts}
                </Text>
                <Text color={textColor} fontSize="sm">
                  Drafts
                </Text>
              </VStack>
            </Flex>
          </CardBody>
        </MotionCard>
      </SimpleGrid>

      {/* Filters and Search */}
      <Card bg={bg} border="1px" borderColor={borderColor} mb={6}>
        <CardBody>
          <Flex gap={4} align="center" wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <Icon as={FiSearch} color={textColor} />
              </InputLeftElement>
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <Select
              maxW="150px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </Select>

            <Select
              maxW="150px"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </Select>

            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={fetchNotifications}
              isLoading={loading}
            >
              Refresh
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Notifications Table */}
      <Card bg={bg} border="1px" borderColor={borderColor}>
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox
                        isChecked={selectedNotifications.length === filteredNotifications.length}
                        isIndeterminate={selectedNotifications.length > 0 && selectedNotifications.length < filteredNotifications.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications(filteredNotifications.map(n => n.id));
                          } else {
                            setSelectedNotifications([]);
                          }
                        }}
                      />
                    </Th>
                    <Th>Notification</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Recipients</Th>
                    <Th>Read Rate</Th>
                    <Th>Created By</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredNotifications.map((notification) => (
                    <Tr key={notification.id}>
                      <Td>
                        <Checkbox
                          isChecked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            } else {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                        />
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="600" noOfLines={1}>
                            {notification.title}
                          </Text>
                          <Text fontSize="sm" color={textColor} noOfLines={2}>
                            {notification.message}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getTypeColor(notification.type)} variant="subtle">
                          {notification.type}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(notification.status)} variant="subtle">
                          {notification.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontWeight="600">{notification.totalRecipients}</Text>
                      </Td>
                      <Td>
                        {notification.status === 'sent' && (
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm">
                              {notification.readCount}/{notification.totalRecipients}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                              {Math.round((notification.readCount / notification.totalRecipients) * 100)}% read
                            </Text>
                          </VStack>
                        )}
                      </Td>
                      <Td>
                        <Text fontSize="sm">{notification.createdBy}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {notification.sentAt ? new Date(notification.sentAt).toLocaleDateString() : '-'}
                        </Text>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiEye />}
                              onClick={() => handleViewNotification(notification)}
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              icon={<FiEdit />}
                              onClick={() => handleEditNotification(notification)}
                            >
                              Edit
                            </MenuItem>
                            {notification.status === 'draft' && (
                              <MenuItem icon={<FiSend />}>
                                Send Now
                              </MenuItem>
                            )}
                            <Divider />
                            <MenuItem
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={() => handleDeleteNotification(notification)}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Notification Modal */}
      <Modal isOpen={isCreateOpen || isEditOpen} onClose={isCreateOpen ? onCreateClose : onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isCreateOpen ? 'Create New Notification' : 'Edit Notification'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input placeholder="Enter notification title" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Message</FormLabel>
                <Textarea
                  placeholder="Enter notification message"
                  rows={4}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Recipients</FormLabel>
                <CheckboxGroup>
                  <VStack align="start">
                    <Checkbox value="all_members">All Members</Checkbox>
                    <Checkbox value="admins">Administrators</Checkbox>
                    <Checkbox value="pharmacists">Pharmacists</Checkbox>
                    <Checkbox value="new_members">New Members</Checkbox>
                  </VStack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Schedule</FormLabel>
                <HStack>
                  <Switch />
                  <Text>Schedule for later</Text>
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={isCreateOpen ? onCreateClose : onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="brand">
              {isCreateOpen ? 'Create' : 'Update'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Notification Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Notification Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNotification && (
              <VStack spacing={4} align="start">
                <Box>
                  <Text fontWeight="600" mb={2}>Title</Text>
                  <Text>{selectedNotification.title}</Text>
                </Box>
                <Box>
                  <Text fontWeight="600" mb={2}>Message</Text>
                  <Text>{selectedNotification.message}</Text>
                </Box>
                <Flex gap={4}>
                  <Box>
                    <Text fontWeight="600" mb={2}>Type</Text>
                    <Badge colorScheme={getTypeColor(selectedNotification.type)}>
                      {selectedNotification.type}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="600" mb={2}>Status</Text>
                    <Badge colorScheme={getStatusColor(selectedNotification.status)}>
                      {selectedNotification.status}
                    </Badge>
                  </Box>
                </Flex>
                <Box>
                  <Text fontWeight="600" mb={2}>Recipients</Text>
                  <Text>{selectedNotification.totalRecipients} users</Text>
                </Box>
                {selectedNotification.status === 'sent' && (
                  <Box>
                    <Text fontWeight="600" mb={2}>Read Statistics</Text>
                    <Text>
                      {selectedNotification.readCount} of {selectedNotification.totalRecipients} recipients have read this notification
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Notification
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </MotionBox>
  );
};

export default ModernNotificationsManagement;
