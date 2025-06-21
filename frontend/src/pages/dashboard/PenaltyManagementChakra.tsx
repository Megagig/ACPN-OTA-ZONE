import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Alert,
  SimpleGrid,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { 
  SearchIcon,
  RepeatIcon,
  AddIcon,
} from '@chakra-ui/icons';
import { FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import type { PharmacyDue } from '../../types/pharmacy.types';
import financialService from '../../services/financial.service';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface PenaltyForm {
  dueId: string;
  amount: number;
  reason: string;
}

const PenaltyManagementChakra: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dues, setDues] = useState<PharmacyDue[]>([]);
  const [filteredDues, setFilteredDues] = useState<PharmacyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDue, setSelectedDue] = useState<PharmacyDue | null>(null);
  const [penaltyForm, setPenaltyForm] = useState<PenaltyForm>({
    dueId: '',
    amount: 0,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const tableBgAlt = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    fetchDues();
  }, []);

  useEffect(() => {
    filterDues();
  }, [dues, searchTerm, filterStatus]);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const response = await financialService.getRealDues();
      setDues((response.dues || []) as any[]);
    } catch (err) {
      console.error('Failed to fetch dues:', err);
      toast({
        title: 'Error',
        description: 'Failed to load dues',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDues = () => {
    let filtered = dues;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (due) =>
          due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          due.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((due) => due.paymentStatus === filterStatus);
    }

    setFilteredDues(filtered);
  };

  const openPenaltyModal = (due: PharmacyDue) => {
    setSelectedDue(due);
    setPenaltyForm({
      dueId: due._id,
      amount: 0,
      reason: '',
    });
    onOpen();
  };

  const closePenaltyModal = () => {
    onClose();
    setSelectedDue(null);
    setPenaltyForm({ dueId: '', amount: 0, reason: '' });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setPenaltyForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handlePenaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.amount || !penaltyForm.reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      await financialService.addPenaltyToDue(penaltyForm.dueId, {
        amount: penaltyForm.amount,
        reason: penaltyForm.reason,
      });

      toast({
        title: 'Success',
        description: 'Penalty added successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      closePenaltyModal();
      await fetchDues(); // Refresh the dues list
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add penalty';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      paid: 'green',
      overdue: 'red',
      partially_paid: 'blue',
    };

    return (
      <Badge
        colorScheme={statusColors[status] || 'gray'}
        textTransform="uppercase"
        px={2}
        py={1}
        borderRadius="full"
        fontSize="xs"
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={6}>
        {/* Header */}
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>
            Penalty Management
          </Heading>
          <Text color={mutedColor}>
            Add penalties to existing dues for late payments or violations
          </Text>
        </Box>

        {/* Filters */}
        <Card mb={6} bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FaFilter} mr={2} color="blue.500" />
              <Heading size="md">Filters</Heading>
            </Flex>
          </CardHeader>
          
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Search Dues</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Filter by Status</FormLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>&nbsp;</FormLabel>
                <Button
                  leftIcon={<RepeatIcon />}
                  colorScheme="blue"
                  w="full"
                  onClick={fetchDues}
                >
                  Refresh
                </Button>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Dues List */}
        <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="md">
              Dues Available for Penalty Assignment ({filteredDues.length})
            </Heading>
          </CardHeader>

          <CardBody p={0}>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="xl" thickness="4px" color="blue.500" />
              </Flex>
            ) : filteredDues.length === 0 ? (
              <Box p={6} textAlign="center">
                <Icon as={FaExclamationTriangle} boxSize={12} color="gray.400" mb={4} />
                <Heading as="h3" size="md" mb={2}>
                  No dues found
                </Heading>
                <Text color={mutedColor}>
                  No dues found matching your criteria.
                </Text>
              </Box>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead bg={tableBgAlt}>
                    <Tr>
                      <Th>Due Details</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Due Date</Th>
                      <Th>Current Penalties</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredDues.map((due) => (
                      <Tr 
                        key={due._id}
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                        transition="background-color 0.2s"
                      >
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{due.title}</Text>
                            {due.description && (
                              <Text fontSize="sm" color={mutedColor}>
                                {due.description}
                              </Text>
                            )}
                            <Text fontSize="xs" color={mutedColor}>
                              {typeof due.dueTypeId === 'object'
                                ? due.dueTypeId.name
                                : 'N/A'}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text>{formatCurrency(due.totalAmount)}</Text>
                          <Text fontSize="xs" color={mutedColor}>
                            Paid: {formatCurrency(due.amountPaid)}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            Balance: {formatCurrency(due.balance)}
                          </Text>
                        </Td>
                        <Td>{getStatusBadge(due.paymentStatus)}</Td>
                        <Td>{formatDate(due.dueDate)}</Td>
                        <Td>
                          <Text>{due.penalties.length} penalties</Text>
                          <Text fontSize="xs" color={mutedColor}>
                            Total:{' '}
                            {formatCurrency(
                              due.penalties.reduce(
                                (sum, penalty) => sum + penalty.amount,
                                0
                              )
                            )}
                          </Text>
                        </Td>
                        <Td>
                          <Button
                            leftIcon={<AddIcon />}
                            colorScheme="red"
                            size="sm"
                            onClick={() => openPenaltyModal(due)}
                          >
                            Add Penalty
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>

        {/* Penalty Modal */}
        <Modal isOpen={isOpen} onClose={closePenaltyModal}>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handlePenaltySubmit}>
            <ModalHeader>Add Penalty</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedDue && (
                <Alert status="info" mb={4} borderRadius="md">
                  <VStack align="start" spacing={1} w="full">
                    <Text fontWeight="medium">{selectedDue.title}</Text>
                    <Text fontSize="sm">
                      Current Total: {formatCurrency(selectedDue.totalAmount)}
                    </Text>
                    <Text fontSize="sm">
                      Existing Penalties: {selectedDue.penalties.length}
                    </Text>
                  </VStack>
                </Alert>
              )}

              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Penalty Amount (₦)</FormLabel>
                  <Input
                    type="number"
                    name="amount"
                    value={penaltyForm.amount || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter penalty amount"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Reason for Penalty</FormLabel>
                  <Textarea
                    name="reason"
                    value={penaltyForm.reason}
                    onChange={handleInputChange}
                    placeholder="Explain why this penalty is being added..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" mr={3} onClick={closePenaltyModal}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                type="submit"
                isLoading={submitting}
                loadingText="Adding..."
              >
                Add Penalty
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};

export default PenaltyManagementChakra;
