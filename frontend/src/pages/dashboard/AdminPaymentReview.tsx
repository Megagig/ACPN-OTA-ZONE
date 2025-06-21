import React, { useState, useEffect } from 'react';
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Spinner,
  Center,
  Icon,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  ButtonGroup,
  Textarea,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Link,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FaBuilding, 
  FaCreditCard, 
  FaFile, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaReceipt,
  FaEye,
  FaTrash,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { usePayments, useReviewPayment, useDeletePayment, type PaymentApprovalStatus, type Payment } from '../../hooks/usePayments';

const AdminPaymentReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: pending, 1: approved, 2: rejected, 3: all
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    rejectionReason: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Chakra UI hooks
  const toast = useToast();
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const tabMapping = ['pending', 'approved', 'rejected', 'all'];
  const activeTabValue = tabMapping[activeTab] as 'all' | 'pending' | 'approved' | 'rejected';

  // Fetch payments from API
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(
    currentPage,
    10,
    activeTabValue !== 'all' ? { approvalStatus: activeTabValue as PaymentApprovalStatus } : {}
  );

  // Helper: get payments array from API response
  let payments: Payment[] = [];
  if (Array.isArray(paymentsData)) {
    payments = paymentsData;
  } else if (paymentsData) {
    if (Array.isArray(paymentsData.data)) {
      payments = paymentsData.data;
    } else if (paymentsData.payments) {
      payments = paymentsData.payments;
    } else if (paymentsData.data && Array.isArray(paymentsData.data.payments)) {
      payments = paymentsData.data.payments;
    }
  }

  // Filter by search
  const filteredPayments = payments.filter(payment => {
    const pharmacyName = typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
      ? payment.pharmacyId.name.toLowerCase()
      : '';
    const submittedBy = typeof payment.submittedBy === 'object' && payment.submittedBy !== null
      ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`.toLowerCase()
      : '';
    return (
      pharmacyName.includes(searchTerm.toLowerCase()) ||
      submittedBy.includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = paymentsData?.pagination?.totalPages || 1;

  // UI helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Icon as={FaBuilding} />;
      case 'cash': return <Icon as={FaCreditCard} />;
      case 'check': return <Icon as={FaFile} />;
      default: return <Icon as={FaCreditCard} />;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Icon as={FaCheckCircle} color="green.500" />;
      case 'pending': return <Icon as={FaClock} color="yellow.500" />;
      case 'rejected': return <Icon as={FaTimesCircle} color="red.500" />;
      default: return <Icon as={FaExclamationTriangle} color="gray.500" />;
    }
  };
  
  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };
  
  const getPaymentTitle = (payment: Payment) => {
    if ((payment as any).paymentType === 'event_fee') {
      return (payment as any).meta?.eventId || 'Event Fee';
    }
    if ((payment as any).paymentType === 'transportation') {
      return `Transportation - ${(payment as any).meta?.participant || 'N/A'}`;
    }
    return (payment as any).meta?.purpose || (payment as any).meta?.description || 'Payment';
  };

  // React Query hooks for review and delete
  const {
    mutate: reviewPayment,
    isPending: isReviewing,
    error: reviewError,
  } = useReviewPayment(selectedPayment?._id);

  const {
    mutate: deletePayment,
    isPending: isDeleting,
    error: deleteError,
  } = useDeletePayment();

  // Show error toasts for API errors
  useEffect(() => {
    if (paymentsError) {
      toast({
        title: 'Error Loading Payments',
        description: paymentsError.message || String(paymentsError),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    if (reviewError) {
      toast({
        title: 'Error Reviewing Payment',
        description: reviewError.message || String(reviewError),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    if (deleteError) {
      toast({
        title: 'Error Deleting Payment',
        description: deleteError.message || String(deleteError),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [paymentsError, reviewError, deleteError, toast]);

  // Modal handlers
  const openReviewModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setReviewData({ action: 'approve', rejectionReason: '' });
    onReviewOpen();
  };
  
  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    onDeleteOpen();
  };
  
  const closeModals = () => {
    onReviewClose();
    onDeleteClose();
    setSelectedPayment(null);
    setReviewData({ action: 'approve', rejectionReason: '' });
  };
  
  const handleReviewSubmit = () => {
    if (!selectedPayment) return;
    reviewPayment(
      {
        action: reviewData.action,
        rejectionReason: reviewData.action === 'reject' ? reviewData.rejectionReason : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Payment Reviewed',
            description: reviewData.action === 'approve'
              ? 'Payment approved successfully'
              : 'Payment rejected successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          closeModals();
          refetchPayments();
        },
        onError: (error: any) => {
          toast({
            title: 'Review Failed',
            description: error.message || 'Failed to review payment.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
      }
    );
  };
  
  const handleDeletePayment = () => {
    if (!selectedPayment) return;
    deletePayment(selectedPayment._id, {
      onSuccess: () => {
        toast({
          title: 'Payment Deleted',
          description: 'Payment deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        closeModals();
        refetchPayments();
      },
      onError: (error: any) => {
        toast({
          title: 'Delete Failed',
          description: error.message || 'Failed to delete payment.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };
  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        {/* Header */}
        <VStack spacing={6} align="stretch" mb={8}>
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
                Payment Review Dashboard
              </Heading>
              <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                Manage and review all pharmacy payment submissions
              </Text>
            </VStack>
            <InputGroup maxW={{ base: 'full', md: '300px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={useColorModeValue('white', 'gray.700')}
                border="1px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500',
                }}
              />
            </InputGroup>
          </Flex>
        </VStack>

        {/* Tabs and Content */}
        <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor}>
          <Tabs index={activeTab} onChange={(index) => { setActiveTab(index); setCurrentPage(1); }}>
            <TabList>
              <Tab>Pending</Tab>
              <Tab>Approved</Tab>
              <Tab>Rejected</Tab>
              <Tab>All</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                {paymentsLoading ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color="blue.500" />
                      <Text fontSize="lg" fontWeight="medium">Loading payments...</Text>
                      <Text color="gray.500" fontSize="sm">Please wait while payments are loaded.</Text>
                    </VStack>
                  </Center>
                ) : filteredPayments.length === 0 ? (                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FaFile} boxSize={16} color="gray.300" />
                      <Text fontSize="lg" fontWeight="medium">No payments found</Text>
                      <Text color="gray.500" fontSize="sm">There are no payments matching your criteria.</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} px={4}>
                    {filteredPayments.map((payment) => (
                      <Card
                        key={payment._id}
                        w="full"
                        bg={useColorModeValue('white', 'gray.700')}
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{
                          borderColor: 'blue.300',
                          shadow: 'md',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex 
                            direction={{ base: 'column', lg: 'row' }} 
                            justify="space-between" 
                            align={{ base: 'start', lg: 'center' }}
                            gap={4}
                            mb={4}
                          >
                            <VStack align="start" spacing={2} flex={1}>
                              <HStack spacing={3} wrap="wrap">
                                <Heading size="md">
                                  {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                                    ? payment.pharmacyId.name
                                    : typeof payment.pharmacyId === 'string'
                                    ? payment.pharmacyId
                                    : 'Unknown Pharmacy'}
                                </Heading>
                                <Badge 
                                  colorScheme={getStatusColorScheme(payment.approvalStatus)}
                                  variant="subtle"
                                  fontSize="xs"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  <HStack spacing={1}>
                                    {getStatusIcon(payment.approvalStatus)}
                                    <Text textTransform="capitalize">{payment.approvalStatus}</Text>
                                  </HStack>
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                {getPaymentTitle(payment)}
                              </Text>
                            </VStack>
                            
                            <VStack align={{ base: 'start', lg: 'end' }} spacing={2}>
                              <Text fontSize={{ base: 'lg', md: '2xl' }} fontWeight="bold">
                                {formatCurrency(payment.amount)}
                              </Text>
                              <HStack spacing={1} color="gray.500" fontSize="sm">
                                <Icon as={FaCalendarAlt} />
                                <Text>{formatDate(payment.submittedAt)}</Text>
                              </HStack>
                            </VStack>
                          </Flex>
                          
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              {getPaymentMethodIcon(payment.paymentMethod || '')}
                              <Text textTransform="capitalize">
                                {(payment.paymentMethod || '').replace('_', ' ')}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              <Icon as={FaUser} />
                              <Text>
                                {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                                  ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                                  : 'Unknown'}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm">
                              <Icon as={FaReceipt} color="gray.600" />
                              <Link
                                href={payment.receiptUrl}
                                isExternal
                                color="blue.500"
                                _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                              >
                                View Receipt
                              </Link>
                            </HStack>
                          </SimpleGrid>
                          
                          <Flex justify="end" gap={3}>
                            <Button
                              leftIcon={<Icon as={FaEye} />}
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Review
                            </Button>
                            <Button
                              leftIcon={<Icon as={FaTrash} />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Flex justify="center" align="center" mt={6} gap={4}>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      isDisabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" fontWeight="medium">
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      isDisabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </Flex>
                )}
              </TabPanel>
              
              {/* Other tab panels can show same content with different filters */}
              <TabPanel px={0}>
                {/* Same content as above - the tab change already filters the data */}
                {paymentsLoading ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color="blue.500" />
                      <Text fontSize="lg" fontWeight="medium">Loading payments...</Text>
                    </VStack>
                  </Center>
                ) : filteredPayments.length === 0 ? (                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FaFile} boxSize={16} color="gray.300" />
                      <Text fontSize="lg" fontWeight="medium">No approved payments found</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} px={4}>
                    {filteredPayments.map((payment) => (
                      <Card
                        key={payment._id}
                        w="full"
                        bg={useColorModeValue('white', 'gray.700')}
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{
                          borderColor: 'blue.300',
                          shadow: 'md',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex 
                            direction={{ base: 'column', lg: 'row' }} 
                            justify="space-between" 
                            align={{ base: 'start', lg: 'center' }}
                            gap={4}
                            mb={4}
                          >
                            <VStack align="start" spacing={2} flex={1}>
                              <HStack spacing={3} wrap="wrap">
                                <Heading size="md">
                                  {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                                    ? payment.pharmacyId.name
                                    : typeof payment.pharmacyId === 'string'
                                    ? payment.pharmacyId
                                    : 'Unknown Pharmacy'}
                                </Heading>
                                <Badge 
                                  colorScheme={getStatusColorScheme(payment.approvalStatus)}
                                  variant="subtle"
                                  fontSize="xs"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  <HStack spacing={1}>
                                    {getStatusIcon(payment.approvalStatus)}
                                    <Text textTransform="capitalize">{payment.approvalStatus}</Text>
                                  </HStack>
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                {getPaymentTitle(payment)}
                              </Text>
                            </VStack>
                            
                            <VStack align={{ base: 'start', lg: 'end' }} spacing={2}>
                              <Text fontSize={{ base: 'lg', md: '2xl' }} fontWeight="bold">
                                {formatCurrency(payment.amount)}
                              </Text>
                              <HStack spacing={1} color="gray.500" fontSize="sm">
                                <Icon as={FaCalendarAlt} />
                                <Text>{formatDate(payment.submittedAt)}</Text>
                              </HStack>
                            </VStack>
                          </Flex>
                          
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              {getPaymentMethodIcon(payment.paymentMethod || '')}
                              <Text textTransform="capitalize">
                                {(payment.paymentMethod || '').replace('_', ' ')}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              <Icon as={FaUser} />
                              <Text>
                                {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                                  ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                                  : 'Unknown'}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm">
                              <Icon as={FaReceipt} color="gray.600" />
                              <Link
                                href={payment.receiptUrl}
                                isExternal
                                color="blue.500"
                                _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                              >
                                View Receipt
                              </Link>
                            </HStack>
                          </SimpleGrid>
                          
                          <Flex justify="end" gap={3}>
                            <Button
                              leftIcon={<Icon as={FaEye} />}
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Review
                            </Button>
                            <Button
                              leftIcon={<Icon as={FaTrash} />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </TabPanel>
              
              <TabPanel px={0}>
                {/* Rejected payments tab - same structure */}
                {paymentsLoading ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color="blue.500" />
                      <Text fontSize="lg" fontWeight="medium">Loading payments...</Text>
                    </VStack>
                  </Center>
                ) : filteredPayments.length === 0 ? (                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FaFile} boxSize={16} color="gray.300" />
                      <Text fontSize="lg" fontWeight="medium">No rejected payments found</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} px={4}>
                    {filteredPayments.map((payment) => (
                      <Card
                        key={payment._id}
                        w="full"
                        bg={useColorModeValue('white', 'gray.700')}
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{
                          borderColor: 'blue.300',
                          shadow: 'md',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex 
                            direction={{ base: 'column', lg: 'row' }} 
                            justify="space-between" 
                            align={{ base: 'start', lg: 'center' }}
                            gap={4}
                            mb={4}
                          >
                            <VStack align="start" spacing={2} flex={1}>
                              <HStack spacing={3} wrap="wrap">
                                <Heading size="md">
                                  {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                                    ? payment.pharmacyId.name
                                    : typeof payment.pharmacyId === 'string'
                                    ? payment.pharmacyId
                                    : 'Unknown Pharmacy'}
                                </Heading>
                                <Badge 
                                  colorScheme={getStatusColorScheme(payment.approvalStatus)}
                                  variant="subtle"
                                  fontSize="xs"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  <HStack spacing={1}>
                                    {getStatusIcon(payment.approvalStatus)}
                                    <Text textTransform="capitalize">{payment.approvalStatus}</Text>
                                  </HStack>
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                {getPaymentTitle(payment)}
                              </Text>
                            </VStack>
                            
                            <VStack align={{ base: 'start', lg: 'end' }} spacing={2}>
                              <Text fontSize={{ base: 'lg', md: '2xl' }} fontWeight="bold">
                                {formatCurrency(payment.amount)}
                              </Text>
                              <HStack spacing={1} color="gray.500" fontSize="sm">
                                <Icon as={FaCalendarAlt} />
                                <Text>{formatDate(payment.submittedAt)}</Text>
                              </HStack>
                            </VStack>
                          </Flex>
                          
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              {getPaymentMethodIcon(payment.paymentMethod || '')}
                              <Text textTransform="capitalize">
                                {(payment.paymentMethod || '').replace('_', ' ')}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              <Icon as={FaUser} />
                              <Text>
                                {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                                  ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                                  : 'Unknown'}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm">
                              <Icon as={FaReceipt} color="gray.600" />
                              <Link
                                href={payment.receiptUrl}
                                isExternal
                                color="blue.500"
                                _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                              >
                                View Receipt
                              </Link>
                            </HStack>
                          </SimpleGrid>
                          
                          <Flex justify="end" gap={3}>
                            <Button
                              leftIcon={<Icon as={FaEye} />}
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Review
                            </Button>
                            <Button
                              leftIcon={<Icon as={FaTrash} />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </TabPanel>
              
              <TabPanel px={0}>
                {/* All payments tab - same structure */}
                {paymentsLoading ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color="blue.500" />
                      <Text fontSize="lg" fontWeight="medium">Loading payments...</Text>
                    </VStack>
                  </Center>
                ) : filteredPayments.length === 0 ? (                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FaFile} boxSize={16} color="gray.300" />
                      <Text fontSize="lg" fontWeight="medium">No payments found</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} px={4}>
                    {filteredPayments.map((payment) => (
                      <Card
                        key={payment._id}
                        w="full"
                        bg={useColorModeValue('white', 'gray.700')}
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{
                          borderColor: 'blue.300',
                          shadow: 'md',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex 
                            direction={{ base: 'column', lg: 'row' }} 
                            justify="space-between" 
                            align={{ base: 'start', lg: 'center' }}
                            gap={4}
                            mb={4}
                          >
                            <VStack align="start" spacing={2} flex={1}>
                              <HStack spacing={3} wrap="wrap">
                                <Heading size="md">
                                  {typeof payment.pharmacyId === 'object' && payment.pharmacyId !== null && 'name' in payment.pharmacyId
                                    ? payment.pharmacyId.name
                                    : typeof payment.pharmacyId === 'string'
                                    ? payment.pharmacyId
                                    : 'Unknown Pharmacy'}
                                </Heading>
                                <Badge 
                                  colorScheme={getStatusColorScheme(payment.approvalStatus)}
                                  variant="subtle"
                                  fontSize="xs"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  <HStack spacing={1}>
                                    {getStatusIcon(payment.approvalStatus)}
                                    <Text textTransform="capitalize">{payment.approvalStatus}</Text>
                                  </HStack>
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                {getPaymentTitle(payment)}
                              </Text>
                            </VStack>
                            
                            <VStack align={{ base: 'start', lg: 'end' }} spacing={2}>
                              <Text fontSize={{ base: 'lg', md: '2xl' }} fontWeight="bold">
                                {formatCurrency(payment.amount)}
                              </Text>
                              <HStack spacing={1} color="gray.500" fontSize="sm">
                                <Icon as={FaCalendarAlt} />
                                <Text>{formatDate(payment.submittedAt)}</Text>
                              </HStack>
                            </VStack>
                          </Flex>
                          
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              {getPaymentMethodIcon(payment.paymentMethod || '')}
                              <Text textTransform="capitalize">
                                {(payment.paymentMethod || '').replace('_', ' ')}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm" color="gray.600">
                              <Icon as={FaUser} />
                              <Text>
                                {typeof payment.submittedBy === 'object' && payment.submittedBy !== null
                                  ? `${payment.submittedBy.firstName} ${payment.submittedBy.lastName}`
                                  : 'Unknown'}
                              </Text>
                            </HStack>
                            
                            <HStack spacing={2} fontSize="sm">
                              <Icon as={FaReceipt} color="gray.600" />
                              <Link
                                href={payment.receiptUrl}
                                isExternal
                                color="blue.500"
                                _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                              >
                                View Receipt
                              </Link>
                            </HStack>
                          </SimpleGrid>
                          
                          <Flex justify="end" gap={3}>
                            <Button
                              leftIcon={<Icon as={FaEye} />}
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Review
                            </Button>
                            <Button
                              leftIcon={<Icon as={FaTrash} />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(payment)}
                              isLoading={isReviewing || isDeleting}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>
      </Container>      
      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={closeModals} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="semibold">Review Payment</Text>
              <Text fontSize="sm" color="gray.600">
                Review the payment details and choose your action
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPayment && (
              <VStack spacing={6} align="stretch">
                {/* Payment Details */}
                <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                  <Text fontWeight="medium" mb={3}>Payment Details</Text>
                  <VStack spacing={2} align="stretch" fontSize="sm">
                    <Flex justify="space-between">
                      <Text color="gray.600">Amount:</Text>
                      <Text fontWeight="medium">{formatCurrency(selectedPayment.amount)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Method:</Text>
                      <Text textTransform="capitalize">
                        {(selectedPayment.paymentMethod || '').replace('_', ' ')}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Type:</Text>
                      <Text textTransform="capitalize">
                        {('paymentType' in selectedPayment ? (selectedPayment as any).paymentType : '').replace('_', ' ')}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Pharmacy:</Text>
                      <Text>
                        {typeof selectedPayment.pharmacyId === 'object' && selectedPayment.pharmacyId !== null && 'name' in selectedPayment.pharmacyId 
                          ? selectedPayment.pharmacyId.name 
                          : 'Unknown Pharmacy'}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
                
                {/* Action Selection */}
                <FormControl>
                  <FormLabel>Action</FormLabel>
                  <RadioGroup 
                    value={reviewData.action} 
                    onChange={(value) => setReviewData({ ...reviewData, action: value as 'approve' | 'reject' })}
                  >
                    <SimpleGrid columns={2} spacing={3}>
                      <Card 
                        borderWidth="2px"
                        borderColor={reviewData.action === 'approve' ? 'green.500' : 'gray.200'}
                        bg={reviewData.action === 'approve' ? 'green.50' : 'white'}
                        _hover={{ borderColor: 'green.300' }}
                        cursor="pointer"
                        onClick={() => setReviewData({ ...reviewData, action: 'approve' })}
                      >
                        <CardBody textAlign="center" py={4}>
                          <Radio value="approve" mb={2}>
                            <VStack spacing={1}>
                              <Icon as={FaCheck} color="green.500" boxSize={5} />
                              <Text fontSize="sm" fontWeight="medium">Approve</Text>
                            </VStack>
                          </Radio>
                        </CardBody>
                      </Card>
                      
                      <Card 
                        borderWidth="2px"
                        borderColor={reviewData.action === 'reject' ? 'red.500' : 'gray.200'}
                        bg={reviewData.action === 'reject' ? 'red.50' : 'white'}
                        _hover={{ borderColor: 'red.300' }}
                        cursor="pointer"
                        onClick={() => setReviewData({ ...reviewData, action: 'reject' })}
                      >
                        <CardBody textAlign="center" py={4}>
                          <Radio value="reject" mb={2}>
                            <VStack spacing={1}>
                              <Icon as={FaTimes} color="red.500" boxSize={5} />
                              <Text fontSize="sm" fontWeight="medium">Reject</Text>
                            </VStack>
                          </Radio>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </RadioGroup>
                </FormControl>
                
                {/* Rejection Reason */}
                {reviewData.action === 'reject' && (
                  <FormControl>
                    <FormLabel>Rejection Reason</FormLabel>
                    <Textarea
                      value={reviewData.rejectionReason}
                      onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                      placeholder="Please provide a reason for rejection..."
                      rows={3}
                      resize="none"
                    />
                  </FormControl>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <ButtonGroup spacing={3} w="full">
              <Button 
                variant="outline"
                onClick={closeModals}
                isDisabled={isReviewing}
                flex={1}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="blue"
                onClick={handleReviewSubmit}
                isLoading={isReviewing}
                isDisabled={reviewData.action === 'reject' && !reviewData.rejectionReason}
                flex={1}
              >
                Submit Review
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={closeModals} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Box 
                w={12} 
                h={12} 
                bg="red.100" 
                borderRadius="full" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Icon as={FaTrash} color="red.600" boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="semibold">Delete Payment</Text>
                <Text fontSize="sm" color="gray.600">This action cannot be undone</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPayment && (
              <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                <Text fontSize="sm" color="gray.700">
                  You are about to permanently delete the payment from{' '}
                  <Text as="span" fontWeight="medium">
                    {typeof selectedPayment.pharmacyId === 'object' && selectedPayment.pharmacyId !== null && 'name' in selectedPayment.pharmacyId 
                      ? selectedPayment.pharmacyId.name 
                      : 'Unknown Pharmacy'}
                  </Text>{' '}
                  for <Text as="span" fontWeight="medium">{formatCurrency(selectedPayment.amount)}</Text>.
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <ButtonGroup spacing={3} w="full">
              <Button 
                variant="outline"
                onClick={closeModals}
                isDisabled={isDeleting}
                flex={1}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red"
                onClick={handleDeletePayment}
                isLoading={isDeleting}
                flex={1}
              >
                Delete Payment
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>  );
};

export default AdminPaymentReview;