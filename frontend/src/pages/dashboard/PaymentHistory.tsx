import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Text,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Heading,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  Flex,
  useColorModeValue,
  Link,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiExternalLink,
} from 'react-icons/fi';
import { getAllPayments } from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';

const ITEMS_PER_PAGE = 10;

// Helper function to get Due Title
const getDueTitle = (payment: Payment): string => {
  const { dueId, dueInfo } = payment;

  if (dueInfo && dueInfo.title) {
    return dueInfo.title;
  }
  if (dueInfo && dueInfo.dueTypeId && dueInfo.dueTypeId.name) {
    return dueInfo.dueTypeId.name;
  }
  if (typeof dueId === 'object' && dueId !== null) {
    if ('title' in dueId && typeof dueId.title === 'string') {
      return dueId.title;
    }
    if (
      'dueTypeId' in dueId &&
      typeof dueId.dueTypeId === 'object' &&
      dueId.dueTypeId !== null &&
      'name' in dueId.dueTypeId &&
      typeof dueId.dueTypeId.name === 'string'
    ) {
      return dueId.dueTypeId.name;
    }
  }
  if (typeof dueId === 'string') {
    return dueId;
  }
  return 'N/A';
};

// Helper function for date formatting
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

const getStatusBadge = (status: Payment['approvalStatus'] | undefined) => {
  const lowerStatus = status?.toLowerCase() || 'pending';
  
  const colorSchemes = {
    approved: 'green',
    rejected: 'red',
    pending: 'yellow',
  };

  const labels = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
  };

  return (
    <Badge 
      colorScheme={colorSchemes[lowerStatus as keyof typeof colorSchemes] || 'yellow'} 
      variant="subtle"
      textTransform="capitalize"
    >
      {labels[lowerStatus as keyof typeof labels] || 'Pending'}
    </Badge>
  );
};

// Helper function to get Payment Type label
const getPaymentTypeLabel = (payment: Payment): string => {
  if ((payment as any).paymentType) {
    switch ((payment as any).paymentType) {
      case 'due': return 'Dues';
      case 'donation': return 'Donation';
      case 'event_fee': return 'Event Fee';
      case 'registration_fee': return 'Registration Fee';
      case 'conference_fee': return 'Conference Fee';
      case 'accommodation': return 'Accommodation';
      case 'seminar': return 'Seminar';
      case 'transportation': return 'Transportation';
      case 'building': return 'Building';
      case 'other': return 'Other';
      default: return (payment as any).paymentType;
    }
  }
  return 'N/A';
};

