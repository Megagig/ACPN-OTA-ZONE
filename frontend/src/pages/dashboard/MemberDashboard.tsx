import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Stat,
  StatLabel,
  Button,
  Badge,
  Avatar,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertDescription,
  Icon,
  useColorModeValue,
  Divider,
  List,
  ListItem,
  Stack
} from '@chakra-ui/react';
import {
  FaWallet,
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaTicketAlt,
  FaFileAlt,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaUserCheck
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { EventService } from '../../services/event.service';
import documentService from '../../services/document.service';
import pharmacyService from '../../services/pharmacy.service';
import memberDashboardService from '../../services/memberDashboard.service';
import NotificationWidget from '../../components/notifications/NotificationWidget';
import LoginNotificationModal from '../../components/notifications/LoginNotificationModal';

// Types
import type { Event } from '../../types/event.types';
import type { Payment } from '../../types/financial.types';
import type { Pharmacy } from '../../types/pharmacy.types';

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

const MemberDashboard: React.FC = () => {  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  // Detailed data states
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const welcomeBg = useColorModeValue(
    'linear(to-r, blue.500, purple.600)',
    'linear(to-r, blue.600, purple.700)'
  );

  // Check for login notifications
  useEffect(() => {
    const checkLoginNotifications = async () => {
      if (user && unreadCount > 0) {
        // Check if this is a recent login (within last 5 minutes)
        const loginTime = sessionStorage.getItem('loginTime');
        const now = new Date().getTime();

        if (loginTime && now - parseInt(loginTime) < 5 * 60 * 1000) {
          // Show modal for recent logins with unread notifications
          setShowLoginModal(true);
          // Clear the login time so modal doesn't show again
          sessionStorage.removeItem('loginTime');
        }
      }
    };

    checkLoginNotifications();
  }, [user, unreadCount]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        setError(null);

        // Create a safe version of Promise.all that doesn't fail if one promise fails
        const safePromiseAll = async (promises: Promise<any>[]) => {
          return Promise.all(
            promises.map((promise: Promise<any>) =>
              promise.catch((error: any) => {
                console.warn(
                  'Error in one of the dashboard data requests:',
                  error
                );
                return null; // Return null instead of rejecting
              })
            )
          );
        };

        // Fetch multiple data sources in parallel with error handling for each
        const [
          memberDashboardStats,
          eventsData,
          memberPaymentsData,
          documentsData,
          pharmacyData,
        ] = await safePromiseAll([
          memberDashboardService.getMemberDashboardStats().catch(() => ({
            userFinancialSummary: {
              totalDue: 0,
              totalPaid: 0,
              remainingBalance: 0,
            },
            userAttendanceSummary: { attended: 0, missed: 0 },
            upcomingEvents: 0,
            recentActivity: [],
          })),
          EventService.getAllEvents({ status: 'published' }, 1, 5).catch(
            () => ({ data: [] })
          ),
          memberDashboardService
            .getMemberPayments(1, 5)
            .catch(() => ({ payments: [] })),
          documentService
            .getDocuments({ accessLevel: 'members' })
            .catch(() => []),
          pharmacyService.getPharmacyByUser().catch(() => null),
        ]);

        // Process upcoming events
        const upcoming = (eventsData?.data || [])
          .filter((event: Event) => {
            try {
              return event?.startDate && new Date(event.startDate) > new Date();
            } catch {
              return false;
            }
          })
          .slice(0, 3);        setUpcomingEvents(upcoming);

        // Set payments and pharmacy data
        setRecentPayments(memberPaymentsData?.payments || []);
        setPharmacy(pharmacyData || null);        // Calculate aggregated stats from member dashboard data
        const { userFinancialSummary, userAttendanceSummary, recentActivity } =
          memberDashboardStats || {};

        setStats({
          totalDue: userFinancialSummary?.totalDue || 0,
          totalPaid: userFinancialSummary?.totalPaid || 0,
          remainingBalance: userFinancialSummary?.remainingBalance || 0,
          upcomingEvents: upcoming.length,
          attendedEvents: userAttendanceSummary?.attended || 0,
          missedEvents: userAttendanceSummary?.missed || 0,
          documentsCount: documentsData?.length || 0,
          recentActivity: recentActivity || [],
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?._id]);
  // Format currency function
  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };
  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };
  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="7xl" py={{ base: 4, md: 8 }}>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" fontWeight="medium">Loading dashboard...</Text>
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
                onClick={() => window.location.reload()}
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
        <VStack spacing={8} align="stretch">
          {showLoginModal && (
            <LoginNotificationModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
            />
          )}

          {/* Welcome Section */}
          <Card bgGradient={welcomeBg} color="white" shadow="lg">
            <CardBody p={8}>
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ base: 'start', md: 'center' }}
                gap={6}
              >
                <VStack align="start" spacing={3}>
                  <Heading size={{ base: 'lg', md: 'xl' }}>
                    Welcome back, {user?.firstName || 'Member'}!
                  </Heading>
                  <Text fontSize={{ base: 'md', md: 'lg' }} opacity={0.9}>
                    Here's an overview of your account and recent activities
                  </Text>
                </VStack>                {pharmacy && (
                  <Card bg="whiteAlpha.200" backdropFilter="blur(10px)">
                    <CardBody p={4}>
                      <VStack spacing={1}>
                        <Text fontSize="sm" opacity={0.8}>
                          Registered pharmacy
                        </Text>
                        <Text fontWeight="medium" textAlign="center">
                          {pharmacy.name}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </Flex>
            </CardBody>
          </Card>          {/* Quick Stats Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            {/* Financial Summary */}
            <GridItem>
              <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor} h="full">
                <CardBody>
                  <Stat>
                    <HStack spacing={3} mb={4}>
                      <Icon as={FaWallet} boxSize={6} color="blue.500" />
                      <StatLabel fontSize="md" fontWeight="semibold">Financial Status</StatLabel>
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.500">Total Due</Text>
                        <Text fontWeight="medium">{formatCurrency(stats?.totalDue || 0)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.500">Amount Paid</Text>
                        <Text fontWeight="medium">{formatCurrency(stats?.totalPaid || 0)}</Text>
                      </Flex>
                      <Divider />                      <Flex justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Balance</Text>
                        <Text 
                          fontWeight="bold" 
                          color={(stats?.remainingBalance || 0) > 0 ? "red.500" : "green.500"}
                        >
                          {formatCurrency(stats?.remainingBalance || 0)}
                        </Text>
                      </Flex>
                    </VStack>
                    
                    <Button
                      mt={4}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      w="full"
                      onClick={() => navigate('/payments')}
                    >
                      View Payment History
                    </Button>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            {/* Event Attendance */}
            <GridItem>
              <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor} h="full">
                <CardBody>
                  <Stat>
                    <HStack spacing={3} mb={4}>
                      <Icon as={FaCalendarAlt} boxSize={6} color="green.500" />
                      <StatLabel fontSize="md" fontWeight="semibold">Event Attendance</StatLabel>
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.500">Attended</Text>
                        <Text fontWeight="medium" color="green.500">{stats?.attendedEvents || 0}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.500">Missed</Text>
                        <Text fontWeight="medium" color="red.500">{stats?.missedEvents || 0}</Text>
                      </Flex>
                      <Divider />
                      <Flex justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Upcoming</Text>
                        <Text fontWeight="bold" color="blue.500">{stats?.upcomingEvents || 0}</Text>
                      </Flex>
                    </VStack>
                    
                    <Button
                      mt={4}
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      w="full"
                      onClick={() => navigate('/dashboard/attendance-status')}
                    >
                      View Attendance Record
                    </Button>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            {/* Notifications Widget */}
            <GridItem>
              <NotificationWidget />
            </GridItem>

            {/* Quick Access & Profile */}
            <GridItem>
              <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor} h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <HStack spacing={3}>
                      <Icon as={FaUser} boxSize={6} color="purple.500" />
                      <Text fontSize="md" fontWeight="semibold">My Profile</Text>
                    </HStack>
                    
                    <VStack spacing={3}>
                      <Avatar
                        size="lg"
                        name={`${user?.firstName} ${user?.lastName}`}
                        bg="blue.500"
                        color="white"
                      />
                      <VStack spacing={1}>
                        <Text fontWeight="medium" textAlign="center">
                          {user?.firstName} {user?.lastName}
                        </Text>
                        <Badge colorScheme="blue" textTransform="capitalize">
                          {user?.role || 'Member'}
                        </Badge>
                      </VStack>
                    </VStack>
                    
                    <Stack spacing={2} w="full">
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FaBuilding} />}
                        variant="ghost"
                        onClick={() => navigate('/my-pharmacy')}
                        justifyContent="flex-start"
                      >
                        My Pharmacy
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FaTicketAlt} />}
                        variant="ghost"
                        onClick={() => navigate('/member/events')}
                        justifyContent="flex-start"
                      >
                        Event Registration
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FaFileAlt} />}
                        variant="ghost"
                        onClick={() => navigate('/my-documents')}
                        justifyContent="flex-start"
                      >
                        My Documents
                      </Button>
                    </Stack>
                    
                    <Button
                      size="sm"
                      colorScheme="purple"
                      variant="outline"
                      w="full"
                      onClick={() => navigate('/profile')}
                    >
                      Edit My Profile
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>          {/* Upcoming Events and Recent Payments Section */}
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            {/* Upcoming Events */}
            <GridItem>
              <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor} h="full">
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Upcoming Events</Heading>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => navigate('/member/events')}
                    >
                      View All
                    </Button>
                  </Flex>
                </CardHeader>
                  <CardBody pt={0}>
                  {upcomingEvents?.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {upcomingEvents.map((event) => (
                        <Card key={event._id} variant="outline" size="sm">
                          <CardBody>
                            <HStack spacing={4}>
                              <Icon as={FaCalendarAlt} color="blue.500" boxSize={5} />
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontWeight="medium" noOfLines={2}>
                                  {event.title}
                                </Text>
                                <HStack spacing={4} fontSize="sm" color="gray.500">
                                  <HStack spacing={1}>
                                    <Icon as={FaClock} boxSize={3} />
                                    <Text>{formatDate(event.startDate)}</Text>
                                  </HStack>
                                  {event.location && (
                                    <HStack spacing={1}>
                                      <Icon as={FaMapMarkerAlt} boxSize={3} />
                                      <Text noOfLines={1}>
                                        {event.location?.name || event.location?.address || 'Virtual'}
                                      </Text>
                                    </HStack>
                                  )}
                                </HStack>
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => navigate(`/member/events/${event._id}`)}
                                >
                                  View Details
                                </Button>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Icon as={FaCalendarAlt} boxSize={12} color="gray.300" />
                        <Text color="gray.500" textAlign="center">
                          No upcoming events scheduled.
                        </Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </GridItem>

            {/* Recent Payments */}
            <GridItem>
              <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor} h="full">
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Recent Payments</Heading>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => navigate('/payments')}
                    >
                      View All
                    </Button>
                  </Flex>
                </CardHeader>
                  <CardBody pt={0}>
                  {recentPayments?.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {recentPayments.map((payment) => (
                        <Card key={payment._id} variant="outline" size="sm">
                          <CardBody>
                            <HStack spacing={4}>
                              <Icon as={FaMoneyBillWave} color="green.500" boxSize={5} />
                              <VStack align="start" spacing={1} flex={1}>
                                <Flex justify="space-between" w="full" align="center">                                  <Text fontWeight="medium" noOfLines={1}>
                                    {payment?.paymentMethod || 'Payment'}
                                  </Text>                                  <Badge
                                    colorScheme={
                                      (payment?.status || payment?.approvalStatus) === 'approved'
                                        ? 'green'
                                        : (payment?.status || payment?.approvalStatus) === 'pending'
                                        ? 'yellow'
                                        : 'red'
                                    }
                                    size="sm"
                                  >
                                    {payment?.status || payment?.approvalStatus || 'Pending'}
                                  </Badge>
                                </Flex>
                                <HStack spacing={4} fontSize="sm" color="gray.500">
                                  <HStack spacing={1}>
                                    <Icon as={FaClock} boxSize={3} />                                    <Text>
                                      {payment?.paymentDate
                                        ? formatDate(payment.paymentDate)
                                        : formatDate(payment?.createdAt)}
                                    </Text>
                                  </HStack>
                                </HStack>
                                <Text fontWeight="medium" color="green.600">
                                  {formatCurrency(payment?.amount || 0)}
                                </Text>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Icon as={FaMoneyBillWave} boxSize={12} color="gray.300" />
                        <Text color="gray.500" textAlign="center">
                          No recent payment records.
                        </Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>          {/* Recent Activity Section */}
          <Card bg={cardBg} shadow="md" borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <VStack align="start" spacing={2}>
                <Heading size="md">Recent Activity</Heading>
                <Text fontSize="sm" color="gray.500">
                  Latest updates and system activities.
                </Text>
              </VStack>
            </CardHeader>
            
            <CardBody pt={0}>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <List spacing={4}>
                  {stats.recentActivity.map((activity) => (
                    <ListItem                      key={activity?.id}
                      p={4}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                      transition="all 0.2s"
                    >
                      <Flex justify="space-between" align="start" gap={4}>
                        <VStack align="start" spacing={2} flex={1}>
                          <Flex justify="space-between" w="full" align="center">
                            <Text fontWeight="medium" color="blue.500" noOfLines={2}>
                              {activity?.title}
                            </Text>
                            <Badge
                              colorScheme={
                                activity?.status === 'success' || activity?.status === 'completed'
                                  ? 'green'
                                  : activity?.status === 'pending'
                                  ? 'yellow'
                                  : activity?.status === 'error'
                                  ? 'red'
                                  : 'blue'
                              }
                              size="sm"
                            >
                              {activity?.status || 'Activity'}
                            </Badge>
                          </Flex>
                            <Text fontSize="sm" color="gray.600" noOfLines={3}>
                            {(() => {
                              try {
                                if (
                                  typeof activity?.description === 'object' &&
                                  activity?.description !== null
                                ) {
                                  return JSON.stringify(activity?.description);
                                }
                                return (
                                  activity?.description?.toString() ||
                                  'No description'
                                );
                              } catch (error) {
                                return 'Activity description unavailable';
                              }
                            })()}
                          </Text>
                          
                          <HStack spacing={1} fontSize="sm" color="gray.500">
                            <Icon as={FaClock} boxSize={3} />
                            <Text>{formatDate(activity?.timestamp)}</Text>
                          </HStack>
                        </VStack>
                      </Flex>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Icon as={FaUserCheck} boxSize={12} color="gray.300" />
                    <Text color="gray.500" textAlign="center">
                      No recent activity to display.
                    </Text>
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default MemberDashboard;
