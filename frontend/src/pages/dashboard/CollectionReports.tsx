import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Select,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  Progress,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { 
  FaChartBar,
  FaMapMarkedAlt,
  FaFileExport
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import financialService from '../../services/financial.service';

interface CollectionData {
  period: string;
  collected: number;
  target: number;
  percentage: number;
}

interface StateCollectionData {
  state: string;
  collected: number;
  outstanding: number;
  pharmacyCount: number;
}

const CollectionReports: React.FC = () => {
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [stateData, setStateData] = useState<StateCollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState<'monthly' | 'quarterly' | 'yearly'>(
    'monthly'
  );

  // Chakra UI hooks
  const toast = useToast();
  
  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

  const processCollectionData = useCallback(
    (analytics: Record<string, unknown>): CollectionData[] => {
      if (viewType === 'monthly') {
        return (
          (analytics.monthlyData as Record<string, unknown>[])?.map(
            (item: Record<string, unknown>, index: number) => ({
              period: (item.month as string) || `Month ${index + 1}`,
              collected: (item.amount as number) || 0,
              target: 500000, // Mock target
              percentage: (((item.amount as number) || 0) / 500000) * 100,
            })
          ) || []
        );
      } else if (viewType === 'quarterly') {
        // Mock quarterly data
        return [
          {
            period: 'Q1',
            collected: 1500000,
            target: 1500000,
            percentage: 100,
          },
          {
            period: 'Q2',
            collected: 1800000,
            target: 1500000,
            percentage: 120,
          },
          { period: 'Q3', collected: 1200000, target: 1500000, percentage: 80 },
          {
            period: 'Q4',
            collected: 1600000,
            target: 1500000,
            percentage: 107,
          },
        ];
      } else {
        // Yearly data
        return years.map((year) => ({
          period: year.toString(),
          collected: Math.floor(Math.random() * 5000000) + 3000000,
          target: 6000000,
          percentage: Math.floor(Math.random() * 40) + 60,
        }));
      }
    },
    [viewType, years]
  );

  const fetchCollectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data
      const analytics = await financialService.getDueAnalytics(selectedYear);

      // Process collection data based on view type
      const processedData = processCollectionData(analytics);
      setCollectionData(processedData);

      // Mock state-wise data for now
      const mockStateData: StateCollectionData[] = [
        {
          state: 'Lagos',
          collected: 2500000,
          outstanding: 500000,
          pharmacyCount: 150,
        },
        {
          state: 'Abuja',
          collected: 1800000,
          outstanding: 300000,
          pharmacyCount: 85,
        },
        {
          state: 'Kano',
          collected: 1200000,
          outstanding: 400000,
          pharmacyCount: 70,
        },
        {
          state: 'Rivers',
          collected: 1000000,
          outstanding: 200000,
          pharmacyCount: 60,
        },
        {
          state: 'Oyo',
          collected: 800000,
          outstanding: 250000,
          pharmacyCount: 55,
        },
      ];      setStateData(mockStateData);
    } catch (err) {
      const errorMessage = 'Failed to fetch collection data';
      setError(errorMessage);
      toast({
        title: 'Error Loading Data',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching collection data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, processCollectionData]);

  useEffect(() => {
    fetchCollectionData();
  }, [fetchCollectionData]);

  const exportReport = () => {
    const csvContent = [
      ['Collection Reports Summary'],
      ['Year:', selectedYear.toString()],
      ['View Type:', viewType],
      [''],
      ['Period-wise Collections'],
      ['Period', 'Collected', 'Target', 'Percentage'],
      ...collectionData.map((item) => [
        item.period,
        `₦${item.collected.toLocaleString()}`,
        `₦${item.target.toLocaleString()}`,
        `${item.percentage.toFixed(1)}%`,
      ]),
      [''],
      ['State-wise Collections'],
      ['State', 'Collected', 'Outstanding', 'Pharmacy Count'],
      ...stateData.map((item) => [
        item.state,
        `₦${item.collected.toLocaleString()}`,
        `₦${item.outstanding.toLocaleString()}`,
        item.pharmacyCount.toString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-reports-${selectedYear}-${viewType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalCollected = collectionData.reduce(
    (sum, item) => sum + item.collected,
    0
  );
  const totalTarget = collectionData.reduce(
    (sum, item) => sum + item.target,
    0
  );
  const overallPercentage =
    totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;
  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="7xl" py={{ base: 4, md: 8 }}>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" fontWeight="medium">Loading collection reports...</Text>
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
                onClick={fetchCollectionData}
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
                Collection Reports
              </Heading>
              <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                Track and analyze pharmacy dues collection performance
              </Text>
            </VStack>
            <Button
              leftIcon={<Icon as={FaFileExport} />}
              onClick={exportReport}
              colorScheme="blue"
              variant="solid"
              size={{ base: 'sm', md: 'md' }}
            >
              Export Report
            </Button>
          </Flex>

          {/* Filters */}
          <Card bg={cardBg} shadow="sm" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Year</FormLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={borderColor}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">View Type</FormLabel>
                  <Select
                    value={viewType}
                    onChange={(e) =>
                      setViewType(e.target.value as 'monthly' | 'quarterly' | 'yearly')
                    }
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={borderColor}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.500" fontSize="sm">Total Collected</StatLabel>
                  <StatNumber color="green.500" fontSize={{ base: 'xl', md: '2xl' }}>
                    ₦{totalCollected.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <Icon as={FaChartBar} mr={1} />
                    Current period
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.500" fontSize="sm">Total Target</StatLabel>
                  <StatNumber color="blue.500" fontSize={{ base: 'xl', md: '2xl' }}>
                    ₦{totalTarget.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <Icon as={FaChartBar} mr={1} />
                    Expected amount
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.500" fontSize="sm">Achievement Rate</StatLabel>
                  <StatNumber color="purple.500" fontSize={{ base: 'xl', md: '2xl' }}>
                    {overallPercentage.toFixed(1)}%
                  </StatNumber>
                  <StatHelpText>
                    <Progress 
                      value={overallPercentage} 
                      colorScheme="purple" 
                      size="sm" 
                      borderRadius="full"
                      mt={2}
                    />
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.500" fontSize="sm">Active States</StatLabel>
                  <StatNumber color="gray.700" fontSize={{ base: 'xl', md: '2xl' }}>
                    {stateData.length}
                  </StatNumber>
                  <StatHelpText>
                    <Icon as={FaMapMarkedAlt} mr={1} />
                    Reporting states
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>          {/* Charts */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Collection vs Target Chart */}
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">
                  Collection vs Target ({viewType})
                </Heading>
              </CardHeader>
              <CardBody>
                <Box h="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis
                        tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          `${name}: ${value}`,
                          `Total: ${value}`,
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="collected" fill="#10b981" name="collected" />
                      <Bar dataKey="target" fill="#3b82f6" name="target" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>

            {/* Achievement Percentage Trend */}
            <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Achievement Trend</Heading>
              </CardHeader>
              <CardBody>
                <Box h="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={collectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value: any) => [
                          `${value.toFixed(1)}%`,
                          'Achievement',
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* State-wise Collections Chart */}
          <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">State-wise Collections</Heading>
            </CardHeader>
            <CardBody>
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis
                      tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `${name}: ${value}`,
                        `Total: ${value}`,
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="collected" />
                    <Bar dataKey="outstanding" fill="#f59e0b" name="outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* State-wise Details Table */}
          <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">State-wise Collection Details</Heading>
            </CardHeader>
            <CardBody px={0}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>State</Th>
                      <Th>Collected</Th>
                      <Th>Outstanding</Th>
                      <Th>Pharmacies</Th>
                      <Th>Collection Rate</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stateData.map((state) => {
                      const total = state.collected + state.outstanding;
                      const rate = total > 0 ? (state.collected / total) * 100 : 0;

                      return (
                        <Tr key={state.state}>
                          <Td fontWeight="medium">{state.state}</Td>
                          <Td color="green.500">₦{state.collected.toLocaleString()}</Td>
                          <Td color="yellow.500">₦{state.outstanding.toLocaleString()}</Td>
                          <Td color="gray.600">{state.pharmacyCount}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Progress 
                                value={Math.min(rate, 100)} 
                                colorScheme="green" 
                                size="sm" 
                                w="60px"
                                borderRadius="full"
                              />
                              <Text fontSize="sm" color="gray.600">
                                {rate.toFixed(1)}%
                              </Text>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>  );
};

export default CollectionReports;
