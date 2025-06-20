import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Flex,
  Center,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaCalendarDay,
  FaArrowRight,
  FaSync,
} from 'react-icons/fa';
import eventService from '../../services/event.service';
import type {
  Event,
  EventRegistration,
  PenaltyInfo,
} from '../../types/event.types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  format,
  isToday,
  isTomorrow,
  isFuture,
  differenceInDays,
} from 'date-fns';

const MemberEventWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [penalties, setPenalties] = useState<PenaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, registrationsResponse, penaltiesData] =
        await Promise.all([
          eventService.getAllEvents({ status: 'published' }, 1, 5),
          eventService.getUserRegistrations(1, 10),
          eventService.getUserPenalties().catch(() => null), // Ignore errors for penalties
        ]);

      // Filter upcoming events
      const upcoming = (eventsResponse?.data || [])
        .filter((event) => {
          try {
            return (
              event && event.startDate && isFuture(new Date(event.startDate))
            );
          } catch {
            return false;
          }
        })
        .slice(0, 3);

      setUpcomingEvents(upcoming);
      setRegistrations((registrationsResponse?.data || []).slice(0, 5));
      if (penaltiesData) setPenalties(penaltiesData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?._id]);

  const getEventDate = (event: Event) => {
    if (!event.startDate) return 'TBD';

    try {
      const startDate = new Date(event.startDate);

      if (isNaN(startDate.getTime())) return 'TBD';

      if (isToday(startDate)) return 'Today';
      if (isTomorrow(startDate)) return 'Tomorrow';

      const daysUntil = differenceInDays(startDate, new Date());
      if (daysUntil <= 7) return `In ${daysUntil} days`;

      return format(startDate, 'MMM dd');
    } catch {
      return 'TBD';
    }
  };

  const getRegistrationStatus = (registration: EventRegistration) => {
    if (!registration || !registration.status) {
      return {
        colorScheme: 'blue',
        label: 'Unknown',
      };
    }

    const statusColors: Record<string, string> = {
      registered: 'blue',
      confirmed: 'green',
      waitlist: 'yellow',
      cancelled: 'red',
    };

    const statusLabels = {
      registered: 'Registered',
      confirmed: 'Confirmed',
      waitlist: 'Waitlist',
      cancelled: 'Cancelled',
    };

    return {
      colorScheme: statusColors[registration.status] || 'blue',
      label:
        statusLabels[registration.status as keyof typeof statusLabels] ||
        registration.status,
    };
  };

  const handleViewAllEvents = () => {
    navigate('/member/events');
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/member/events/${eventId}`);
  };

  const handleViewRegistrations = () => {
    navigate('/member/events/my-registrations');
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Center minH="200px">
            <Spinner size="lg" color="blue.500" />
          </Center>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Upcoming Events */}
      <Card>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack>
              <FaCalendarDay color="blue" />
              <Text fontSize="lg" fontWeight="semibold">
                Upcoming Events
              </Text>
            </HStack>
            <HStack>
              <Tooltip label="Refresh">
                <IconButton
                  aria-label="Refresh"
                  icon={<FaSync />}
                  size="sm"
                  onClick={loadDashboardData}
                />
              </Tooltip>
              <Button
                size="sm"
                rightIcon={<FaArrowRight />}
                onClick={handleViewAllEvents}
              >
                View All
              </Button>
            </HStack>
          </Flex>

          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {upcomingEvents.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Text color="gray.500" mb={2}>
                No upcoming events
              </Text>
              <Button variant="outline" size="sm" onClick={handleViewAllEvents}>
                Browse Events
              </Button>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {upcomingEvents.map((event, index) => {
                const eventId = event?._id || `event-${index}`;
                return (
                  <Box key={eventId}>
                    {index > 0 && <Divider />}
                    <Box
                      p={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleViewEvent(event._id)}
                    >
                      <Flex align="center" gap={3}>
                        <Avatar
                          size="md"
                          bg="blue.500"
                          icon={<FaCalendarAlt />}
                        />
                        <Box flex="1">
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="medium" noOfLines={1}>
                              {event.title || 'Untitled Event'}
                            </Text>
                            <Badge
                              colorScheme={
                                event.startDate &&
                                (isToday(new Date(event.startDate)) ||
                                  isTomorrow(new Date(event.startDate)))
                                  ? 'red'
                                  : 'gray'
                              }
                            >
                              {getEventDate(event)}
                            </Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.600">
                            {event.startDate
                              ? (() => {
                                  try {
                                    return format(
                                      new Date(event.startDate),
                                      'h:mm a'
                                    );
                                  } catch {
                                    return 'Time TBD';
                                  }
                                })()
                              : 'Time TBD'}{' '}
                            •{' '}
                            {event.location?.virtual
                              ? 'Virtual'
                              : event.location?.name || 'TBD'}
                          </Text>
                          {event.requiresRegistration && (
                            <Text fontSize="xs" color="blue.500" mt={1}>
                              Registration required
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* My Registrations */}
      <Card>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack>
              <FaCheckCircle color="green" />
              <Text fontSize="lg" fontWeight="semibold">
                My Registrations
              </Text>
            </HStack>
            <Button
              size="sm"
              rightIcon={<FaArrowRight />}
              onClick={handleViewRegistrations}
            >
              View All
            </Button>
          </Flex>

          {registrations.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Text color="gray.500" mb={2}>
                No event registrations yet
              </Text>
              <Button variant="outline" size="sm" onClick={handleViewAllEvents}>
                Find Events
              </Button>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {registrations.slice(0, 3).map((registration, index) => {
                const status = getRegistrationStatus(registration);
                const registrationId =
                  registration?._id || `registration-${index}`;
                return (
                  <Box key={registrationId}>
                    {index > 0 && <Divider />}
                    <Flex align="center" gap={3} p={2}>
                      <Avatar
                        size="sm"
                        bg={`${status.colorScheme}.500`}
                        icon={<FaCalendarDay />}
                      />
                      <Box flex="1">
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                            Event Registration
                          </Text>
                          <Badge colorScheme={status.colorScheme}>
                            {status.label}
                          </Badge>
                        </Flex>
                        <Text fontSize="xs" color="gray.500">
                          {registration.registrationDate
                            ? `Registered on ${format(
                                new Date(registration.registrationDate),
                                'MMM dd, yyyy'
                              )}`
                            : 'Registration date not available'}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Penalties Warning */}
      {penalties && penalties.totalPenalty && penalties.totalPenalty > 0 && (
        <Card>
          <CardBody>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium" mb={1}>
                  Meeting Attendance Penalties
                </Text>
                <Text fontSize="sm">
                  You have ₦{penalties.totalPenalty.toLocaleString()} in meeting
                  attendance penalties for {penalties.year}.
                </Text>
                <Text fontSize="xs" color="gray.600" mt={2}>
                  {penalties.missedMeetings} missed meetings •{' '}
                  {penalties.meetingsAttended} attended
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  mt={2}
                  onClick={() => navigate('/member/penalties')}
                >
                  View Details
                </Button>
              </Box>
            </Alert>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>
            Quick Actions
          </Text>
          <Flex gap={2} wrap="wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FaCalendarDay />}
              onClick={handleViewAllEvents}
            >
              Browse Events
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FaCalendarAlt />}
              onClick={() => navigate('/member/events/calendar')}
            >
              Event Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FaCheckCircle />}
              onClick={() => navigate('/member/events/history')}
            >
              Event History
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default MemberEventWidget;
