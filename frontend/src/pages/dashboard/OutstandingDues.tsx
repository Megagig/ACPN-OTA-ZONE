import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  FormControl,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Spinner,
  Center,
  Icon,
  useToast,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  ButtonGroup
} from '@chakra-ui/react';
import { 
  FaCalendarAlt,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaDownload,
  FaBell,
  FaPlus,
  FaMoneyBillWave
} from 'react-icons/fa';
import financialService from '../../services/financial.service';
import type { Due } from '../../types/financial.types';

interface OutstandingDue extends Due {
  pharmacyName?: string;
  daysPastDue: number;
  penaltyAmount: number;
  totalOwed: number;
}

const OutstandingDues: React.FC = () => {
  const [outstandingDues, setOutstandingDues] = useState<OutstandingDue[]>([]);
  const [filteredDues, setFilteredDues] = useState<OutstandingDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'penalty'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Chakra UI hooks
  const toast = useToast();
  
  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const filterAndSortDues = useCallback(() => {
    let filtered = [...outstandingDues];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (due) =>
          due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          due.pharmacyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((due) => {
        switch (filterStatus) {
          case 'critical':
            return due.daysPastDue > 60;
          case 'warning':
            return due.daysPastDue > 30 && due.daysPastDue <= 60;
          case 'recent':
            return due.daysPastDue <= 30;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalOwed - a.totalOwed;
        case 'date':
          return b.daysPastDue - a.daysPastDue;
        case 'penalty':
          return b.penaltyAmount - a.penaltyAmount;
        default:
          return 0;
      }
    });

    setFilteredDues(filtered);
    setCurrentPage(1);
  }, [outstandingDues, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    fetchOutstandingDues();
  }, []);

  useEffect(() => {
    filterAndSortDues();
  }, [filterAndSortDues]);

  const fetchOutstandingDues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overdue dues from the API
      const response = await financialService.getOverdueDues(1, 100);
      const overdues = response.dues || [];

      // Transform and enrich the data
      const enrichedDues: OutstandingDue[] = overdues.map((due: Due) => {
        const dueDate = new Date(due.dueDate);
        const today = new Date();
        const daysPastDue = Math.max(
          0,
          Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        // Calculate penalty based on days past due
        const penaltyRate = 0.05; // 5% penalty
        const penaltyAmount = daysPastDue > 30 ? due.amount * penaltyRate : 0;
        const totalOwed = due.amount + penaltyAmount;

        return {
          ...due,
          pharmacyName: `Pharmacy ${Math.floor(Math.random() * 1000)}`, // Mock pharmacy name
          daysPastDue,
          penaltyAmount,
          totalOwed,
        };
      });      setOutstandingDues(enrichedDues);
    } catch (err) {
      const errorMessage = 'Failed to fetch outstanding dues';
      setError(errorMessage);
      toast({
        title: 'Error Loading Data',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching outstanding dues:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSendReminder = async () => {
    try {
      // Mock API call for sending reminder
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Reminder Sent',
        description: 'Reminder sent successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddPenalty = async (dueId: string) => {
    const reason = prompt('Enter penalty reason:');
    if (!reason) return;

    const amount = prompt('Enter penalty amount:');
    if (!amount || isNaN(Number(amount))) return;

    try {
      await financialService.addPenaltyToDue(dueId, {
        amount: Number(amount),
        reason,
      });
      fetchOutstandingDues(); // Refresh data
      toast({
        title: 'Penalty Added',
        description: 'Penalty added successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add penalty',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Outstanding Dues Report'],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      [
        'Due Title',
        'Pharmacy',
        'Amount',
        'Due Date',
        'Days Past Due',
        'Penalty',
        'Total Owed',
        'Status',
      ],
      ...filteredDues.map((due) => [
        due.title,
        due.pharmacyName || '',
        `₦${due.amount.toLocaleString()}`,
        new Date(due.dueDate).toLocaleDateString(),
        due.daysPastDue.toString(),
        `₦${due.penaltyAmount.toLocaleString()}`,
        `₦${due.totalOwed.toLocaleString()}`,
        due.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outstanding-dues.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };  const getPriorityColorScheme = (daysPastDue: number) => {
    if (daysPastDue > 60) return 'red';
    if (daysPastDue > 30) return 'yellow';
    return 'green';
  };

  const getPriorityLabel = (daysPastDue: number) => {
    if (daysPastDue > 60) return 'Critical';
    if (daysPastDue > 30) return 'Warning';
    return 'Recent';
  };

  // Pagination
  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDues = filteredDues.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Summary statistics
  const totalOutstanding = filteredDues.reduce(
    (sum, due) => sum + due.totalOwed,
    0
  );
  const totalPenalties = filteredDues.reduce(
    (sum, due) => sum + due.penaltyAmount,
    0
  );
  const criticalCount = filteredDues.filter(
    (due) => due.daysPastDue > 60
  ).length;
  const averageDaysOverdue =
    filteredDues.length > 0
      ? filteredDues.reduce((sum, due) => sum + due.daysPastDue, 0) /
        filteredDues.length
      : 0;
  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="7xl" py={{ base: 4, md: 8 }}>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" fontWeight="medium">Loading outstanding dues...</Text>
              <Text color="gray.500" fontSize="sm">Please wait while data is being loaded.</Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="7xl" py={{ base: 4, md: 8 }}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={2} flex={1}>
              <AlertDescription>{error}</AlertDescription>
              <Button
                onClick={fetchOutstandingDues}
                colorScheme="red"
                size="sm"
                variant="outline"
              >
                Retry
              </Button>
            </VStack>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'start', md: 'center' }}
            gap={4}
          >
            <VStack align="start" spacing={2}>
              <Heading 
                size={{ base: 'lg', md: 'xl' }}
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
              >
                Outstanding Dues
              </Heading>
              <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                Monitor and manage overdue payments and penalties
              </Text>
            </VStack>
            <Button
              leftIcon={<Icon as={FaDownload} />}
              onClick={exportData}
              colorScheme="blue"
              variant="solid"
              size={{ base: 'sm', md: 'md' }}
            >
              Export Report
            </Button>
          </Flex>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <HStack spacing={3}>
                    <Icon as={FaExclamationTriangle} boxSize={8} color="red.500" />
                    <VStack align="start" spacing={1}>
                      <StatLabel color="gray.500" fontSize="sm">Total Outstanding</StatLabel>
                      <StatNumber color="red.500" fontSize={{ base: 'lg', md: 'xl' }}>
                        ₦{totalOutstanding.toLocaleString()}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <HStack spacing={3}>
                    <Icon as={FaMoneyBillWave} boxSize={8} color="yellow.500" />
                    <VStack align="start" spacing={1}>
                      <StatLabel color="gray.500" fontSize="sm">Total Penalties</StatLabel>
                      <StatNumber color="yellow.500" fontSize={{ base: 'lg', md: 'xl' }}>
                        ₦{totalPenalties.toLocaleString()}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <HStack spacing={3}>
                    <Icon as={FaExclamationTriangle} boxSize={8} color="red.500" />
                    <VStack align="start" spacing={1}>
                      <StatLabel color="gray.500" fontSize="sm">Critical Cases</StatLabel>
                      <StatNumber color="red.500" fontSize={{ base: 'lg', md: 'xl' }}>
                        {criticalCount}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <HStack spacing={3}>
                    <Icon as={FaCalendarAlt} boxSize={8} color="blue.500" />
                    <VStack align="start" spacing={1}>
                      <StatLabel color="gray.500" fontSize="sm">Avg Days Overdue</StatLabel>
                      <StatNumber color="blue.500" fontSize={{ base: 'lg', md: 'xl' }}>
                        {averageDaysOverdue.toFixed(0)}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters and Search */}
          <Card bg={cardBg} shadow="sm" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <FormControl>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search dues or pharmacy..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={borderColor}
                    />
                  </InputGroup>
                </FormControl>
                
                <FormControl>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={borderColor}
                  >
                    <option value="all">All Status</option>
                    <option value="critical">Critical (60+ days)</option>
                    <option value="warning">Warning (30-60 days)</option>
                    <option value="recent">Recent (0-30 days)</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <Select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'amount' | 'date' | 'penalty')
                    }
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={borderColor}
                  >
                    <option value="date">Sort by Days Overdue</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="penalty">Sort by Penalty</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <HStack spacing={2} justify="center">
                    <Icon as={FaFilter} color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      {filteredDues.length} of {outstandingDues.length} items
                    </Text>
                  </HStack>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>          {/* Outstanding Dues Table */}
          <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Due Details
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Pharmacy
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Amount
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Days Overdue
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Penalty
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Total Owed
                    </Th>
                    <Th fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedDues.map((due) => (
                    <Tr 
                      key={due._id}
                      _hover={{ 
                        bg: useColorModeValue('gray.50', 'gray.700'),
                        transform: 'translateY(-1px)',
                        shadow: 'sm'
                      }}
                      transition="all 0.2s"
                    >
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {due.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Due: {new Date(due.dueDate).toLocaleDateString()}
                          </Text>
                          <Badge
                            colorScheme={getPriorityColorScheme(due.daysPastDue)}
                            size="sm"
                            borderRadius="full"
                          >
                            {getPriorityLabel(due.daysPastDue)}
                          </Badge>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" noOfLines={1}>
                          {due.pharmacyName}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          ₦{due.amount.toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getPriorityColorScheme(due.daysPastDue)}
                          size="sm"
                          borderRadius="full"
                        >
                          {due.daysPastDue} days
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="red.500" fontWeight="medium">
                          ₦{due.penaltyAmount.toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="bold">
                          ₦{due.totalOwed.toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <ButtonGroup size="xs" spacing={1}>
                          <Button
                            leftIcon={<Icon as={FaBell} />}
                            onClick={() => handleSendReminder()}
                            colorScheme="blue"
                            variant="outline"
                            size="xs"
                          >
                            Remind
                          </Button>
                          <Button
                            leftIcon={<Icon as={FaPlus} />}
                            onClick={() => handleAddPenalty(due._id)}
                            colorScheme="red"
                            variant="outline"
                            size="xs"
                          >
                            Penalty
                          </Button>
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>            {/* Pagination */}
            {totalPages > 1 && (
              <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
                <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align="center" gap={4}>
                  {/* Mobile pagination */}
                  <Flex justify="space-between" w="full" display={{ base: 'flex', sm: 'none' }}>
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      isDisabled={currentPage === 1}
                      size="sm"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      isDisabled={currentPage === totalPages}
                      size="sm"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </Flex>
                  
                  {/* Desktop pagination */}
                  <Box display={{ base: 'none', sm: 'block' }}>
                    <Text fontSize="sm" color="gray.500">
                      Showing{' '}
                      <Text as="span" fontWeight="medium" color={useColorModeValue('gray.900', 'gray.100')}>
                        {startIndex + 1}
                      </Text>{' '}
                      to{' '}
                      <Text as="span" fontWeight="medium" color={useColorModeValue('gray.900', 'gray.100')}>
                        {Math.min(startIndex + itemsPerPage, filteredDues.length)}
                      </Text>{' '}
                      of{' '}
                      <Text as="span" fontWeight="medium" color={useColorModeValue('gray.900', 'gray.100')}>
                        {filteredDues.length}
                      </Text>{' '}
                      results
                    </Text>
                  </Box>
                  
                  <HStack spacing={0} display={{ base: 'none', sm: 'flex' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          size="sm"
                          variant={currentPage === pageNum ? "solid" : "outline"}
                          colorScheme={currentPage === pageNum ? "blue" : "gray"}
                          borderRadius="none"
                          _first={{ borderLeftRadius: "md" }}
                          _last={{ borderRightRadius: "md" }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </HStack>
                </Flex>
              </Box>
            )}
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default OutstandingDues;
