import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  VStack,
  HStack,
  Heading,
  Button,
  Select,
  Progress,
  Badge,
  Icon,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  List,
  ListItem,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiArrowUpRight,
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import StatsCard from '../../components/dashboard/StatsCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface FinancialData {
  totalRevenue: number;
  totalDues: number;
  totalDonations: number;
  pendingPayments: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    member: string;
    date: string;
    status: string;
  }>;
  monthlyData: number[];
  duesCollection: {
    collected: number;
    pending: number;
    overdue: number;
  };
}

const ModernFinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [financialData] = useState<FinancialData>({
    totalRevenue: 2450000,
    totalDues: 1850000,
    totalDonations: 600000,
    pendingPayments: 125000,
    monthlyGrowth: 12.5,
    yearlyGrowth: 23.8,
    recentTransactions: [
      {
        id: '1',
        type: 'dues',
        amount: 25000,
        member: 'John Doe',
        date: '2024-01-20',
        status: 'completed',
      },
      {
        id: '2',
        type: 'donation',
        amount: 50000,
        member: 'Jane Smith',
        date: '2024-01-19',
        status: 'completed',
      },
      {
        id: '3',
        type: 'dues',
        amount: 30000,
        member: 'Bob Johnson',
        date: '2024-01-18',
        status: 'pending',
      },
    ],
    monthlyData: [180000, 220000, 195000, 250000, 280000, 245000],
    duesCollection: {
      collected: 75,
      pending: 15,
      overdue: 10,
    },
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const gradientBg = useColorModeValue(
    'linear(to-r, green.500, green.600)',
    'linear(to-r, green.600, green.700)'
  );

  // Chart data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: financialData.monthlyData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: ['Collected', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [
          financialData.duesCollection.collected,
          financialData.duesCollection.pending,
          financialData.duesCollection.overdue,
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'dues': return FiCreditCard;
      case 'donation': return FiDollarSign;
      default: return FiDollarSign;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'dues': return 'blue.500';
      case 'donation': return 'green.500';
      default: return 'gray.500';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={1}>
          <Heading size="xl">Financial Dashboard</Heading>
          <Text color="gray.500">
            Track revenue, dues, and financial performance
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="200px"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </Select>
          <Button leftIcon={<FiDownload />} variant="outline">
            Export Report
          </Button>
        </HStack>
      </Flex>

      {/* Revenue Overview Card */}
      <Card
        bg={gradientBg}
        color="white"
        mb={8}
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardBody p={8}>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Text fontSize="lg" opacity={0.9}>
                Total Revenue
              </Text>
              <Heading size="2xl">
                ₦{financialData.totalRevenue.toLocaleString()}
              </Heading>
              <HStack spacing={2}>
                <Icon as={FiArrowUpRight} />
                <Text fontSize="sm">
                  +{financialData.monthlyGrowth}% from last month
                </Text>
              </HStack>
            </VStack>
            <VStack align="end" spacing={2}>
              <Badge colorScheme="whiteAlpha" variant="solid" size="lg">
                YTD Growth: +{financialData.yearlyGrowth}%
              </Badge>
            </VStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        <StatsCard
          title="Dues Collected"
          value={`₦${financialData.totalDues.toLocaleString()}`}
          change={8.2}
          changeText="this month"
          icon={FiCreditCard}
          iconColor="blue.500"
        />
        <StatsCard
          title="Donations"
          value={`₦${financialData.totalDonations.toLocaleString()}`}
          change={15.3}
          changeText="this month"
          icon={FiDollarSign}
          iconColor="green.500"
        />
        <StatsCard
          title="Pending Payments"
          value={`₦${financialData.pendingPayments.toLocaleString()}`}
          change={-5.1}
          changeText="this month"
          icon={FiTrendingDown}
          iconColor="red.500"
        />
        <StatsCard
          title="Collection Rate"
          value="85%"
          progress={85}
          progressColor="green"
          icon={FiTrendingUp}
          iconColor="green.500"
        />
      </SimpleGrid>

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Revenue Trend Chart */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="600">
                Revenue Trend
              </Text>
              <Button size="sm" variant="ghost" leftIcon={<FiEye />}>
                View Details
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Box h="300px">
              <Line data={lineChartData} options={chartOptions} />
            </Box>
          </CardBody>
        </Card>

        {/* Dues Collection Breakdown */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Dues Collection Status
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <Box h="300px">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent Transactions & Quick Stats */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Recent Transactions */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="600">
                Recent Transactions
              </Text>
              <Button size="sm" variant="ghost" rightIcon={<FiEye />}>
                View All
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <List spacing={4}>
              {financialData.recentTransactions.map((transaction) => (
                <ListItem key={transaction.id}>
                  <HStack spacing={3}>
                    <Box
                      p={2}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="lg"
                      color={getTransactionColor(transaction.type)}
                    >
                      <Icon as={getTransactionIcon(transaction.type)} />
                    </Box>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="600">
                        {transaction.member}
                      </Text>
                      <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                        {transaction.type} Payment
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="sm" fontWeight="600">
                        ₦{transaction.amount.toLocaleString()}
                      </Text>
                      <Badge
                        size="sm"
                        colorScheme={transaction.status === 'completed' ? 'green' : 'yellow'}
                      >
                        {transaction.status}
                      </Badge>
                    </VStack>
                  </HStack>
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>

        {/* Financial Summary */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Financial Summary
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={6}>
              <Stat>
                <StatLabel>Monthly Target</StatLabel>
                <StatNumber>₦300,000</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  82% achieved
                </StatHelpText>
                <Progress
                  value={82}
                  colorScheme="green"
                  size="sm"
                  borderRadius="full"
                  mt={2}
                />
              </Stat>

              <Divider />

              <Stat>
                <StatLabel>Outstanding Dues</StatLabel>
                <StatNumber color="red.500">₦{financialData.pendingPayments.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  12% from last month
                </StatHelpText>
              </Stat>

              <Divider />

              <VStack spacing={3} w="full">
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  Payment Methods Breakdown
                </Text>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Bank Transfer</Text>
                  <Text fontSize="sm" fontWeight="600">65%</Text>
                </HStack>
                <Progress value={65} colorScheme="blue" size="sm" w="full" borderRadius="full" />
                
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Cash</Text>
                  <Text fontSize="sm" fontWeight="600">25%</Text>
                </HStack>
                <Progress value={25} colorScheme="green" size="sm" w="full" borderRadius="full" />
                
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Online</Text>
                  <Text fontSize="sm" fontWeight="600">10%</Text>
                </HStack>
                <Progress value={10} colorScheme="purple" size="sm" w="full" borderRadius="full" />
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default ModernFinancialDashboard;
