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
  CardHeader,  Grid,
  VStack,
  HStack,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner,
  Center,
  Icon,
  useToast,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  FiDollarSign, 
  FiAlertCircle, 
  FiHome, 
  FiBarChart, 
  FiTrendingUp, 
  FiRefreshCw 
} from 'react-icons/fi';
import financialService from '../../services/financial.service';
import type { PaymentSubmission } from '../../types/pharmacy.types';

interface AnalyticsData {
  monthlyCollections: { month: string; amount: number; count: number }[];
  paymentStatusDistribution: { name: string; value: number; color: string }[];
  dueTypeDistribution: { name: string; amount: number; count: number }[];
  stateWiseCollection: { state: string; amount: number; count: number }[];
  topPayingPharmacies: { name: string; amount: number; payments: number }[];
  collectionTrends: { date: string; cumulative: number; daily: number }[];
}

interface SummaryStats {
  totalCollected: number;
  totalOutstanding: number;
  totalPharmacies: number;
  averagePayment: number;
  collectionRate: number;
  monthlyGrowth: number;
}

const FinancialAnalytics: React.FC = () => {
  const toast = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyCollections: [],
    paymentStatusDistribution: [],
    dueTypeDistribution: [],
    stateWiseCollection: [],
    topPayingPharmacies: [],
    collectionTrends: [],
  });

  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalCollected: 0,
    totalOutstanding: 0,
    totalPharmacies: 0,
    averagePayment: 0,
    collectionRate: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching analytics data...');

      // Fetch data with better error handling
      let payments = { payments: [] };
      let dues: any[] = [];
      let pharmacies: any[] = [];
      let dueAnalytics = { outstandingAmount: 0 };

      try {
        console.log('Fetching payments...');
        payments = await financialService.getAllPayments({ status: 'all' });
        console.log('Payments fetched:', payments);
      } catch (err) {
        console.error('Error fetching payments:', err);
        // Continue with empty data
      }

      try {
        console.log('Fetching dues...');
        dues = await financialService.getDues();
        console.log('Dues fetched:', dues);
      } catch (err) {
        console.error('Error fetching dues:', err);
        // Continue with empty data
      }

      try {
        console.log('Fetching pharmacies...');
        pharmacies = await financialService.getAllPharmacies();
        console.log('Pharmacies fetched:', pharmacies);
      } catch (err) {
        console.error('Error fetching pharmacies:', err);
        // Continue with empty data
      }

      try {
        console.log('Fetching due analytics...');
        dueAnalytics = await financialService.getDueAnalytics();
        console.log('Due analytics fetched:', dueAnalytics);
      } catch (err) {
        console.error('Error fetching due analytics:', err);
        // Continue with empty data
      }

      const paymentsData = payments.payments || payments || [];
      const periodMonths =
        selectedPeriod === '12months'
          ? 12
          : selectedPeriod === '6months'
          ? 6
          : 3;

      // Filter payments based on selected period
      const filteredPayments = paymentsData.filter(
        (payment: PaymentSubmission) => {
          const paymentDate = new Date(payment.submittedAt);
          const monthsAgo = new Date();
          monthsAgo.setMonth(monthsAgo.getMonth() - periodMonths);
          return paymentDate >= monthsAgo;
        }
      );

      // Process analytics data
      const processedData = processAnalyticsData(
        filteredPayments,
        dues,
        pharmacies,
        dueAnalytics
      );
      setAnalyticsData(processedData);

      // Calculate summary stats
      const approvedPayments = filteredPayments.filter(
        (p: PaymentSubmission) => p.status === 'approved'
      );
      const totalCollected = approvedPayments.reduce(
        (sum: number, p: PaymentSubmission) => sum + p.amount,
        0
      );
      const totalOutstanding = dueAnalytics.outstandingAmount || 0;
      const averagePayment =
        approvedPayments.length > 0
          ? totalCollected / approvedPayments.length
          : 0;
      const collectionRate =
        totalCollected + totalOutstanding > 0
          ? (totalCollected / (totalCollected + totalOutstanding)) * 100
          : 0;

      setSummaryStats({
        totalCollected,
        totalOutstanding,
        totalPharmacies: pharmacies.length,
        averagePayment,
        collectionRate,
        monthlyGrowth: calculateMonthlyGrowth(approvedPayments),
      });

      console.log('Analytics data processed successfully');
    } catch (err) {
      const errorMessage = 'Failed to load analytics data';
      console.error('Analytics error:', err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    payments: PaymentSubmission[],
    _dues: any[],
    pharmacies: any[],
    _dueAnalytics: any
  ): AnalyticsData => {
    // Monthly collections
    const monthlyData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const month = new Date(payment.submittedAt).toLocaleDateString(
          'en-US',
          { year: 'numeric', month: 'short' }
        );
        const existing = monthlyData.get(month) || {
          month,
          amount: 0,
          count: 0,
        };
        monthlyData.set(month, {
          month,
          amount: existing.amount + payment.amount,
          count: existing.count + 1,
        });
      }
    });

    // Payment status distribution
    const statusData = [
      {
        name: 'Approved',
        value: payments.filter((p) => p.status === 'approved').length,
        color: '#10B981',
      },
      {
        name: 'Pending',
        value: payments.filter((p) => p.status === 'pending').length,
        color: '#F59E0B',
      },
      {
        name: 'Rejected',
        value: payments.filter((p) => p.status === 'rejected').length,
        color: '#EF4444',
      },
    ];

    // State-wise collection
    const stateData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const pharmacy = pharmacies.find((p) => p._id === payment.pharmacyId);
        const state = pharmacy?.address?.state || 'Unknown';
        const existing = stateData.get(state) || { state, amount: 0, count: 0 };
        stateData.set(state, {
          state,
          amount: existing.amount + payment.amount,
          count: existing.count + 1,
        });
      }
    });

    // Top paying pharmacies
    const pharmacyData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const pharmacy = pharmacies.find((p) => p._id === payment.pharmacyId);
        const name = pharmacy?.businessName || 'Unknown';
        const existing = pharmacyData.get(payment.pharmacyId) || {
          name,
          amount: 0,
          payments: 0,
        };
        pharmacyData.set(payment.pharmacyId, {
          name,
          amount: existing.amount + payment.amount,
          payments: existing.payments + 1,
        });
      }
    });

    // Collection trends
    const trendsData = new Map();
    let cumulative = 0;
    payments
      .filter((p) => p.status === 'approved')
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      )
      .forEach((payment: PaymentSubmission) => {
        const date = new Date(payment.submittedAt).toISOString().split('T')[0];
        const existing = trendsData.get(date) || { date, daily: 0 };
        existing.daily += payment.amount;
        cumulative += payment.amount;
        existing.cumulative = cumulative;
        trendsData.set(date, existing);
      });

    return {
      monthlyCollections: Array.from(monthlyData.values()).sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      ),
      paymentStatusDistribution: statusData,
      dueTypeDistribution: [], // TODO: Implement if due type data is available
      stateWiseCollection: Array.from(stateData.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
      topPayingPharmacies: Array.from(pharmacyData.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
      collectionTrends: Array.from(trendsData.values()).slice(-30), // Last 30 days
    };
  };

  const calculateMonthlyGrowth = (payments: PaymentSubmission[]): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonth = payments
      .filter((p) => {
        const date = new Date(p.submittedAt);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonth = payments
      .filter((p) => {
        const date = new Date(p.submittedAt);
        const lastMonthDate = new Date(currentYear, currentMonth - 1);
        return (
          date.getMonth() === lastMonthDate.getMonth() &&
          date.getFullYear() === lastMonthDate.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-NG').format(num);
  };
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const bgGradient = useColorModeValue('linear(to-br, gray.50, gray.100)', 'linear(to-br, gray.900, gray.800)');

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} p={6}>
        <Container maxW="7xl">
          <Center minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" color="gray.600">
                Loading financial analytics...
              </Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }
  if (error) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} p={6}>
        <Container maxW="7xl">
          <Alert status="error" borderRadius="lg" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>Unable to load financial data!</AlertTitle>
              <AlertDescription>
                {error}. Some services may be unavailable. You can still view the analytics interface below.
              </AlertDescription>
            </Box>
          </Alert>
          
          {/* Show empty dashboard */}
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="flex-start" spacing={2}>
                <Heading size="xl" color="gray.800">
                  Financial Analytics
                </Heading>
                <Text color="gray.600">
                  Comprehensive financial insights and performance metrics
                </Text>
              </VStack>
              
              <HStack spacing={4}>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  w="180px"
                  bg={cardBg}
                >
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="12months">Last 12 Months</option>
                </Select>
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  colorScheme="blue"
                  onClick={fetchAnalyticsData}
                >
                  Retry
                </Button>
              </HStack>
            </Flex>

            {/* Empty Stats Cards */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={6}>
              {[
                { label: 'Total Collected', value: '₦0', color: 'green.600', icon: FiDollarSign },
                { label: 'Outstanding', value: '₦0', color: 'red.600', icon: FiAlertCircle },
                { label: 'Total Pharmacies', value: '0', color: 'blue.600', icon: FiHome },
                { label: 'Average Payment', value: '₦0', color: 'purple.600', icon: FiBarChart },
                { label: 'Collection Rate', value: '0%', color: 'indigo.600', icon: FiTrendingUp },
                { label: 'Monthly Growth', value: '0%', color: 'green.600', icon: FiTrendingUp },
              ].map((stat, index) => (
                <Card key={index} bg={cardBg} shadow="md">
                  <CardBody>
                    <Stat>
                      <StatLabel>{stat.label}</StatLabel>
                      <StatNumber color={stat.color}>{stat.value}</StatNumber>
                      <StatHelpText>
                        <Icon as={stat.icon} mr={1} />
                        No data available
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              ))}
            </Grid>

            {/* Empty Charts */}
            <Card bg={cardBg} shadow="md">
              <CardBody>
                <Center h="400px">
                  <VStack spacing={4}>
                    <Icon as={FiBarChart} boxSize={16} color="gray.400" />
                    <Text color="gray.500" textAlign="center">
                      Financial charts will appear here when data is available
                    </Text>
                    <Button
                      leftIcon={<Icon as={FiRefreshCw} />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={fetchAnalyticsData}
                    >
                      Retry Loading Data
                    </Button>
                  </VStack>
                </Center>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    );
  }
  return (
    <Box minH="100vh" bgGradient={bgGradient} p={6}>
      <Container maxW="7xl">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
          <VStack align="flex-start" spacing={2}>
            <Heading size="xl" color="gray.800">
              Financial Analytics
            </Heading>
            <Text color="gray.600">
              Comprehensive financial insights and performance metrics
            </Text>
          </VStack>
          
          <HStack spacing={4}>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              w="180px"
              bg={cardBg}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </Select>
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              colorScheme="blue"
              onClick={fetchAnalyticsData}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Summary Stats */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={6} mb={8}>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Total Collected</StatLabel>
                <StatNumber color="green.600">
                  {formatCurrency(summaryStats.totalCollected)}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiDollarSign} mr={1} />
                  Revenue
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Outstanding</StatLabel>
                <StatNumber color="red.600">
                  {formatCurrency(summaryStats.totalOutstanding)}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiAlertCircle} mr={1} />
                  Pending
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Total Pharmacies</StatLabel>
                <StatNumber color="blue.600">
                  {formatNumber(summaryStats.totalPharmacies)}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiHome} mr={1} />
                  Registered
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Average Payment</StatLabel>
                <StatNumber color="purple.600">
                  {formatCurrency(summaryStats.averagePayment)}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiBarChart} mr={1} />
                  Per payment
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Collection Rate</StatLabel>
                <StatNumber color="indigo.600">
                  {summaryStats.collectionRate.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiTrendingUp} mr={1} />
                  Success rate
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Monthly Growth</StatLabel>
                <StatNumber color={summaryStats.monthlyGrowth >= 0 ? 'green.600' : 'red.600'}>
                  {summaryStats.monthlyGrowth >= 0 ? '+' : ''}
                  {summaryStats.monthlyGrowth.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={summaryStats.monthlyGrowth >= 0 ? 'increase' : 'decrease'} />
                  vs last month
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>        {/* Charts Section */}
        <Card bg={cardBg} shadow="md" mb={8}>
          <CardBody>
            <Tabs variant="line" colorScheme="blue">
              <TabList mb={6}>
                <Tab>Overview</Tab>
                <Tab>Collection Trends</Tab>
                <Tab>Status Distribution</Tab>
                <Tab>Geographic Analysis</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <Box h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.monthlyCollections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            'Amount',
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="amount" fill="#3B82F6" name="Collection Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </TabPanel>

                <TabPanel px={0}>
                  <Box h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.collectionTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            'Amount',
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Cumulative"
                        />
                        <Line
                          type="monotone"
                          dataKey="daily"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="Daily"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </TabPanel>

                <TabPanel px={0}>
                  <Box h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.paymentStatusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.paymentStatusDistribution.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </TabPanel>

                <TabPanel px={0}>
                  <Box h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.stateWiseCollection}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis dataKey="state" type="category" width={100} />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            'Amount',
                          ]}
                        />
                        <Bar dataKey="amount" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>        {/* Top Paying Pharmacies */}
        <Card bg={cardBg} shadow="md">
          <CardHeader>
            <Heading size="lg">Top Paying Pharmacies</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Pharmacy</Th>
                    <Th>Total Paid</Th>
                    <Th>Payments</Th>
                    <Th>Average</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {analyticsData.topPayingPharmacies.map((pharmacy, index) => (
                    <Tr key={index} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td>
                        <Text fontWeight="medium">{pharmacy.name}</Text>
                      </Td>
                      <Td>
                        <Text fontWeight="semibold" color="green.600">
                          {formatCurrency(pharmacy.amount)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">{pharmacy.payments}</Badge>
                      </Td>
                      <Td>
                        <Text color="gray.600">
                          {formatCurrency(pharmacy.amount / pharmacy.payments)}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default FinancialAnalytics;
