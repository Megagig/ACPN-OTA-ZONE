import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Icon,
  Avatar,
  Flex,
  IconButton,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiEye,
  FiFilter,
  FiClock,
  FiUsers,
} from 'react-icons/fi';
import eventService from '../../services/event.service';
import type { Event, EventType, EventStatus } from '../../types/event.types';

const EventList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventService.getEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error loading events',
          description: 'Failed to load events. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  useEffect(() => {
    // Apply filters whenever filter state changes
    let results = events;

    // Search term filter
    if (searchTerm) {
      results = results.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (typeFilter !== 'all') {
      results = results.filter((event) => event.eventType === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((event) => event.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'upcoming') {
        results = results.filter((event) => new Date(event.startDate) >= now);
      } else if (dateFilter === 'past') {
        results = results.filter((event) => new Date(event.startDate) < now);
      }
    }

    setFilteredEvents(results);
  }, [events, searchTerm, typeFilter, statusFilter, dateFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'conference':
        return 'purple';
      case 'workshop':
        return 'green';
      case 'seminar':
        return 'blue';
      case 'training':
        return 'indigo';
      case 'meetings':
        return 'yellow';
      case 'state_events':
        return 'orange';
      case 'social':
        return 'pink';
      case 'other':
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return 'green';
      case 'draft':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await eventService.deleteEvent(eventToDelete);
      setEvents(events.filter((event) => event._id !== eventToDelete));
      toast({
        title: 'Event deleted',
        description: 'Event has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error deleting event',
        description: 'Failed to delete event. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEventToDelete(null);
      onClose();
    }
  };

  const openDeleteDialog = (eventId: string) => {
    setEventToDelete(eventId);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="7xl">
          <Center minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" color="gray.600">
                Loading events...
              </Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="xl" color="gray.800" mb={2}>
                Events Management
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Manage and organize all your events
              </Text>
            </Box>
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                size="lg"
                onClick={() => navigate('/events/create')}
              >
                Create Event
              </Button>
              <Button
                leftIcon={<Icon as={FiCalendar} />}
                colorScheme="indigo"
                variant="outline"
                size="lg"
                onClick={() => navigate('/events/calendar')}
              >
                Calendar View
              </Button>
            </HStack>
          </Flex>

          {/* Filters */}
          <Card bg={cardBg} shadow="md">
            <CardHeader>
              <Heading size="md" color="gray.800">
                <Icon as={FiFilter} mr={2} />
                Filter Events
              </Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                {/* Search */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                    Search Events
                  </Text>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by title, description or location"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Box>

                {/* Event Type filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                    Event Type
                  </Text>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as EventType | 'all')}
                  >
                    <option value="all">All Types</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="training">Training</option>
                    <option value="meetings">Meetings</option>
                    <option value="state_events">State Events</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </Select>
                </Box>

                {/* Status filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                    Status
                  </Text>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Select>
                </Box>

                {/* Date filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                    Date Range
                  </Text>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                  >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming Events</option>
                    <option value="past">Past Events</option>
                  </Select>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Events Table */}
          <Card bg={cardBg} shadow="md">
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="gray.800">
                  Events ({filteredEvents.length})
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Total: {events.length} events
                </Text>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
              {filteredEvents.length === 0 ? (
                <Center p={8}>
                  <VStack spacing={3}>
                    <Icon as={FiCalendar} w={12} h={12} color="gray.400" />
                    <Text fontSize="lg" color="gray.500" textAlign="center">
                      No events found matching your criteria
                    </Text>
                    <Button
                      leftIcon={<Icon as={FiPlus} />}
                      colorScheme="blue"
                      onClick={() => navigate('/events/create')}
                    >
                      Create Your First Event
                    </Button>
                  </VStack>
                </Center>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Event</Th>
                        <Th>Date & Location</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredEvents.map((event) => (
                        <Tr
                          key={event._id}
                          _hover={{ bg: 'gray.50' }}
                          cursor="pointer"
                          onClick={() => navigate(`/events/${event._id}`)}
                        >
                          <Td>
                            <HStack spacing={3}>
                              <Avatar
                                size="md"
                                bg="blue.100"
                                icon={<Icon as={FiCalendar} color="blue.500" />}
                              />
                              <Box>
                                <Text fontWeight="medium" color="gray.900">
                                  {event.title}
                                </Text>
                                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                  {event.description}
                                </Text>
                              </Box>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Icon as={FiClock} color="gray.400" size="sm" />
                                <Text fontSize="sm" color="gray.900">
                                  {formatDate(event.startDate)}
                                </Text>
                              </HStack>
                              <HStack spacing={2}>
                                <Icon as={FiMapPin} color="gray.400" size="sm" />
                                <Text fontSize="sm" color="gray.500">
                                  {event.location.virtual
                                    ? 'Virtual Event'
                                    : event.location.name}
                                </Text>
                              </HStack>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getEventTypeColor(event.eventType)}
                              variant="subtle"
                              textTransform="capitalize"
                            >
                              {event.eventType}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(event.status)}
                              variant="subtle"
                              textTransform="capitalize"
                            >
                              {event.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="View event"
                                icon={<Icon as={FiEye} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/events/${event._id}`);
                                }}
                              />
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  aria-label="More actions"
                                  icon={<Icon as={FiMoreVertical} />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <MenuList>
                                  <MenuItem
                                    icon={<Icon as={FiEdit} />}
                                    onClick={() => navigate(`/events/${event._id}/edit`)}
                                  >
                                    Edit Event
                                  </MenuItem>
                                  <MenuItem
                                    icon={<Icon as={FiUsers} />}
                                    onClick={() => navigate(`/events/${event._id}/attendees`)}
                                  >
                                    View Attendees
                                  </MenuItem>
                                  <MenuItem
                                    icon={<Icon as={FiTrash2} />}
                                    color="red.500"
                                    onClick={() => openDeleteDialog(event._id)}
                                  >
                                    Delete Event
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Event
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteEvent} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default EventList;