// Helper function to get Payment Title/Description
const getPaymentTitle = (payment: Payment): string => {
  if ((payment as any).paymentType === 'due') {
    return getDueTitle(payment);
  }
  if ((payment as any).paymentType === 'donation') {
    return (payment as any).meta?.purpose || (payment as any).meta?.description || 'Donation';
  }
  if ((payment as any).paymentType === 'event_fee') {
    const participant = (payment as any).meta?.participant;
    const eventId = (payment as any).meta?.eventId;
    return participant ? `${eventId || 'Event'} - ${participant}` : (eventId || 'Event Fee');
  }
  if ((payment as any).paymentType === 'transportation') {
    const participant = (payment as any).meta?.participant;
    return participant ? `Transportation - ${participant}` : 'Transportation';
  }
  return (payment as any).meta?.purpose || (payment as any).meta?.description || (payment as any).meta?.participant || 'N/A';
};

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.600');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPayments({});

      if (response && response.data && Array.isArray(response.data)) {
        setPayments(response.data);
        setTotalItems(response.pagination?.total || response.data.length);
      } else {
        console.warn('Unexpected response structure from getAllPayments:', response);
        setPayments([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
      setError(err.message || 'Failed to fetch payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    if (!debouncedSearchTerm) {
      return payments;
    }
    return payments.filter((payment) => {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      const dueTitle = getDueTitle(payment).toLowerCase();
      const pharmacyName =
        typeof payment.pharmacyId === 'object' && payment.pharmacyId?.name
          ? payment.pharmacyId.name.toLowerCase()
          : '';
      const status = (payment.approvalStatus || '').toLowerCase();
      const paymentMethod = (
        typeof payment.paymentMethod === 'string' ? payment.paymentMethod : ''
      ).toLowerCase();
      const transactionId = (payment.paymentReference || '').toLowerCase();

      return (
        dueTitle.includes(searchTermLower) ||
        pharmacyName.includes(searchTermLower) ||
        status.includes(searchTermLower) ||
        paymentMethod.includes(searchTermLower) ||
        transactionId.includes(searchTermLower) ||
        payment.amount.toString().includes(searchTermLower)
      );
    });
  }, [payments, debouncedSearchTerm]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // CSV export logic
  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Due Title', key: 'dueTitle' },
    { label: 'Amount', key: 'amount' },
    { label: 'Status', key: 'status' },
    { label: 'Transaction ID', key: 'transactionId' },
    { label: 'Receipt', key: 'receipt' },
  ];

  const handleExportCSV = () => {
    const dataToExport = filteredPayments.map((payment) => ({
      date: formatDate(
        payment.paymentDate || payment.submittedAt || payment.createdAt
      ),
      dueTitle: getDueTitle(payment),
      amount: payment.amount.toFixed(2),
      status: payment.approvalStatus,
      transactionId: payment.paymentReference || 'N/A',
      receipt: payment.receiptUrl || 'N/A',
    }));

    // Convert headers to a CSV string row
    const headerRow = csvHeaders.map((header) => header.label).join(',');
    // Convert data rows to CSV string rows
    const dataRows = dataToExport.map((row) =>
      csvHeaders
        .map((header) => {
          // Ensure values are properly stringified and commas are handled
          const value = String(row[header.key as keyof typeof row]);
          return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        })
        .join(',')
    );

    const csvString = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Check for download attribute support
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'payment_history.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };  if (loading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={6}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Error:</Text>
            <Text>{error}</Text>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Heading size="lg" color="gray.800">
          Payment History
        </Heading>

        {/* Search and Export */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'stretch', md: 'center' }}
          gap={4}
        >
          <InputGroup maxW={{ base: 'full', md: '320px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg={cardBg}
              border="1px"
              borderColor="gray.300"
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              }}
            />
          </InputGroup>
          
          {filteredPayments.length > 0 && (
            <Button
              onClick={handleExportCSV}
              colorScheme="blue"
              leftIcon={<FiDownload />}
              size="md"
            >
              Export CSV
            </Button>
          )}
        </Flex>

        {/* Table Content */}
        {filteredPayments.length === 0 && !loading ? (
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Center py={10}>
                <VStack spacing={2}>
                  <Text color="gray.500" fontSize="lg">
                    No payment records found.
                  </Text>
                  {debouncedSearchTerm && (
                    <Text color="gray.400" fontSize="sm">
                      Try adjusting your search term.
                    </Text>
                  )}
                </VStack>
              </Center>
            </CardBody>
          </Card>
        ) : (
          <Card bg={cardBg} shadow="lg" overflow="hidden">
            <TableContainer>
              <Table variant="simple" bg={tableBg}>
                <Thead bg={headerBg}>
                  <Tr>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Date
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Payment Type
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Title/Purpose
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Amount
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Status
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Transaction ID
                    </Th>
                    <Th color="gray.600" fontSize="xs" fontWeight="semibold" letterSpacing="wider">
                      Receipt
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPayments.map((payment) => (
                    <Tr
                      key={payment._id}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                      transition="background-color 0.15s"
                    >
                      <Td fontSize="sm" color="gray.700">
                        {formatDate(
                          payment.paymentDate ||
                            payment.submittedAt ||
                            payment.createdAt
                        )}
                      </Td>
                      <Td fontSize="sm" color="gray.700">
                        {getPaymentTypeLabel(payment)}
                      </Td>
                      <Td fontSize="sm" color="gray.900" fontWeight="medium">
                        {getPaymentTitle(payment)}
                      </Td>
                      <Td fontSize="sm" color="gray.700">
                        {payment.amount?.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'NGN',
                        }) || 'N/A'}
                      </Td>
                      <Td fontSize="sm">
                        {getStatusBadge(payment.approvalStatus)}
                      </Td>
                      <Td fontSize="sm" color="gray.500">
                        {payment.paymentReference || 'N/A'}
                      </Td>
                      <Td fontSize="sm">
                        {payment.receiptUrl ? (
                          <Link
                            href={payment.receiptUrl}
                            isExternal
                            color="blue.600"
                            _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            View Receipt
                            <FiExternalLink size="12px" />
                          </Link>
                        ) : (
                          <Text color="gray.400">No Receipt</Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" pt={4}>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              leftIcon={<FiChevronLeft />}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <Text fontSize="sm" color="gray.700">
              Page {currentPage} of {totalPages} (Total: {totalItems} items)
            </Text>
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              rightIcon={<FiChevronRight />}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </Flex>
        )}
      </VStack>
    </Container>
  );
};

export default PaymentHistory;
