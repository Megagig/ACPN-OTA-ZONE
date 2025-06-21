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
  FiActivity,
  FiArrowRight,
} from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/dashboard/StatsCard';
import dashboardService, { type ActivityItem } from '../../services/dashboard.service';

interface DashboardStats {
  totalPharmacies: number;
  totalMembers: number;
  upcomingEvents: number;
  activeElections: number;
  totalDuesPaid: number;
  pendingApprovals: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'payment' | 'event' | 'poll' | 'pharmacy_approval';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPharmacies: 0,
    totalMembers: 0,
    upcomingEvents: 0,
    activeElections: 0,
    totalDuesPaid: 0,
    pendingApprovals: 0,
    monthlyGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
        const [statsData, activityData] = await Promise.all([
        dashboardService.getOverviewStats(),
        dashboardService.getRecentActivity(),
      ]);

      if (statsData) {
        setStats({
          totalPharmacies: statsData.totalPharmacies,
          totalMembers: statsData.totalUsers,
          upcomingEvents: statsData.upcomingEvents,
          activeElections: 0, // Not available in current stats
          totalDuesPaid: statsData.totalDuesCollected,
          pendingApprovals: statsData.pendingApprovals,
          monthlyGrowth: 5.2, // Mock data for now
        });
      }      if (activityData) {
        const transformedActivity = activityData.map((item: ActivityItem) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: typeof item.description === 'string' ? item.description : item.title,
          timestamp: item.timestamp,
          user: undefined, // ActivityItem doesn't have user info
        }));
        setRecentActivity(transformedActivity);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return FiUsers;
      case 'pharmacy_approval':
        return HiOutlineOfficeBuilding;
      case 'event':
        return FiCalendar;
      case 'payment':
        return FiDollarSign;
      case 'poll':
        return FiActivity;
      default:
        return FiActivity;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return 'blue';
      case 'pharmacy_approval':
        return 'green';
      case 'event':
        return 'purple';
      case 'payment':
        return 'orange';
      case 'poll':
        return 'teal';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <VStack align="stretch" spacing={6} mb={8}>
        <Box>
          <Heading size="lg" mb={2}>
            Welcome back, {user?.firstName || 'Admin'}!
          </Heading>
          <Text color="gray.600">
            Here's what's happening with your ACPN organization today.
          </Text>
        </Box>
      </VStack>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>        <StatsCard
          title="Total Members"
          value={stats.totalMembers.toString()}
          icon={FiUsers}
          change={stats.monthlyGrowth}
          changeText="increase"
        />
        <StatsCard
          title="Registered Pharmacies"
          value={stats.totalPharmacies.toString()}
          icon={HiOutlineOfficeBuilding}
          change={12}
          changeText="increase"
        />
        <StatsCard
          title="Upcoming Events"
          value={stats.upcomingEvents.toString()}
          icon={FiCalendar}
          change={3}
          changeText="increase"
        />
        <StatsCard
          title="Dues Collected"
          value={`₦${stats.totalDuesPaid.toLocaleString()}`}
          icon={FiDollarSign}
          change={8.2}
          changeText="increase"
        />
      </SimpleGrid>

      {/* Content Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Quick Actions */}
        <Card bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3}>
              <Button
                as={RouterLink}
                to="/admin/users"
                leftIcon={<Icon as={FiUsers} />}
                rightIcon={<Icon as={FiArrowRight} />}
                colorScheme="blue"
                variant="outline"
                width="full"
                justifyContent="space-between"
              >
                Manage Users
              </Button>
              <Button
                as={RouterLink}
                to="/admin/pharmacies"
                leftIcon={<Icon as={HiOutlineOfficeBuilding} />}
                rightIcon={<Icon as={FiArrowRight} />}
                colorScheme="green"
                variant="outline"
                width="full"
                justifyContent="space-between"
              >
                Manage Pharmacies
              </Button>
              <Button
                as={RouterLink}
                to="/admin/events"
                leftIcon={<Icon as={FiCalendar} />}
                rightIcon={<Icon as={FiArrowRight} />}
                colorScheme="purple"
                variant="outline"
                width="full"
                justifyContent="space-between"
              >
                Create Event
              </Button>
              <Button
                as={RouterLink}
                to="/admin/dues-management"
                leftIcon={<Icon as={FiDollarSign} />}
                rightIcon={<Icon as={FiArrowRight} />}
                colorScheme="orange"
                variant="outline"
                width="full"
                justifyContent="space-between"
              >
                Manage Dues
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            {recentActivity.length > 0 ? (
              <List spacing={3}>
                {recentActivity.slice(0, 6).map((activity) => (
                  <ListItem key={activity.id}>
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        src={activity.user?.avatar}
                        name={activity.user?.name}
                        bg={`${getActivityColor(activity.type)}.500`}
                        icon={<Icon as={getActivityIcon(activity.type)} />}
                      />                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {activity.title || activity.description}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <Badge
                        colorScheme={getActivityColor(activity.type)}
                        variant="subtle"
                      >
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="gray.500" textAlign="center" py={4}>
                No recent activity
              </Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <Alert status="warning" borderRadius="md" mt={6}>
          <AlertIcon />
          <AlertTitle>Pending Approvals!</AlertTitle>
          <AlertDescription>
            You have {stats.pendingApprovals} pending approvals that require your attention.
          </AlertDescription>
          <Button
            as={RouterLink}
            to="/admin/users"
            size="sm"
            colorScheme="orange"
            variant="solid"
            ml="auto"
          >
            Review
          </Button>
        </Alert>
      )}

      {/* System Health */}
      <Card bg={bgColor} borderColor={borderColor} mt={6}>
        <CardHeader>
          <Heading size="md">System Health</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Box width="full">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">Server Performance</Text>
                <Text fontSize="sm" color="green.500">98%</Text>
              </HStack>
              <Progress value={98} colorScheme="green" size="sm" />
            </Box>
            <Box width="full">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">Database Health</Text>
                <Text fontSize="sm" color="green.500">95%</Text>
              </HStack>
              <Progress value={95} colorScheme="green" size="sm" />
            </Box>
            <Box width="full">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">API Response Time</Text>
                <Text fontSize="sm" color="yellow.500">87%</Text>
              </HStack>
              <Progress value={87} colorScheme="yellow" size="sm" />
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
