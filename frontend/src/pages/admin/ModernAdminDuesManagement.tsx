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
  Thead,  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  FormControl,
  FormLabel,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,  Textarea,
  InputGroup,
  InputLeftElement,
  Flex,
  Container,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiEye,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy } from '../../types/pharmacy.types';
import type { DueType } from '../../types/pharmacy.types';

const MotionBox = motion(Box);

interface Due {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  paymentStatus: string;
  pharmacyId: string;
  year: number;
  pharmacy?: Pharmacy;
  dueType?: DueType;
}

interface DueFormData {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  pharmacyId: string;
  dueTypeId: string;
  year: number;
}

const ModernAdminDuesManagement: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dues, setDues] = useState<Due[]>([]);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

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

  // Form state
  const [formData, setFormData] = useState<DueFormData>({
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    pharmacyId: '',
    dueTypeId: '',
    year: new Date().getFullYear(),
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [duesRes, dueTypesRes, pharmaciesRes] = await Promise.all([
        api.get('/admin/dues'),
        api.get('/admin/due-types'),
        pharmacyService.getPharmacies(),
      ]);

      setDues(duesRes.data.data || []);
      setDueTypes(dueTypesRes.data.data || []);
      setPharmacies(pharmaciesRes?.pharmacies || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dues data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter dues
  const filteredDues = dues.filter((due) => {
    const matchesSearch = due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.pharmacy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || due.paymentStatus === statusFilter;
    const matchesYear = yearFilter === 'all' || due.year.toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Calculate statistics
  const stats = {
    total: dues.length,
    paid: dues.filter(d => d.paymentStatus === 'paid').length,
    pending: dues.filter(d => d.paymentStatus === 'pending').length,
    overdue: dues.filter(d => d.paymentStatus === 'overdue').length,
    totalAmount: dues.reduce((sum, due) => sum + due.amount, 0),
    paidAmount: dues.filter(d => d.paymentStatus === 'paid').reduce((sum, due) => sum + due.amount, 0),
  };

  // Handle create due
  const handleCreateDue = async () => {
    try {
      setSaving(true);
      const response = await api.post('/admin/dues', formData);
      
      if (response.data.success) {
        setDues(prev => [response.data.data, ...prev]);
        onCreateModalClose();
        resetForm();
        toast({
          title: 'Success',
          description: 'Due created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error creating due:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create due',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit due
  const handleEditDue = async () => {
    if (!selectedDue) return;

    try {
      setSaving(true);
      const response = await api.put(`/admin/dues/${selectedDue._id}`, formData);
      
      if (response.data.success) {
        setDues(prev => prev.map(due => 
          due._id === selectedDue._id ? response.data.data : due
        ));
        onEditModalClose();
        resetForm();
        toast({
          title: 'Success',
          description: 'Due updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error updating due:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update due',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete due
  const handleDeleteDue = async (dueId: string) => {
    if (!confirm('Are you sure you want to delete this due?')) return;

    try {
      await api.delete(`/admin/dues/${dueId}`);
      setDues(prev => prev.filter(due => due._id !== dueId));
      toast({
        title: 'Success',
        description: 'Due deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting due:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete due',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: 0,
      dueDate: '',
      pharmacyId: '',
      dueTypeId: '',
      year: new Date().getFullYear(),
    });
    setSelectedDue(null);
  };

  const openEditModal = (due: Due) => {
    setSelectedDue(due);
    setFormData({
      title: due.title,
      description: due.description || '',
      amount: due.amount,
      dueDate: due.dueDate.split('T')[0],
      pharmacyId: due.pharmacyId,
      dueTypeId: (due as any).dueTypeId || '',
      year: due.year,
    });
    onEditModalOpen();
  };

  const openViewModal = (due: Due) => {
    setSelectedDue(due);
    onViewModalOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <VStack spacing={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textColor}>Loading dues management...</Text>
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
                  Dues Management
                </Heading>
                <Text color={textColor}>
                  Manage and track membership dues and payments
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={loadData}
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
                  onClick={onCreateModalOpen}
                >
                  Create Due
                </Button>
              </HStack>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Dues</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Active dues
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Paid</StatLabel>
                    <StatNumber color="green.500">{stats.paid}</StatNumber>
                    <StatHelpText>
                      {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}% completion
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Pending</StatLabel>
                    <StatNumber color="yellow.500">{stats.pending}</StatNumber>
                    <StatHelpText>Awaiting payment</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Amount</StatLabel>
                    <StatNumber>₦{stats.totalAmount.toLocaleString()}</StatNumber>
                    <StatHelpText>
                      ₦{stats.paidAmount.toLocaleString()} collected
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4} wrap="wrap">
                  <InputGroup maxW="300px">
                    <InputLeftElement>
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder="Search dues or pharmacies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    maxW="200px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </Select>

                  <Select
                    maxW="150px"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return <option key={year} value={year.toString()}>{year}</option>;
                    })}
                  </Select>

                  {(searchTerm || statusFilter !== 'all' || yearFilter !== 'all') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setYearFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </HStack>
              </CardBody>
            </Card>

            {/* Dues Table */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md" color={headingColor}>
                  Dues List ({filteredDues.length})
                </Heading>
              </CardHeader>
              <CardBody>
                {filteredDues.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Text color={textColor} textAlign="center">
                      No dues found matching your criteria
                    </Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="brand"
                      onClick={onCreateModalOpen}
                    >
                      Create First Due
                    </Button>
                  </VStack>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Pharmacy</Th>
                          <Th>Amount</Th>
                          <Th>Due Date</Th>
                          <Th>Status</Th>
                          <Th>Year</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredDues.map((due) => (
                          <Tr key={due._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{due.title}</Text>
                                {due.description && (
                                  <Text fontSize="sm" color={textColor} noOfLines={1}>
                                    {due.description}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Text>{due.pharmacy?.name || 'Unknown Pharmacy'}</Text>
                            </Td>
                            <Td>
                              <Text fontWeight="semibold">
                                ₦{due.amount.toLocaleString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text>
                                {new Date(due.dueDate).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getStatusColor(due.paymentStatus)}
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {due.paymentStatus}
                              </Badge>
                            </Td>
                            <Td>
                              <Text>{due.year}</Text>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="View due"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openViewModal(due)}
                                />
                                <IconButton
                                  aria-label="Edit due"
                                  icon={<FiEdit2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => openEditModal(due)}
                                />
                                <IconButton
                                  aria-label="Delete due"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteDue(due._id)}
                                />
                              </HStack>
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

        {/* Create Due Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Due</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Due Type</FormLabel>
                  <Select
                    value={formData.dueTypeId}
                    onChange={(e) => {
                      const selectedType = dueTypes.find(dt => dt._id === e.target.value);
                      setFormData({
                        ...formData,
                        dueTypeId: e.target.value,
                        title: selectedType?.name || '',
                        amount: selectedType?.defaultAmount || (selectedType as any).amount || 0,
                      });
                    }}
                  >
                    <option value="">Select due type</option>
                    {dueTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name} - ₦{(type as any).amount?.toLocaleString() || '0'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount (₦)</FormLabel>
                  <NumberInput
                    value={formData.amount}
                    onChange={(_, value) => setFormData({ ...formData, amount: value || 0 })}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Pharmacy</FormLabel>
                  <Select
                    value={formData.pharmacyId}
                    onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                  >
                    <option value="">Select pharmacy</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Due Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Year</FormLabel>
                    <NumberInput
                      value={formData.year}
                      onChange={(_, value) => setFormData({ ...formData, year: value || new Date().getFullYear() })}
                      min={2020}
                      max={2030}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleCreateDue}
                isLoading={saving}
                loadingText="Creating..."
              >
                Create Due
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Due Modal */}
        <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Due</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount (₦)</FormLabel>
                  <NumberInput
                    value={formData.amount}
                    onChange={(_, value) => setFormData({ ...formData, amount: value || 0 })}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Due Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Year</FormLabel>
                    <NumberInput
                      value={formData.year}
                      onChange={(_, value) => setFormData({ ...formData, year: value || new Date().getFullYear() })}
                      min={2020}
                      max={2030}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleEditDue}
                isLoading={saving}
                loadingText="Updating..."
              >
                Update Due
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View Due Modal */}
        <Modal isOpen={isViewModalOpen} onClose={onViewModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Due Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedDue && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>Title</Text>
                    <Text fontWeight="semibold">{selectedDue.title}</Text>
                  </Box>

                  {selectedDue.description && (
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Description</Text>
                      <Text>{selectedDue.description}</Text>
                    </Box>
                  )}

                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Amount</Text>
                      <Text fontWeight="semibold" fontSize="lg">
                        ₦{selectedDue.amount.toLocaleString()}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Status</Text>
                      <Badge
                        colorScheme={getStatusColor(selectedDue.paymentStatus)}
                        variant="subtle"
                        textTransform="capitalize"
                      >
                        {selectedDue.paymentStatus}
                      </Badge>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Due Date</Text>
                      <Text>{new Date(selectedDue.dueDate).toLocaleDateString()}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Year</Text>
                      <Text>{selectedDue.year}</Text>
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>Pharmacy</Text>
                    <Text>{selectedDue.pharmacy?.name || 'Unknown Pharmacy'}</Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={onViewModalClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default ModernAdminDuesManagement;
