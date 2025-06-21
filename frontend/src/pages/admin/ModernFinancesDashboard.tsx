import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
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
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import {
  FiCreditCard,
  FiBarChart,
  FiDownload,
  FiEye,
  FiPlus,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiUsers,
  FiActivity,
} from 'react-icons/fi';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  member?: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyGrowth: number;
  outstandingDues: number;
  totalMembers: number;
  collectionRate: number;
}

const ModernFinancesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Mock financial data
  const financialSummary: FinancialSummary = {
    totalRevenue: 2450000, // ₦2,450,000
    totalExpenses: 1320000, // ₦1,320,000
    netIncome: 1130000, // ₦1,130,000
    monthlyGrowth: 15.3,
    outstandingDues: 890000, // ₦890,000
    totalMembers: 347,
    collectionRate: 78.5,
  };

  const [recentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'income',
      category: 'Membership Dues',
      description: 'Annual membership payment',
      amount: 45000,
      date: '2024-02-28',
      member: 'Dr. Adebayo Smith',
      status: 'completed',
      reference: 'MEM-2024-001',
    },
    {
      id: '2',
      type: 'income',
      category: 'Event Registration',
      description: 'CPD Workshop registration fee',
      amount: 15000,
      date: '2024-02-27',
      member: 'Pharm. Johnson Emmanuel',
      status: 'completed',
      reference: 'EVT-2024-015',
    },
    {
      id: '3',
      type: 'expense',
      category: 'Office Rent',
      description: 'Monthly office space rental',
      amount: 120000,
      date: '2024-02-26',
      status: 'completed',
      reference: 'EXP-2024-008',
    },
    {
      id: '4',
      type: 'income',
      category: 'Donations',
      description: 'Corporate sponsorship',
      amount: 250000,
      date: '2024-02-25',
      member: 'XYZ Pharmaceuticals',
      status: 'completed',
      reference: 'DON-2024-003',
    },
    {
      id: '5',
      type: 'expense',
      category: 'Utilities',
      description: 'Electricity and internet bills',
      amount: 35000,
      date: '2024-02-24',
      status: 'completed',
      reference: 'EXP-2024-007',
    },
    {
      id: '6',
      type: 'income',
      category: 'Certification Fees',
      description: 'Professional certification processing',
      amount: 25000,
      date: '2024-02-23',
      member: 'Dr. Sarah Williams',
      status: 'pending',
      reference: 'CERT-2024-012',
    },
  ]);

  const monthlyData = [
    { month: 'Jan', income: 1200000, expenses: 850000 },
    { month: 'Feb', income: 1450000, expenses: 920000 },
    { month: 'Mar', income: 1350000, expenses: 800000 },
    { month: 'Apr', income: 1600000, expenses: 1100000 },
    { month: 'May', income: 1750000, expenses: 950000 },
    { month: 'Jun', income: 1900000, expenses: 1200000 },
  ];

  const categoryBreakdown = [
    { category: 'Membership Dues', amount: 1250000, percentage: 51, color: 'blue' },
    { category: 'Event Fees', amount: 650000, percentage: 27, color: 'green' },
    { category: 'Donations', amount: 350000, percentage: 14, color: 'purple' },
    { category: 'Certification Fees', amount: 200000, percentage: 8, color: 'orange' },
  ];

  const expenseCategories = [
    { category: 'Office Operations', amount: 480000, percentage: 36, color: 'red' },
    { category: 'Events & Programs', amount: 380000, percentage: 29, color: 'orange' },
    { category: 'Staff Salaries', amount: 320000, percentage: 24, color: 'blue' },
    { category: 'Administrative', amount: 140000, percentage: 11, color: 'gray' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? FiArrowUpRight : FiArrowDownLeft;
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'green' : 'red';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={6} bg={bg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="gray.800">
              Financial Dashboard
            </Heading>
            <Text color={textColor}>
              Monitor financial health and track revenue streams
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={FiPlus} />}
              variant="outline"
              size="md"
              borderRadius="xl"
            >
              Record Transaction
            </Button>
            <Button
              leftIcon={<Icon as={FiDownload} />}
              colorScheme="brand"
              size="md"
              borderRadius="xl"
            >
              Export Report
            </Button>
          </HStack>
        </Flex>

        {/* Key Metrics */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm" borderRadius="xl">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Revenue</StatLabel>
                  <StatNumber color="green.500">
                    {formatCurrency(financialSummary.totalRevenue)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {financialSummary.monthlyGrowth}% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card bg={cardBg} shadow="sm" borderRadius="xl">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Expenses</StatLabel>
                  <StatNumber color="red.500">
                    {formatCurrency(financialSummary.totalExpenses)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    8.2% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card bg={cardBg} shadow="sm" borderRadius="xl">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Net Income</StatLabel>
                  <StatNumber color="blue.500">
                    {formatCurrency(financialSummary.netIncome)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    23.1% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card bg={cardBg} shadow="sm" borderRadius="xl">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Collection Rate</StatLabel>
                  <StatNumber>{financialSummary.collectionRate}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5.3% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Main Content */}
        <Card bg={cardBg} shadow="sm" borderRadius="xl">
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Revenue Analysis</Tab>
                <Tab>Expense Breakdown</Tab>
                <Tab>Recent Transactions</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel px={0}>
                  <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                    {/* Revenue vs Expenses Chart */}
                    <GridItem>
                      <Card bg={cardBg} shadow="sm">
                        <CardHeader>
                          <Flex justify="space-between" align="center">
                            <Heading size="sm">Revenue vs Expenses</Heading>
                            <Button size="sm" variant="outline" borderRadius="xl">
                              View Details
                            </Button>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <Box h="300px" display="flex" alignItems="center" justifyContent="center" color={textColor}>
                            <VStack>
                              <Icon as={FiBarChart} boxSize={12} />
                              <Text>Chart component would go here</Text>
                              <Text fontSize="sm">Monthly revenue and expense trends</Text>
                            </VStack>
                          </Box>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    {/* Quick Stats */}
                    <GridItem>
                      <VStack spacing={4} align="stretch">
                        {/* Outstanding Dues */}
                        <Card bg={cardBg} shadow="sm">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Icon as={FiCreditCard} boxSize={6} color="orange.500" />
                                <IconButton
                                  icon={<Icon as={FiEye} />}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="View details"
                                />
                              </HStack>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color={textColor}>Outstanding Dues</Text>
                                <Heading size="md" color="orange.500">
                                  {formatCurrency(financialSummary.outstandingDues)}
                                </Heading>
                                <Text fontSize="xs" color={textColor}>
                                  From {financialSummary.totalMembers - Math.floor(financialSummary.totalMembers * financialSummary.collectionRate / 100)} members
                                </Text>
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Member Statistics */}
                        <Card bg={cardBg} shadow="sm">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Icon as={FiUsers} boxSize={6} color="blue.500" />
                                <IconButton
                                  icon={<Icon as={FiEye} />}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="View details"
                                />
                              </HStack>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color={textColor}>Active Members</Text>
                                <Heading size="md" color="blue.500">
                                  {financialSummary.totalMembers}
                                </Heading>
                                <Progress
                                  value={85}
                                  colorScheme="blue"
                                  borderRadius="full"
                                  size="sm"
                                  w="full"
                                />
                                <Text fontSize="xs" color={textColor}>
                                  85% payment compliance
                                </Text>
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Monthly Target */}
                        <Card bg={cardBg} shadow="sm">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Icon as={FiActivity} boxSize={6} color="green.500" />
                                <IconButton
                                  icon={<Icon as={FiEye} />}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="View details"
                                />
                              </HStack>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color={textColor}>Monthly Target</Text>
                                <Heading size="md" color="green.500">
                                  ₦1.8M
                                </Heading>
                                <CircularProgress value={75} color="green.500" size="60px">
                                  <CircularProgressLabel fontSize="sm">75%</CircularProgressLabel>
                                </CircularProgress>
                                <Text fontSize="xs" color={textColor}>
                                  ₦350K remaining
                                </Text>
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </VStack>
                    </GridItem>
                  </Grid>
                </TabPanel>

                {/* Revenue Analysis Tab */}
                <TabPanel px={0}>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    {/* Revenue Sources */}
                    <GridItem>
                      <Card bg={cardBg} shadow="sm">
                        <CardHeader>
                          <Heading size="sm">Revenue Sources</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            {categoryBreakdown.map((item, index) => (
                              <Box key={index}>
                                <Flex justify="space-between" mb={2}>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {item.category}
                                  </Text>
                                  <HStack>
                                    <Text fontSize="sm" color={textColor}>
                                      {formatCurrency(item.amount)}
                                    </Text>
                                    <Text fontSize="sm" fontWeight="semibold">
                                      {item.percentage}%
                                    </Text>
                                  </HStack>
                                </Flex>
                                <Progress
                                  value={item.percentage}
                                  colorScheme={item.color}
                                  borderRadius="full"
                                  size="sm"
                                />
                              </Box>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    {/* Monthly Trends */}
                    <GridItem>
                      <Card bg={cardBg} shadow="sm">
                        <CardHeader>
                          <Heading size="sm">Monthly Revenue Trend</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            {monthlyData.slice(-6).map((month, index) => (
                              <HStack key={index} justify="space-between">
                                <Text fontSize="sm" fontWeight="medium" w="40px">
                                  {month.month}
                                </Text>
                                <Box flex={1} mx={3}>
                                  <Progress
                                    value={(month.income / 2000000) * 100}
                                    colorScheme="green"
                                    borderRadius="full"
                                    size="sm"
                                  />
                                </Box>
                                <Text fontSize="sm" fontWeight="semibold" w="80px" textAlign="right">
                                  {formatCurrency(month.income)}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                </TabPanel>

                {/* Expense Breakdown Tab */}
                <TabPanel px={0}>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    {/* Expense Categories */}
                    <GridItem>
                      <Card bg={cardBg} shadow="sm">
                        <CardHeader>
                          <Heading size="sm">Expense Categories</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            {expenseCategories.map((item, index) => (
                              <Box key={index}>
                                <Flex justify="space-between" mb={2}>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {item.category}
                                  </Text>
                                  <HStack>
                                    <Text fontSize="sm" color={textColor}>
                                      {formatCurrency(item.amount)}
                                    </Text>
                                    <Text fontSize="sm" fontWeight="semibold">
                                      {item.percentage}%
                                    </Text>
                                  </HStack>
                                </Flex>
                                <Progress
                                  value={item.percentage}
                                  colorScheme={item.color}
                                  borderRadius="full"
                                  size="sm"
                                />
                              </Box>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    {/* Cost Control Metrics */}
                    <GridItem>
                      <Card bg={cardBg} shadow="sm">
                        <CardHeader>
                          <Heading size="sm">Cost Control Metrics</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            <Box p={4} bg={headerBg} borderRadius="lg">
                              <Text fontSize="sm" color={textColor}>Operating Ratio</Text>
                              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                53.9%
                              </Text>
                              <Text fontSize="xs" color={textColor}>
                                Expenses to Revenue
                              </Text>
                            </Box>
                            
                            <Box p={4} bg={headerBg} borderRadius="lg">
                              <Text fontSize="sm" color={textColor}>Budget Utilization</Text>
                              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                78.2%
                              </Text>
                              <Text fontSize="xs" color={textColor}>
                                Of allocated budget
                              </Text>
                            </Box>
                            
                            <Box p={4} bg={headerBg} borderRadius="lg">
                              <Text fontSize="sm" color={textColor}>Cost per Member</Text>
                              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                ₦3,804
                              </Text>
                              <Text fontSize="xs" color={textColor}>
                                Monthly operational cost
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                </TabPanel>

                {/* Recent Transactions Tab */}
                <TabPanel px={0}>
                  <Card bg={cardBg} shadow="sm">
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="sm">Recent Transactions</Heading>
                        <Button size="sm" variant="outline" borderRadius="xl">
                          View All
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple">
                          <Thead bg={headerBg}>
                            <Tr>
                              <Th>Type</Th>
                              <Th>Description</Th>
                              <Th>Category</Th>
                              <Th>Member</Th>
                              <Th>Amount</Th>
                              <Th>Date</Th>
                              <Th>Status</Th>
                              <Th>Reference</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {recentTransactions.map((transaction) => (
                              <Tr key={transaction.id}>
                                <Td>
                                  <HStack>
                                    <Icon
                                      as={getTransactionIcon(transaction.type)}
                                      color={`${getTransactionColor(transaction.type)}.500`}
                                    />
                                    <Text fontSize="sm" textTransform="capitalize">
                                      {transaction.type}
                                    </Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" noOfLines={1}>
                                    {transaction.description}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge size="sm" variant="outline">
                                    {transaction.category}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {transaction.member || '-'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    color={`${getTransactionColor(transaction.type)}.500`}
                                  >
                                    {transaction.type === 'income' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={getStatusColor(transaction.status)}
                                    size="sm"
                                  >
                                    {transaction.status}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color={textColor}>
                                    {transaction.reference}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default ModernFinancesDashboard;
