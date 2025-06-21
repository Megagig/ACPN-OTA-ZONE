import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Select,
  Grid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  Flex,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import financialService from '../../services/financial.service';
import type { FinancialRecord } from '../../types/financial.types';

const TransactionList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page, pagination.limit]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const response = await financialService.getFinancialRecords(params);

      // For demonstration purposes, we're using the returned data directly
      // In a real API, you would typically get pagination info in the response
      setTransactions(response);
      setPagination((prev) => ({
        ...prev,
        total: response.length, // This should come from API in real implementation
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'green' : 'red';
  };

  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
        >
          <Heading size="lg" color="gray.800">
            Financial Transactions
          </Heading>
          <Button
            colorScheme="blue"
            leftIcon={<Icon as={FaPlus} />}
            onClick={() => navigate('/finances/transactions/new')}
          >
            Add Transaction
          </Button>
        </Flex>

        {/* Filters Card */}
        <Card bg={cardBg} shadow="md">
          <CardHeader>
            <Heading size="md">Filters</Heading>
          </CardHeader>
          <CardBody>
            <Box as="form" onSubmit={handleSearch}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={4}>
                <FormControl>
                  <FormLabel htmlFor="search">Search</FormLabel>
                  <Input
                    id="search"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search title or description..."
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="type">Type</FormLabel>
                  <Select
                    id="type"
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    bg="white"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="category">Category</FormLabel>
                  <Select
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    bg="white"
                  >
                    <option value="all">All Categories</option>
                    <option value="dues">Dues</option>
                    <option value="donation">Donation</option>
                    <option value="event">Event</option>
                    <option value="administrative">Administrative</option>
                    <option value="utility">Utility</option>
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="miscellaneous">Miscellaneous</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <Select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    bg="white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="startDate">Start Date</FormLabel>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="endDate">End Date</FormLabel>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    bg="white"
                  />
                </FormControl>
              </Grid>

              <Flex justify="flex-end" gap={2}>
                <Button
                  variant="outline"
                  leftIcon={<Icon as={FaTimes} />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={<Icon as={FaSearch} />}
                >
                  Apply Filters
                </Button>
              </Flex>
            </Box>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        <Card bg={cardBg} shadow="lg" overflow="hidden">
          <TableContainer>
            <Table variant="simple" bg={tableBg}>
              <Thead bg={headerBg}>
                <Tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Category</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <Text color="gray.500">No transactions found</Text>
                    </Td>
                  </Tr>
                ) : (
                  transactions.map((transaction) => (
                    <Tr 
                      key={transaction._id} 
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                    >
                      <Td fontWeight="medium">{transaction.title}</Td>
                      <Td>
                        <Badge 
                          colorScheme={getTypeColor(transaction.type)} 
                          variant="subtle"
                        >
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </Badge>
                      </Td>
                      <Td textTransform="capitalize">{transaction.category}</Td>
                      <Td>{formatDate(transaction.date)}</Td>
                      <Td 
                        fontWeight="medium"
                        color={transaction.type === 'income' ? 'green.600' : 'red.600'}
                      >
                        {formatCurrency(transaction.amount)}
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={getStatusColor(transaction.status)} 
                          variant="subtle"
                          textTransform="capitalize"
                        >
                          {transaction.status}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <HStack spacing={1} justify="flex-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => navigate(`/finances/transactions/${transaction._id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            onClick={() => navigate(`/finances/transactions/${transaction._id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this transaction?')) {
                                financialService
                                  .deleteFinancialRecord(transaction._id)
                                  .then(() => {
                                    fetchTransactions();
                                  })
                                  .catch((err) => {
                                    console.error('Error deleting transaction:', err);
                                    alert('Failed to delete transaction');
                                  });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <Box p={4} borderTop="1px" borderColor="gray.200">
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  Showing{' '}
                  {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}{' '}
                  to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                  of {pagination.total} results
                </Text>
                
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    isDisabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  
                  <Text fontSize="sm" px={2}>
                    Page {pagination.page}
                  </Text>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    isDisabled={pagination.page * pagination.limit >= pagination.total}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            </Box>
          )}
        </Card>
      </VStack>
    </Container>
  );
};

export default TransactionList;
