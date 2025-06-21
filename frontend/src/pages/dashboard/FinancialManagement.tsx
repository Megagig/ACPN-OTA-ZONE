import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  Text,
  Button,
  SimpleGrid,
  Grid,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiBarChart,
  FiFileText,
  FiTrendingUp,
  FiX,
  FiPlus,
  FiDownload,
} from 'react-icons/fi';
import financialService from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';

interface FinancialStats {
  totalDues: number;
  totalPaid: number;
  totalOutstanding: number;
  totalPenalties: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  monthlyCollection: number;
}

const FinancialManagement: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<FinancialStats>({
    totalDues: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalPenalties: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    monthlyCollection: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchFinancialStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch various statistics from different endpoints
      const [dueAnalytics, pendingPayments, allPayments] = await Promise.all([
        financialService.getDueAnalytics(),
        financialService.getPendingPayments(),
        financialService.getAllPayments({ status: 'all' }),
      ]);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyPayments =
        allPayments.payments?.filter((payment: Payment) => {
          const paymentDate = new Date(payment.paymentDate || new Date());
          return (
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear &&
            payment.status === 'approved'
          );
        }) || [];

      setStats({
        totalDues: dueAnalytics.totalAmount || 0,
        totalPaid: dueAnalytics.collectedAmount || 0,
        totalOutstanding: dueAnalytics.outstandingAmount || 0,
        totalPenalties: 0, // No direct property for penalties in the API response
        pendingPayments: pendingPayments?.length || 0,
        approvedPayments:
          allPayments.payments?.filter((p: Payment) => p.status === 'approved')
            .length || 0,
        rejectedPayments:
          allPayments.payments?.filter((p: Payment) => p.status === 'rejected')
            .length || 0,
        monthlyCollection: monthlyPayments.reduce(
          (sum: number, payment: Payment) => sum + payment.amount,
          0
        ),
      });    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load financial statistics';
      setError(errorMessage);
      toast({
        title: 'Error loading financial data',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialStats();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  const managementSections = [
    {
      title: 'Due Management',
      description: 'Create, assign, and manage dues for pharmacies',
      icon: FiFileText,
      color: 'blue',
      links: [
        { label: 'Assign Dues', href: '/dashboard/assign-dues' },
        { label: 'Manage Due Types', href: '/dashboard/due-types' },
        { label: 'Bulk Assignment', href: '/dashboard/bulk-assign-dues' },
        { label: 'Add Penalties', href: '/dashboard/manage-penalties' },
      ],
    },
    {
      title: 'Payment Review',
      description: 'Review and approve payment submissions from pharmacies',
      icon: FiCheckCircle,
      color: 'green',
      links: [
        { label: 'Review Payments', href: '/dashboard/admin-payment-review' },
        { label: 'Payment History', href: '/dashboard/payment-history' },
        { label: 'Generate Reports', href: '/dashboard/payment-reports' },
      ],
    },
    {
      title: 'Financial Analytics',
      description: 'View comprehensive financial reports and analytics',
      icon: FiBarChart,
      color: 'purple',
      links: [
        {
          label: 'Financial Dashboard',
          href: '/dashboard/financial-analytics',
        },
        { label: 'Collection Reports', href: '/dashboard/collection-reports' },
        { label: 'Outstanding Dues', href: '/dashboard/outstanding-dues' },
        { label: 'Export Data', href: '/dashboard/export-financial' },
      ],
    },
    {
      title: 'Clearance Certificates',
      description: 'Generate and manage clearance certificates',
      icon: FiFileText,
      color: 'indigo',
      links: [
        {
          label: 'Generate Certificates',
          href: '/dashboard/generate-certificates',
        },
        {
          label: 'Certificate History',
          href: '/dashboard/certificate-history',
        },
        {
          label: 'Validate Certificates',
          href: '/dashboard/validate-certificates',
        },
      ],
    },
  ];
  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="7xl">
          <Center minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" color="gray.600">
                Loading financial data...
              </Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }
  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="xl" color="gray.800" mb={2}>
                Financial Management
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Comprehensive dues and payments management system
              </Text>
            </Box>
            <Button
              as={Link}
              to="/dashboard"
              colorScheme="blue"
              size="lg"
            >
              Back to Dashboard
            </Button>
          </Flex>

          {/* Error Alert */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Financial Overview */}
          <Box>
            <Heading size="lg" color="gray.800" mb={6}>
              Financial Overview
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiDollarSign} w={6} h={6} color="blue.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Total Dues Amount
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {formatCurrency(stats.totalDues)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiCheckCircle} w={6} h={6} color="green.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Total Collected
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {formatCurrency(stats.totalPaid)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiClock} w={6} h={6} color="yellow.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Outstanding Balance
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {formatCurrency(stats.totalOutstanding)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiTrendingUp} w={6} h={6} color="purple.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        This Month's Collection
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {formatCurrency(stats.monthlyCollection)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>          {/* Payment Status Overview */}
          <Box>
            <Heading size="lg" color="gray.800" mb={6}>
              Payment Status Overview
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiClock} w={6} h={6} color="yellow.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Pending Review
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {stats.pendingPayments}
                    </StatNumber>
                    <StatHelpText mt={3}>
                      <Button
                        as={Link}
                        to="/dashboard/admin-payment-review"
                        size="sm"
                        colorScheme="yellow"
                        variant="outline"
                      >
                        Review Payments →
                      </Button>
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiCheckCircle} w={6} h={6} color="green.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Approved Payments
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {stats.approvedPayments}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="lg">
                <CardBody>
                  <Stat>
                    <Flex align="center" mb={2}>
                      <Icon as={FiX} w={6} h={6} color="red.500" mr={3} />
                      <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                        Rejected Payments
                      </StatLabel>
                    </Flex>
                    <StatNumber color="gray.800" fontSize="xl">
                      {stats.rejectedPayments}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* Management Sections */}
          <Box>
            <Heading size="lg" color="gray.800" mb={6}>
              Management Areas
            </Heading>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
              {managementSections.map((section, index) => (
                <Card key={index} bg={cardBg} shadow="lg" overflow="hidden">
                  <CardHeader bg={`${section.color}.50`} borderBottomWidth="1px" borderColor={borderColor}>
                    <Flex align="center">
                      <Icon 
                        as={section.icon} 
                        w={8} 
                        h={8} 
                        color={`${section.color}.600`} 
                        mr={3} 
                      />
                      <Box>
                        <Heading size="md" color="gray.800">
                          {section.title}
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          {section.description}
                        </Text>
                      </Box>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                      {section.links.map((link, linkIndex) => (
                        <Button
                          key={linkIndex}
                          as={Link}
                          to={link.href}
                          size="sm"
                          variant="outline"
                          colorScheme={section.color}
                          justifyContent="flex-start"
                          fontWeight="medium"
                        >
                          {link.label}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Box>

          {/* Quick Actions */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
              <Heading size="md" color="gray.800">
                Quick Actions
              </Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                <Button
                  as={Link}
                  to="/dashboard/admin-payment-review"
                  leftIcon={<Icon as={FiCheckCircle} />}
                  colorScheme="blue"
                  size="lg"
                  w="full"
                >
                  Review Payments
                </Button>
                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  colorScheme="green"
                  size="lg"
                  w="full"
                  onClick={() => toast({
                    title: 'Feature Coming Soon',
                    description: 'Assign new dues functionality will be available soon.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  })}
                >
                  Assign New Dues
                </Button>
                <Button
                  leftIcon={<Icon as={FiBarChart} />}
                  colorScheme="purple"
                  size="lg"
                  w="full"
                  onClick={() => toast({
                    title: 'Feature Coming Soon',
                    description: 'Analytics view will be available soon.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  })}
                >
                  View Analytics
                </Button>
                <Button
                  leftIcon={<Icon as={FiDownload} />}
                  colorScheme="indigo"
                  size="lg"
                  w="full"
                  onClick={() => toast({
                    title: 'Feature Coming Soon',
                    description: 'Report generation will be available soon.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  })}
                >
                  Generate Reports
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default FinancialManagement;
