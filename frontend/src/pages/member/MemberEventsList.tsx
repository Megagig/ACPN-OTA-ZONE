import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  SimpleGrid,
  Badge,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Image,
  IconButton,
  Tooltip,
  Flex,
  Center,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaDollarSign,
  FaCheckCircle,
  FaInfo,
  FaHeart,
  FaRegHeart,
  FaShare,
} from 'react-icons/fa';
import { EventService } from '../../services/event.service';
import type { Event, EventType, EventFilters } from '../../types/event.types';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isFuture } from 'date-fns';

const eventTypeLabels: Record<EventType, string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  seminar: 'Seminar',
  training: 'Training',
  meetings: 'Meeting',
  state_events: 'State Event',
  social: 'Social',
  other: 'Other',
};

const eventTypeColors: Record<EventType, string> = {
  conference: 'blue',
  workshop: 'cyan',
  seminar: 'purple',
  training: 'green',
  meetings: 'red',
  state_events: 'orange',
  social: 'pink',
  other: 'gray',
};

const MemberEventsList: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<EventFilters>({
    status: 'published',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters: EventFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await EventService.getAllEvents(searchFilters, page, 12);
      setEvents(response.data);
      setTotalPages(response.totalPages);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filters, page, searchTerm]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleFilterChange = (
    field: keyof EventFilters,
    value: string | boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/member/events/${eventId}`);
  };

  const handleRegister = (eventId: string) => {
    navigate(`/member/events/${eventId}/register`);
  };

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  };

  const getEventStatus = (event: Event) => {
    if (event.status === 'cancelled') return 'Cancelled';
    if (isPast(new Date(event.endDate))) return 'Completed';
    if (isPast(new Date(event.startDate))) return 'Ongoing';
    return 'Upcoming';
  };

  const getStatusColor = (event: Event): string => {
    if (event.status === 'cancelled') return 'red';
    if (isPast(new Date(event.endDate))) return 'gray';
    if (isPast(new Date(event.startDate))) return 'orange';
    return 'green';
  };

  const canRegister = (event: Event) => {
    if (!event.requiresRegistration) return false;
    if (event.status !== 'published') return false;
    if (
      event.registrationDeadline &&
      isPast(new Date(event.registrationDeadline))
    )
      return false;
    if (isPast(new Date(event.startDate))) return false;
    return true;
  };

  const isRegistrationFull = (event: Event) => {
    if (!event.capacity) return false;
    const registeredCount =
      event.registrations?.filter((r) => r.status === 'confirmed').length || 0;
    return registeredCount >= event.capacity;
  };

  if (loading && events.length === 0) {
    return (
      <Center minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="3xl" fontWeight="bold" mb={2}>
          Events
        </Text>
        <Text color="gray.600">Discover and register for upcoming events</Text>
      </Box>

      {/* Filters and Search */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Search events</FormLabel>
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Event Type</FormLabel>
              <Select
                value={filters.eventType || ''}
                onChange={(e) =>
                  handleFilterChange('eventType', e.target.value)
                }
                placeholder="All Types"
              >
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Date Range</FormLabel>
              <Select
                value={filters.dateRange || ''}
                onChange={(e) =>
                  handleFilterChange('dateRange', e.target.value)
                }
                placeholder="All Dates"
              >
                <option value="upcoming">Upcoming</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
                <option value="past">Past Events</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Registration</FormLabel>
              <Select
                value={filters.requiresRegistration?.toString() || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'requiresRegistration',
                    e.target.value === 'true'
                  )
                }
                placeholder="All Events"
              >
                <option value="true">Registration Required</option>
                <option value="false">No Registration</option>
              </Select>
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Events Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {events.map((event) => (
          <Card
            key={event._id}
            h="100%"
            cursor="pointer"
            transition="transform 0.2s"
            _hover={{
              transform: 'translateY(-4px)',
              shadow: 'lg',
            }}
          >
            {/* Event Image */}
            {event.imageUrl && (
              <Image
                src={event.imageUrl}
                alt={event.title}
                h="200px"
                w="100%"
                objectFit="cover"
                borderTopRadius="md"
              />
            )}

            <CardBody>
              {/* Header */}
              <Flex justify="space-between" align="flex-start" mb={3}>
                <Box flex="1">
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    mb={2}
                    noOfLines={2}
                  >
                    {event.title}
                  </Text>
                  <HStack spacing={2} mb={2}>
                    <Badge colorScheme={eventTypeColors[event.eventType]}>
                      {eventTypeLabels[event.eventType]}
                    </Badge>
                    <Badge colorScheme={getStatusColor(event)}>
                      {getEventStatus(event)}
                    </Badge>
                  </HStack>
                </Box>
                <VStack spacing={1}>
                  <Tooltip
                    label={
                      favorites.has(event._id)
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    <IconButton
                      aria-label="Toggle favorite"
                      icon={
                        favorites.has(event._id) ? <FaHeart /> : <FaRegHeart />
                      }
                      size="sm"
                      variant="ghost"
                      colorScheme={favorites.has(event._id) ? 'red' : 'gray'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event._id);
                      }}
                    />
                  </Tooltip>
                  <Tooltip label="Share event">
                    <IconButton
                      aria-label="Share event"
                      icon={<FaShare />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add share functionality
                      }}
                    />
                  </Tooltip>
                </VStack>
              </Flex>

              {/* Description */}
              <Text fontSize="sm" color="gray.600" mb={3} noOfLines={3}>
                {event.description}
              </Text>

              {/* Event Details */}
              <VStack spacing={2} align="stretch" mb={3}>
                <HStack>
                  <FaCalendarAlt color="gray" />
                  <Text fontSize="sm">
                    {format(new Date(event.startDate), 'MMM dd, yyyy • h:mm a')}
                    {event.startDate !== event.endDate && (
                      <>
                        {' '}
                        -{' '}
                        {format(
                          new Date(event.endDate),
                          'MMM dd, yyyy • h:mm a'
                        )}
                      </>
                    )}
                  </Text>
                </HStack>

                <HStack>
                  <FaMapMarkerAlt color="gray" />
                  <Text fontSize="sm">
                    {event.location?.virtual
                      ? 'Virtual Event'
                      : `${event.location?.name || 'TBD'}, ${
                          event.location?.city || ''
                        }`}
                  </Text>
                </HStack>

                <HStack>
                  <FaUser color="gray" />
                  <Text fontSize="sm">{event.organizer}</Text>
                </HStack>

                {event.registrationFee && (
                  <HStack>
                    <FaDollarSign color="gray" />
                    <Text fontSize="sm">
                      ₦{event.registrationFee.toLocaleString()}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Registration Info */}
              {event.requiresRegistration && (
                <Box mb={3}>
                  {isRegistrationFull(event) && (
                    <Alert status="warning" size="sm" mb={2}>
                      <AlertIcon />
                      Registration full
                    </Alert>
                  )}
                  {event.registrationDeadline &&
                    isFuture(new Date(event.registrationDeadline)) && (
                      <Text fontSize="xs" color="gray.500">
                        Registration ends:{' '}
                        {format(
                          new Date(event.registrationDeadline),
                          'MMM dd, yyyy'
                        )}
                      </Text>
                    )}
                </Box>
              )}

              {/* Actions */}
              <HStack spacing={2}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FaInfo />}
                  onClick={() => handleViewEvent(event._id)}
                  flex="1"
                >
                  View Details
                </Button>
                {canRegister(event) && !isRegistrationFull(event) && (
                  <Button
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<FaCheckCircle />}
                    onClick={() => handleRegister(event._id)}
                    flex="1"
                  >
                    Register
                  </Button>
                )}
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <Center py={12}>
          <VStack spacing={3}>
            <Text fontSize="lg" color="gray.500" fontWeight="medium">
              No events found
            </Text>
            <Text color="gray.400">Try adjusting your search filters</Text>
          </VStack>
        </Center>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Center mt={8}>
          <HStack spacing={2}>
            <Button
              variant="outline"
              size="sm"
              isDisabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={pageNum === page ? 'solid' : 'outline'}
                  colorScheme={pageNum === page ? 'blue' : 'gray'}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              isDisabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </HStack>
        </Center>
      )}

      {/* Loading Overlay */}
      {loading && events.length > 0 && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Spinner size="xl" color="blue.500" />
        </Box>
      )}
    </Box>
  );
};

export default MemberEventsList;
