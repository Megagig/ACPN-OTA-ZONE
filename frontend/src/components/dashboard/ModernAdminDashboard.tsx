import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  VStack,
  HStack,
  Icon,
  Progress,
  Avatar,
  Badge,
  Button,
  Flex,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  List,
  ListItem,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/dashboard/StatsCard';
import dashboardService from '../../services/dashboard.service';

interface DashboardStats {
  totalPharmacies: number;
  totalMembers: number;
  upcomingEvents: number;
  activeElections: number;
  totalDuesPaid: number;
  pendingApprovals: number;
  monthlyGrowth: number;
  recentActivities: Array<{
    id: string;
    type: string;
    user: string;
    action: string;
    timestamp: string;
    avatar?: string;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    role: string;
    score: number;
    avatar?: string;
  }>;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  path: string;
  count?: number;
}

const ModernAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPharmacies: 0,
    totalMembers: 0,
    upcomingEvents: 0,
    activeElections: 0,
    totalDuesPaid: 0,
    pendingApprovals: 0,
    monthlyGrowth: 0,
    recentActivities: [],
    topPerformers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const gradientBg = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const overviewStats = await dashboardService.getOverviewStats();
        setStats({
          totalPharmacies: overviewStats.totalPharmacies || 0,
          totalMembers: overviewStats.totalUsers || 0,
          upcomingEvents: overviewStats.upcomingEvents || 0,
          activeElections: overviewStats.activePolls || 0,
          totalDuesPaid: overviewStats.totalDuesCollected || 0,
          pendingApprovals: overviewStats.pendingApprovals || 0,
          monthlyGrowth: 12.5, // Mock data
          recentActivities: [
            {
              id: '1',
              type: 'registration',
              user: 'John Doe',
              action: 'registered a new pharmacy',
              timestamp: new Date().toISOString(),
            },
            {
              id: '2',
              type: 'payment',
              user: 'Jane Smith',
              action: 'made a dues payment',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
            {
              id: '3',
              type: 'event',
              user: 'Admin',
              action: 'created a new event',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
          ],
          topPerformers: [
            { id: '1', name: 'John Doe', role: 'Member', score: 95 },
            { id: '2', name: 'Jane Smith', role: 'Treasurer', score: 92 },
            { id: '3', name: 'Bob Johnson', role: 'Secretary', score: 88 },
          ],
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'Pending Approvals',
      description: 'Review new member registrations',
      icon: FiClock,
      color: 'orange',
      path: '/admin/users',
      count: stats.pendingApprovals,
    },
    {
      title: 'Create Event',
      description: 'Schedule a new event or meeting',
      icon: FiCalendar,
      color: 'blue',
      path: '/admin/events/create',
    },
    {
      title: 'Financial Reports',
      description: 'View financial analytics',
      icon: FiTrendingUp,
      color: 'green',
      path: '/dashboard/financial-reports',
    },
    {
      title: 'Send Communication',
      description: 'Send announcement to members',
      icon: FiActivity,
      color: 'purple',
      path: '/communications/create',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration': return FiUsers;
      case 'payment': return FiDollarSign;
      case 'event': return FiCalendar;
      default: return FiActivity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'registration': return 'blue.500';
      case 'payment': return 'green.500';
      case 'event': return 'purple.500';
      default: return 'gray.500';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading admin dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="xl">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Card
        bg={gradientBg}
        color="white"
        mb={8}
        borderRadius="2xl"
        overflow="hidden"
        position="relative"
      >
        <CardBody p={8}>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Text fontSize="lg" opacity={0.9}>
                {getGreeting()},
              </Text>
              <Heading size="xl">
                {user?.firstName} {user?.lastName}
              </Heading>
              <HStack spacing={4}>
                <Badge colorScheme="whiteAlpha" variant="solid" size="lg">
                  {user?.role || 'Admin'}
                </Badge>
                <Badge colorScheme="whiteAlpha" variant="outline" size="lg">
                  Administrator
                </Badge>
              </HStack>
            </VStack>
            <VStack align="end" spacing={2}>
              <Text fontSize="sm" opacity={0.9}>
                System Status
              </Text>
              <HStack>
                <Icon as={FiCheckCircle} />
                <Text fontSize="sm">All systems operational</Text>
              </HStack>
            </VStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          change={stats.monthlyGrowth}
          changeText="this month"
          icon={FiUsers}
          iconColor="blue.500"
        />
        <StatsCard
          title="Total Pharmacies"
          value={stats.totalPharmacies}
          change={8.2}
          changeText="this month"
          icon={HiOutlineOfficeBuilding}
          iconColor="green.500"
        />
        <StatsCard
          title="Dues Collected"
          value={`₦${stats.totalDuesPaid.toLocaleString()}`}
          change={15.3}
          changeText="this month"
          icon={FiDollarSign}
          iconColor="green.500"
        />
        <StatsCard
          title="Active Events"
          value={stats.upcomingEvents}
          icon={FiCalendar}
          iconColor="purple.500"
        />
      </SimpleGrid>

      {/* Quick Actions */}
      <Card bg={cardBg} mb={8} borderRadius="xl">
        <CardHeader>
          <Text fontSize="lg" fontWeight="600">
            Quick Actions
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                as={RouterLink}
                to={action.path}
                variant="outline"
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'md',
                  borderColor: `${action.color}.300`,
                }}
              >
                <CardBody p={6}>
                  <VStack spacing={3}>
                    <Box
                      p={3}
                      bg={`${action.color}.50`}
                      borderRadius="xl"
                      color={`${action.color}.500`}
                      _dark={{
                        bg: `${action.color}.900`,
                        color: `${action.color}.300`,
                      }}
                    >
                      <Icon as={action.icon} boxSize={6} />
                    </Box>
                    <VStack spacing={1}>
                      <Text fontWeight="600" textAlign="center">
                        {action.title}
                        {action.count !== undefined && (
                          <Badge ml={2} colorScheme={action.color}>
                            {action.count}
                          </Badge>
                        )}
                      </Text>
                      <Text fontSize="sm" color="gray.500" textAlign="center">
                        {action.description}
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Recent Activity & Top Performers */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Recent Activity */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="600">
                Recent Activity
              </Text>
              <Button
                as={RouterLink}
                to="/admin/activity"
                size="sm"
                variant="ghost"
                rightIcon={<FiArrowRight />}
              >
                View All
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            {stats.recentActivities.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No recent activity
              </Text>
            ) : (
              <List spacing={4}>
                {stats.recentActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <HStack spacing={3}>
                      <Box
                        p={2}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="lg"
                        color={getActivityColor(activity.type)}
                      >
                        <Icon as={getActivityIcon(activity.type)} />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="500">
                          <Text as="span" fontWeight="600">
                            {activity.user}
                          </Text>{' '}
                          {activity.action}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>

        {/* Top Performers */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Top Performers
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4}>
              {stats.topPerformers.map((performer, index) => (
                <Flex key={performer.id} w="full" align="center" justify="space-between">
                  <HStack spacing={3}>
                    <Text fontSize="sm" fontWeight="600" color="gray.500" w={4}>
                      #{index + 1}
                    </Text>
                    <Avatar
                      size="sm"
                      name={performer.name}
                      src={performer.avatar}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="600">
                        {performer.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {performer.role}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" spacing={1}>
                    <Text fontSize="sm" fontWeight="600">
                      {performer.score}%
                    </Text>
                    <Progress
                      value={performer.score}
                      size="sm"
                      colorScheme="brand"
                      w="60px"
                      borderRadius="full"
                    />
                  </VStack>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default ModernAdminDashboard;
