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
  Badge,
  Avatar,
  Button,
  Icon,
  Progress,
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
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatsCard from '../../components/dashboard/StatsCard';
import memberDashboardService from '../../services/memberDashboard.service';

// Types
interface MemberDashboardStats {
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  upcomingEvents: number;
  attendedEvents: number;
  missedEvents: number;
  documentsCount: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status?: string;
  }>;
}

const ModernMemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MemberDashboardStats>({
    totalDue: 0,
    totalPaid: 0,
    remainingBalance: 0,
    upcomingEvents: 0,
    attendedEvents: 0,
    missedEvents: 0,
    documentsCount: 0,
    recentActivity: [],
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const gradientBg = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);        const data = await memberDashboardService.getMemberDashboardStats();
        setStats(data as unknown as MemberDashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading your dashboard...</Text>
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
                <Badge colorScheme="whiteAlpha" variant="solid">
                  {user?.role || 'Member'}
                </Badge>
                {user?.pharmacy && (
                  <Badge colorScheme="whiteAlpha" variant="outline">
                    {user.pharmacy.name}
                  </Badge>
                )}
              </HStack>
            </VStack>
            <Avatar
              size="xl"
              name={`${user?.firstName} ${user?.lastName}`}
              src={user?.profilePicture}
              border="4px solid"
              borderColor="whiteAlpha.300"
            />
          </Flex>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>        <StatsCard
          title="Outstanding Dues"
          value={`₦${(stats?.remainingBalance || 0).toLocaleString()}`}
          icon={FiDollarSign}
          iconColor="red.500"
          progress={stats?.totalDue > 0 ? (((stats?.totalPaid || 0) / (stats?.totalDue || 1)) * 100) : 0}
          progressColor="red"
        />
        <StatsCard
          title="Total Paid"
          value={`₦${(stats?.totalPaid || 0).toLocaleString()}`}
          icon={FiCheckCircle}
          iconColor="green.500"
        />        <StatsCard
          title="Upcoming Events"
          value={stats?.upcomingEvents || 0}
          icon={FiCalendar}
          iconColor="blue.500"
        />
        <StatsCard
          title="My Documents"
          value={stats?.documentsCount || 0}
          icon={FiFileText}
          iconColor="purple.500"
        />
      </SimpleGrid>

      {/* Quick Actions & Recent Activity */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Quick Actions */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Quick Actions
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={3} align="stretch">
              <Button
                leftIcon={<FiDollarSign />}
                rightIcon={<FiArrowRight />}
                justifyContent="space-between"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/payments')}
              >
                Make Payment
              </Button>
              <Button
                leftIcon={<FiCalendar />}
                rightIcon={<FiArrowRight />}
                justifyContent="space-between"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/member/events')}
              >
                View Events
              </Button>
              <Button
                leftIcon={<FiFileText />}
                rightIcon={<FiArrowRight />}
                justifyContent="space-between"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/my-documents')}
              >
                My Documents
              </Button>
              <Button
                leftIcon={<FiTrendingUp />}
                rightIcon={<FiArrowRight />}
                justifyContent="space-between"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/profile')}
              >
                Update Profile
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Recent Activity
            </Text>
          </CardHeader>
          <CardBody pt={0}>            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No recent activity
              </Text>
            ) : (
              <List spacing={3}>
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id}>
                    <HStack spacing={3}>
                      <ListIcon
                        as={activity.type === 'payment' ? FiDollarSign :
                           activity.type === 'event' ? FiCalendar :
                           activity.type === 'document' ? FiFileText : FiClock}
                        color="brand.500"
                      />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="500">
                          {activity.title}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {activity.description}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </Text>
                      </VStack>
                      {activity.status && (
                        <Badge
                          size="sm"
                          colorScheme={
                            activity.status === 'completed' ? 'green' :
                            activity.status === 'pending' ? 'yellow' : 'red'
                          }
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </HStack>
                    <Divider mt={3} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Events & Attendance */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Event Attendance */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Text fontSize="lg" fontWeight="600">
              Event Attendance
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={1}>                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {stats?.attendedEvents || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Attended
                  </Text>
                </VStack>
                <VStack align="center" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {stats?.upcomingEvents || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Upcoming
                  </Text>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {stats?.missedEvents || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Missed
                  </Text>
                </VStack>
              </HStack>
                {((stats?.attendedEvents || 0) + (stats?.missedEvents || 0)) > 0 && (
                <Box w="full">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Attendance Rate
                  </Text>
                  <Progress
                    value={
                      ((stats?.attendedEvents || 0) / 
                      ((stats?.attendedEvents || 0) + (stats?.missedEvents || 0))) * 100
                    }
                    colorScheme="green"
                    size="lg"
                    borderRadius="full"
                  />
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="600">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Badge colorScheme="red">{unreadCount}</Badge>
              )}
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={3} align="stretch">
              <HStack>
                <Icon as={FiAlertCircle} color="orange.500" />                <Text fontSize="sm">
                  You have {(stats?.remainingBalance || 0) > 0 ? 'outstanding dues' : 'no outstanding dues'}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FiCalendar} color="blue.500" />
                <Text fontSize="sm">
                  {stats?.upcomingEvents || 0} upcoming events this month
                </Text>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/notifications')}
              >
                View All Notifications
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default ModernMemberDashboard;
