import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  List,
  ListItem,
  Button,
  Badge,
  Spinner,
  Stack,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  SimpleGrid,
  Heading,
  Flex,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link as ChakraLink,
  HStack,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaPlus,
  FaEdit,
  FaEye,
  FaArrowRight,
  FaSync,
  FaChartBar,
} from 'react-icons/fa';
import { EventService } from '../../services/event.service';
import type { Event, EventStats } from '../../types/event.types';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  differenceInDays,
} from 'date-fns';

const AdminEventWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allEventsResponse, statsResponse] = await Promise.all([
        EventService.getAllEvents({}, 1, 20),
        EventService.getEventStats().catch(() => null),
      ]);

      const events = allEventsResponse.data;
      const statsData: EventStats = statsResponse || {
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        totalRegistrations: 0,
        totalAttendees: 0,
        eventsByType: {
          conference: 0,
          workshop: 0,
          seminar: 0,
          training: 0,
          meetings: 0,
          state_events: 0,
          social: 0,
          other: 0,
        },
      };

      const recent = events
        .filter((event) => isPast(new Date(event.endDate)))
        .sort(
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        )
        .slice(0, 3);

      const upcoming = events
        .filter((event) => isFuture(new Date(event.startDate)))
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .slice(0, 3);

      setRecentEvents(recent);
      setUpcomingEvents(upcoming);
      setStats(statsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load event data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?._id]);

  const getEventDate = (event: Event) => {
    const startDate = new Date(event.startDate);
    if (isToday(startDate)) return 'Today';
    if (isTomorrow(startDate)) return 'Tomorrow';
    const daysUntil = differenceInDays(startDate, new Date());
    if (daysUntil <= 7 && daysUntil > 0) return `In ${daysUntil} days`;
    if (daysUntil === 0) return 'Today'; // Should be caught by isToday, but as a fallback
    if (daysUntil < 0 && daysUntil >= -7)
      return `${Math.abs(daysUntil)} days ago`;
    return format(startDate, 'MMM dd');
  };

  const getStatusColorScheme = (event: Event): string => {
    if (event.status === 'cancelled') return 'red';
    if (event.status === 'draft') return 'yellow';
    if (isPast(new Date(event.endDate))) return 'gray';
    if (isPast(new Date(event.startDate))) return 'orange'; // Ongoing
    return 'green'; // Upcoming
  };

  const getStatusLabel = (event: Event): string => {
    if (event.status === 'cancelled') return 'Cancelled';
    if (event.status === 'draft') return 'Draft';
    if (isPast(new Date(event.endDate))) return 'Completed';
    if (isPast(new Date(event.startDate))) return 'Ongoing';
    return 'Upcoming';
  };

  const handleCreateEvent = () => {
    navigate('/admin/events/create');
  };

  const handleViewAllEvents = () => {
    navigate('/admin/events');
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}/edit`);
  };

  if (loading) {
    return (
      <Card variant="outline">
        <CardBody>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Stack spacing={6}>
      {/* Stats Overview */}
      {stats && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
          <Card variant="outline" textAlign="center">
            <CardBody>
              <Heading size="xl" color="blue.500">
                {stats.totalEvents || 0}
              </Heading>
              <Text color="gray.500">Total Events</Text>
            </CardBody>
          </Card>
          <Card variant="outline" textAlign="center">
            <CardBody>
              <Heading size="xl" color="green.500">
                {stats.totalRegistrations || 0}
              </Heading>
              <Text color="gray.500">Total Registrations</Text>
            </CardBody>
          </Card>
          <Card variant="outline" textAlign="center">
            <CardBody>
              <Heading size="xl" color="purple.500">
                {stats.totalAttendees || 0}
              </Heading>
              <Text color="gray.500">Total Attendees</Text>
            </CardBody>
          </Card>
          <Card variant="outline" textAlign="center">
            <CardBody>
              <Heading size="xl" color="orange.500">
                {stats.upcomingEvents || 0}
              </Heading>
              <Text color="gray.500">Upcoming Events</Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Upcoming Events */}
      <Card variant="outline">
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" display="flex" alignItems="center" gap={2}>
              <Icon as={FaCalendarAlt} color="blue.500" />
              Upcoming Events
            </Heading>
            <HStack>
              <Tooltip label="Refresh">
                <IconButton
                  aria-label="Refresh data"
                  icon={<Icon as={FaSync} />}
                  size="sm"
                  onClick={loadDashboardData}
                  variant="ghost"
                />
              </Tooltip>
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<Icon as={FaPlus} />}
                onClick={handleCreateEvent}
                mr={2}
              >
                Create Event
              </Button>
              <Button
                size="sm"
                variant="outline"
                rightIcon={<Icon as={FaArrowRight} />}
                onClick={handleViewAllEvents}
              >
                View All
              </Button>
            </HStack>
          </Flex>

          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle>Error loading data!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {upcomingEvents.length === 0 && !loading && (
            <Box textAlign="center" py={6}>
              <Text color="gray.500" mb={2}>
                No upcoming events.
              </Text>
              <Button
                variant="solid"
                colorScheme="blue"
                size="sm"
                leftIcon={<Icon as={FaPlus} />}
                onClick={handleCreateEvent}
              >
                Create First Event
              </Button>
            </Box>
          )}

          {upcomingEvents.length > 0 && (
            <List spacing={3}>
              {upcomingEvents.map((event) => (
                <React.Fragment key={event._id}>
                  <ListItem p={0}>
                    <Flex align="center" w="full">
                      <Avatar
                        icon={<Icon as={FaCalendarCheck} fontSize="1.5rem" />}
                        bg={getStatusColorScheme(event) + '.100'}
                        color={getStatusColorScheme(event) + '.500'}
                        size="md"
                        mr={3}
                      />
                      <Box flex="1">
                        <ChakraLink
                          as={RouterLink}
                          to={`/admin/events/${event._id}`}
                          fontWeight="bold"
                        >
                          {event.title}
                        </ChakraLink>
                        <Text fontSize="sm" color="gray.500">
                          {format(new Date(event.startDate), 'MMM dd, yyyy')} -{' '}
                          {getEventDate(event)}
                        </Text>
                      </Box>
                      <Badge
                        colorScheme={getStatusColorScheme(event)}
                        variant="subtle"
                        mr={3}
                      >
                        {getStatusLabel(event)}
                      </Badge>
                      <HStack spacing={1}>
                        <Tooltip label="View Details">
                          <IconButton
                            aria-label="View event"
                            icon={<Icon as={FaEye} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEvent(event._id)}
                          />
                        </Tooltip>
                        <Tooltip label="Edit Event">
                          <IconButton
                            aria-label="Edit event"
                            icon={<Icon as={FaEdit} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEvent(event._id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardBody>
      </Card>

      {/* Recent Events */}
      <Card variant="outline">
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" display="flex" alignItems="center" gap={2}>
              <Icon as={FaChartBar} color="blue.500" />
              Recently Completed
            </Heading>
            <Button
              size="sm"
              variant="outline"
              rightIcon={<Icon as={FaArrowRight} />}
              onClick={handleViewAllEvents} // Assuming this navigates to a list where they can filter by completed
            >
              View All Events
            </Button>
          </Flex>
          {recentEvents.length === 0 && !loading && (
            <Box textAlign="center" py={6}>
              <Text color="gray.500">No recently completed events.</Text>
            </Box>
          )}
          {recentEvents.length > 0 && (
            <List spacing={3}>
              {recentEvents.map((event) => (
                <React.Fragment key={event._id}>
                  <ListItem p={0}>
                    <Flex align="center" w="full">
                      <Avatar
                        icon={<Icon as={FaCheckCircle} fontSize="1.5rem" />}
                        bg="gray.100"
                        color="gray.500"
                        size="md"
                        mr={3}
                      />
                      <Box flex="1">
                        <ChakraLink
                          as={RouterLink}
                          to={`/admin/events/${event._id}`}
                          fontWeight="medium"
                        >
                          {event.title}
                        </ChakraLink>
                        <Text fontSize="sm" color="gray.500">
                          Completed:{' '}
                          {format(new Date(event.endDate), 'MMM dd, yyyy')}
                        </Text>
                      </Box>
                      <Text fontSize="sm" color="gray.600" mr={3}>
                        {event.registrations?.filter(
                          (r) => r.status === 'confirmed'
                        ).length || 0}{' '}
                        Registered / {event.attendees?.length || 0} Attended
                      </Text>
                      <Badge colorScheme="gray" variant="solid">
                        Completed
                      </Badge>
                    </Flex>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardBody>
      </Card>
    </Stack>
  );
};

export default AdminEventWidget;
