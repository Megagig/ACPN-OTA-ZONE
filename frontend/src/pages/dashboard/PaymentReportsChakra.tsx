import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  Alert,
  AlertIcon,
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
  Stat,
  StatLabel,
  StatNumber,
  Icon,
} from '@chakra-ui/react';
import { 
  DownloadIcon,
} from '@chakra-ui/icons';
import { 
  FaChartBar, 
  FaChartPie, 
  FaTable, 
  FaMoneyBillWave,
  FaCheck,
  FaClock,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import financialService from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface PaymentReportData {
  totalPayments: number;
  totalAmount: number;
  approvedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  monthlyPayments: Array<{ month: string; count: number; amount: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  stateWisePayments: Array<{ state: string; count: number; amount: number }>;
}

const PaymentReportsChakra: React.FC = () => {
  const toast = useToast();
  const [reportData, setReportData] = useState<PaymentReportData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const tooltipBackground = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await financialService.getAllPayments(params);
      const paymentsData = response.payments || [];
      setPayments(paymentsData);

      // Process data for reports
      const processedData = processPaymentData(paymentsData);
      setReportData(processedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedStatus, toast]);

  const processPaymentData = (paymentsData: Payment[]): PaymentReportData => {
    const totalPayments = paymentsData.length;
    const totalAmount = paymentsData.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const approvedPayments = paymentsData.filter(
      (p) => p.status === 'approved'
    ).length;
    const pendingPayments = paymentsData.filter(
      (p) => p.status === 'pending'
    ).length;
    const rejectedPayments = paymentsData.filter(
      (p) => p.status === 'rejected'
    ).length;

    // Monthly payments data
    const monthlyData: { [key: string]: { count: number; amount: number } } =
      {};
    paymentsData.forEach((payment) => {
      const month = new Date(payment.paymentDate || new Date()).toLocaleString('default', {
        month: 'short',
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].amount += payment.amount;
    });

    const monthlyPayments = Object.entries(monthlyData).map(
      ([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount,
      })
    );

    // Mock payment methods and state data for now
    const paymentMethods = [
      {
        method: 'Bank Transfer',
        count: Math.floor(totalPayments * 0.6),
        amount: totalAmount * 0.6,
      },
      {
        method: 'Cash',
        count: Math.floor(totalPayments * 0.25),
        amount: totalAmount * 0.25,
      },
      {
        method: 'Card',
        count: Math.floor(totalPayments * 0.15),
        amount: totalAmount * 0.15,
      },
    ];

    const stateWisePayments = [
      {
        state: 'Lagos',
        count: Math.floor(totalPayments * 0.4),
        amount: totalAmount * 0.4,
      },
      {
        state: 'Abuja',
        count: Math.floor(totalPayments * 0.3),
        amount: totalAmount * 0.3,
      },
      {
        state: 'Kano',
        count: Math.floor(totalPayments * 0.3),
        amount: totalAmount * 0.3,
      },
    ];

    return {
      totalPayments,
      totalAmount,
      approvedPayments,
      pendingPayments,
      rejectedPayments,
      monthlyPayments,
      paymentMethods,
      stateWisePayments,
    };
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Payment Reports Summary'],
      [''],
      ['Total Payments', reportData.totalPayments.toString()],
      ['Total Amount', `₦${reportData.totalAmount.toLocaleString()}`],
      ['Approved Payments', reportData.approvedPayments.toString()],
      ['Pending Payments', reportData.pendingPayments.toString()],
      ['Rejected Payments', reportData.rejectedPayments.toString()],
      [''],
      ['Monthly Breakdown'],
      ['Month', 'Count', 'Amount'],
      ...reportData.monthlyPayments.map((item) => [
        item.month,
        item.count.toString(),
        `₦${item.amount.toLocaleString()}`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment-reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Report has been downloaded as CSV',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="xl">Payment Reports</Heading>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={exportReport}
            isDisabled={!reportData}
          >
            Export Report
          </Button>
        </Flex>

        {/* Filters */}
        <Card mb={6} bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Period</FormLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {loading ? (
          <Flex justify="center" align="center" minH="50vh">
            <Spinner size="xl" thickness="4px" color="blue.500" />
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="semibold">{error}</Text>
            </Box>
            <Button onClick={fetchPaymentData} colorScheme="red" size="sm">
              Retry
            </Button>
          </Alert>
        ) : reportData ? (
          <VStack spacing={6} align="stretch">
            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Card bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor}>Total Payments</StatLabel>
                    <Flex align="center">
                      <Icon as={FaMoneyBillWave} color="blue.500" mr={2} />
                      <StatNumber>{reportData.totalPayments}</StatNumber>
                    </Flex>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor}>Total Amount</StatLabel>
                    <Flex align="center">
                      <Icon as={FaMoneyBillWave} color="green.500" mr={2} />
                      <StatNumber color="green.500">
                        ₦{reportData.totalAmount.toLocaleString()}
                      </StatNumber>
                    </Flex>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor}>Approved</StatLabel>
                    <Flex align="center">
                      <Icon as={FaCheck} color="green.500" mr={2} />
                      <StatNumber color="green.500">
                        {reportData.approvedPayments}
                      </StatNumber>
                    </Flex>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={mutedColor}>Pending</StatLabel>
                    <Flex align="center">
                      <Icon as={FaClock} color="yellow.500" mr={2} />
                      <StatNumber color="yellow.500">
                        {reportData.pendingPayments}
                      </StatNumber>
                    </Flex>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Charts */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Monthly Payments Chart */}
              <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaChartBar} mr={2} color="blue.500" />
                    <Heading size="md">Monthly Payments</Heading>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Box h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.monthlyPayments}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: mutedColor, fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: mutedColor, fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: tooltipBackground,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '6px',
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === 'amount')
                              return [`₦${value.toLocaleString()}`, 'Amount'];
                            return [value, 'Count'];
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--chakra-colors-blue-500)"
                          name="count"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Payment Methods Distribution */}
              <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaChartPie} mr={2} color="blue.500" />
                    <Heading size="md">Payment Methods</Heading>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Box h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.paymentMethods}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="var(--chakra-colors-blue-500)"
                          dataKey="count"
                          label={({ method, count }) => `${method}: ${count}`}
                        >
                          {reportData.paymentMethods.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: tooltipBackground,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '6px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* State-wise Payments */}
              <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor} gridColumn={{ lg: 'span 2' }}>
                <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaChartBar} mr={2} color="blue.500" />
                    <Heading size="md">State-wise Payments</Heading>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Box h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.stateWisePayments}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="state"
                          tick={{ fill: mutedColor, fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: mutedColor, fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: tooltipBackground,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '6px',
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === 'amount')
                              return [`₦${value.toLocaleString()}`, 'Amount'];
                            return [value, 'Count'];
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--chakra-colors-purple-500)"
                          name="amount"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Recent Payments Table */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex align="center">
                  <Icon as={FaTable} mr={2} color="blue.500" />
                  <Heading size="md">Recent Payments</Heading>
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                      <Tr>
                        <Th>Payment ID</Th>
                        <Th>Amount</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {payments.slice(0, 10).map((payment) => (
                        <Tr 
                          key={payment._id}
                          _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                        >
                          <Td fontSize="sm">{payment._id}</Td>
                          <Td fontWeight="medium">
                            ₦{payment.amount.toLocaleString()}
                          </Td>
                          <Td fontSize="sm" color={mutedColor}>
                            {new Date(payment.paymentDate || new Date()).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                payment.status === 'approved'
                                  ? 'green'
                                  : payment.status === 'pending'
                                  ? 'yellow'
                                  : 'red'
                              }
                              borderRadius="full"
                            >
                              {payment.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        ) : null}
      </Container>
    </DashboardLayout>
  );
};

export default PaymentReportsChakra;
