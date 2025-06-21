import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
  Tag,
  TagLabel,
  Divider,
  Image,
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
  FiArrowLeft,
  FiEdit,
  FiCalendar,
  FiMapPin,
  FiVideo,
  FiUsers,
  FiDollarSign,
  FiUserCheck,
  FiUserPlus,
  FiClipboard,
  FiTrash2,
  FiExternalLink,
  FiTag,
  FiUser,
} from 'react-icons/fi';
import eventService from '../../services/event.service';
import type {
  Event,
  EventRegistration,
  RegistrationStatus,
} from '../../types/event.types';

// UI-specific extension of EventRegistration to include UI state
interface UIEventRegistration extends EventRegistration {
  checkedIn?: boolean;
  checkedInAt?: string;
}

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<UIEventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendeeToDelete, setAttendeeToDelete] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventData, attendanceData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getEventRegistrations(id),
        ]);

        setEvent(eventData);
        setAttendees(attendanceData.data || []);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast({
          title: 'Error loading event',
          description: 'Failed to load event details. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id, toast]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeColor = (type: string) => {
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

  const getStatusColor = (status: string) => {
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

  const getAttendeeStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'registered':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'waitlist':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };
  const handleUpdateRegistrationStatus = async (
    registrationId: string,
    status: RegistrationStatus
  ) => {
    if (!id) return;
    try {
      await eventService.updateRegistrationStatus(id, registrationId, status);
      setAttendees(
        attendees.map((a) =>
          a._id === registrationId ? { ...a, status: status } : a
        )
      );
      toast({
        title: 'Registration updated',
        description: 'Registration status has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast({
        title: 'Error updating registration',
        description: 'Failed to update registration status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    if (!id) return;
    try {
      await eventService.updateRegistrationStatus(
        id,
        registrationId,
        'confirmed' as RegistrationStatus
      );
      setAttendees(
        attendees.map((a) =>
          a._id === registrationId
            ? {
                ...a,
                status: 'confirmed' as RegistrationStatus,
                checkedIn: true,
                checkedInAt: new Date().toISOString(),
              }
            : a
        )
      );
      toast({
        title: 'Attendee checked in',
        description: 'Attendee has been successfully checked in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error checking in attendee:', error);
      toast({
        title: 'Error checking in attendee',
        description: 'Failed to check in attendee. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAttendee = async () => {
    if (!attendeeToDelete) return;

    try {
      await handleUpdateRegistrationStatus(attendeeToDelete, 'cancelled');
      setAttendees(attendees.filter((a) => a._id !== attendeeToDelete));
      toast({
        title: 'Attendee removed',
        description: 'Attendee has been successfully removed from the event.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing attendee:', error);
    } finally {
      setAttendeeToDelete(null);
      onClose();
    }
  };

  const openDeleteDialog = (attendeeId: string) => {
    setAttendeeToDelete(attendeeId);
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
                Loading event details...
              </Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="7xl">
          <Center minH="50vh">
            <Card bg={cardBg} shadow="md" p={8} textAlign="center">
              <VStack spacing={4}>
                <Icon as={FiCalendar} w={16} h={16} color="gray.400" />
                <Heading size="lg" color="gray.800">
                  Event Not Found
                </Heading>
                <Text color="gray.600">
                  The event you are looking for does not exist or has been removed.
                </Text>
                <Button
                  leftIcon={<Icon as={FiArrowLeft} />}
                  colorScheme="blue"
                  onClick={() => navigate('/events')}
                >
                  Back to Events
                </Button>
              </VStack>
            </Card>
          </Center>
        </Container>
      </Box>
    );
  }
  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header with actions */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="xl" color="gray.800" mb={2}>
                {event.title}
              </Heading>
              <HStack spacing={3} wrap="wrap">
                <Badge
                  colorScheme={getStatusColor(event.status)}
                  variant="subtle"
                  textTransform="capitalize"
                >
                  {event.status}
                </Badge>
                <Badge
                  colorScheme={getEventTypeColor(event.eventType)}
                  variant="subtle"
                  textTransform="capitalize"
                >
                  {event.eventType}
                </Badge>
              </HStack>
            </Box>
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={FiArrowLeft} />}
                variant="outline"
                onClick={() => navigate('/events')}
              >
                Back to List
              </Button>
              <Button
                leftIcon={<Icon as={FiEdit} />}
                colorScheme="blue"
                onClick={() => navigate(`/events/${id}/edit`)}
              >
                Edit Event
              </Button>
            </HStack>
          </Flex>

          {/* Tabs */}
          <Tabs defaultIndex={0} variant="line" colorScheme="blue">
            <TabList>
              <Tab>Event Details</Tab>
              <Tab>Attendees ({attendees.length})</Tab>
            </TabList>
            
            <TabPanels>
              {/* Event Details Tab */}
              <TabPanel px={0}>
                <Card bg={cardBg} shadow="md">
                  {/* Event image or gradient */}
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      height="200px"
                      width="100%"
                      objectFit="cover"
                      borderTopRadius="md"
                    />
                  ) : (
                    <Box
                      height="200px"
                      bgGradient="linear(to-r, blue.400, purple.500)"
                      borderTopRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiCalendar} color="white" boxSize={20} />
                    </Box>
                  )}

                  <CardBody>
                    {/* Description */}
                    <Box mb={8}>
                      <Heading size="md" color="gray.800" mb={3}>
                        Description
                      </Heading>
                      <Text color="gray.600" whiteSpace="pre-line" lineHeight="tall">
                        {event.description}
                      </Text>
                    </Box>

                    {/* Event details grid */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                      {/* Date and time */}
                      <Card bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <CardHeader pb={2}>
                          <Heading size="sm" color="gray.600">
                            Date & Time
                          </Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="start" spacing={3}>
                            <HStack>
                              <Icon as={FiCalendar} color="blue.500" />
                              <Box>
                                <Text fontSize="sm" fontWeight="medium">
                                  {formatDate(event.startDate)}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                </Text>
                              </Box>
                            </HStack>
                            {event.requiresRegistration && event.registrationDeadline && (
                              <HStack>
                                <Icon as={FiUserCheck} color="green.500" />
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium">
                                    Registration Deadline
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {formatDateTime(event.registrationDeadline)}
                                  </Text>
                                </Box>
                              </HStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Location */}
                      <Card bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <CardHeader pb={2}>
                          <Heading size="sm" color="gray.600">
                            Location
                          </Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <HStack>
                            <Icon 
                              as={event.location.virtual ? FiVideo : FiMapPin} 
                              color="blue.500" 
                            />
                            <Box>
                              <HStack align="center">
                                <Text fontSize="sm" fontWeight="medium">
                                  {event.location.name}
                                </Text>
                                {event.location.virtual && (
                                  <Badge colorScheme="blue" size="sm">Virtual</Badge>
                                )}
                              </HStack>
                              {!event.location.virtual ? (
                                <Text fontSize="xs" color="gray.500">
                                  {event.location.address}, {event.location.city}, {event.location.state}
                                </Text>
                              ) : event.location.meetingLink ? (
                                <Link
                                  href={event.location.meetingLink}
                                  isExternal
                                  fontSize="xs"
                                  color="blue.500"
                                >
                                  Join Meeting <Icon as={FiExternalLink} mx="2px" />
                                </Link>
                              ) : null}
                            </Box>
                          </HStack>
                        </CardBody>
                      </Card>

                      {/* Registration details */}
                      <Card bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <CardHeader pb={2}>
                          <Heading size="sm" color="gray.600">
                            Registration
                          </Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="start" spacing={3}>
                            {event.requiresRegistration ? (
                              <>
                                <HStack>
                                  <Icon as={FiClipboard} color="green.500" />
                                  <Text fontSize="sm">Registration required</Text>
                                </HStack>
                                <HStack>
                                  <Icon as={FiDollarSign} color="green.500" />
                                  <Text fontSize="sm">
                                    {event.registrationFee 
                                      ? `Fee: ₦${event.registrationFee.toLocaleString()}`
                                      : 'Free event'
                                    }
                                  </Text>
                                </HStack>
                                <HStack>
                                  <Icon as={FiUsers} color="blue.500" />
                                  <Text fontSize="sm">
                                    {event.capacity 
                                      ? `Limited to ${event.capacity} attendees`
                                      : 'Unlimited attendance'
                                    }
                                  </Text>
                                </HStack>
                              </>
                            ) : (
                              <HStack>
                                <Icon as={FiUsers} color="blue.500" />
                                <Text fontSize="sm">No registration required</Text>
                              </HStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Organizer details */}
                      <Card bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <CardHeader pb={2}>
                          <Heading size="sm" color="gray.600">
                            Organizer
                          </Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <HStack>
                            <Icon as={FiUser} color="blue.500" />
                            <Text fontSize="sm">{event.organizer}</Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <Box mb={8}>
                        <Heading size="sm" color="gray.600" mb={3}>
                          <Icon as={FiTag} mr={2} />
                          Tags
                        </Heading>
                        <HStack spacing={2} wrap="wrap">
                          {event.tags.map((tag, index) => (
                            <Tag key={index} size="sm" variant="subtle" colorScheme="gray">
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    <Divider mb={6} />

                    {/* Action buttons */}
                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                      <Text fontSize="sm" color="gray.500">
                        Created: {formatDate(event.createdAt || '')}
                        {event.updatedAt && event.updatedAt !== event.createdAt && 
                          ` • Updated: ${formatDate(event.updatedAt)}`
                        }
                      </Text>
                      <HStack spacing={3}>
                        {event.status === 'published' && (
                          <Button
                            leftIcon={<Icon as={FiUserPlus} />}
                            colorScheme="green"
                            onClick={() => navigate(`/events/${id}/register`)}
                          >
                            Register Attendee
                          </Button>
                        )}                        <Button
                          leftIcon={<Icon as={FiUsers} />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => {
                            // This will be handled by Chakra UI tabs automatically
                            // We can just let the user click the tab manually
                          }}
                        >
                          Manage Attendees
                        </Button>
                      </HStack>
                    </Flex>
                  </CardBody>
                </Card>
              </TabPanel>              {/* Attendees Tab */}
              <TabPanel px={0}>
                <Card bg={cardBg} shadow="md">
                  <CardHeader>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                      <Heading size="md" color="gray.800">
                        Attendees
                      </Heading>
                      <HStack spacing={3}>
                        <Button
                          leftIcon={<Icon as={FiUserPlus} />}
                          colorScheme="green"
                          onClick={() => navigate(`/events/${id}/register`)}
                        >
                          Add Attendee
                        </Button>
                        <Button
                          leftIcon={<Icon as={FiClipboard} />}
                          colorScheme="blue"
                          onClick={() => navigate(`/events/${id}/check-in`)}
                        >
                          Check-in Attendees
                        </Button>
                      </HStack>
                    </Flex>
                  </CardHeader>
                  
                  <CardBody>
                    {attendees.length === 0 ? (
                      <Center py={12}>
                        <VStack spacing={4}>
                          <Icon as={FiUsers} w={16} h={16} color="gray.400" />
                          <Text fontSize="lg" color="gray.500" textAlign="center">
                            No attendees registered for this event yet.
                          </Text>
                        </VStack>
                      </Center>
                    ) : (
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Attendee</Th>
                              <Th>Pharmacy</Th>
                              <Th>Registered On</Th>
                              <Th>Status</Th>
                              <Th>Payment</Th>
                              <Th>Check-in</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {attendees.map((attendee) => (
                              <Tr key={attendee._id}>
                                <Td>
                                  <HStack spacing={3}>
                                    <Avatar size="sm" bg="blue.100" icon={<Icon as={FiUser} color="blue.500" />} />
                                    <Text fontWeight="medium">{attendee.userId}</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.500">N/A</Text>
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">
                                      {formatDate(attendee.registeredAt || attendee.createdAt || '')}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {formatTime(attendee.registeredAt || attendee.createdAt || '')}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={getAttendeeStatusColor(attendee.status)}
                                    variant="subtle"
                                    textTransform="capitalize"
                                  >
                                    {attendee.status}
                                  </Badge>
                                </Td>
                                <Td>
                                  {attendee.paymentStatus === 'paid' ? (
                                    <VStack align="start" spacing={1}>
                                      <Badge colorScheme="green" variant="subtle">
                                        Paid
                                      </Badge>
                                      {attendee.paymentReference && (
                                        <Text fontSize="xs" color="gray.500">
                                          Ref: {attendee.paymentReference}
                                        </Text>
                                      )}
                                    </VStack>
                                  ) : (
                                    <Badge
                                      colorScheme={getPaymentStatusColor(attendee.paymentStatus)}
                                      variant="subtle"
                                      textTransform="capitalize"
                                    >
                                      {attendee.paymentStatus}
                                    </Badge>
                                  )}
                                </Td>
                                <Td>
                                  {attendee.status === 'confirmed' ? (
                                    <Badge colorScheme="green" variant="subtle">
                                      <Icon as={FiUserCheck} mr={1} />
                                      Checked In
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      variant="ghost"
                                      onClick={() => handleCheckIn(attendee._id)}
                                    >
                                      Check In
                                    </Button>
                                  )}
                                </Td>
                                <Td>
                                  <HStack spacing={1}>
                                    <IconButton
                                      aria-label="Edit attendee"
                                      icon={<Icon as={FiEdit} />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="blue"
                                      onClick={() => navigate(`/events/${id}/attendees/${attendee._id}`)}
                                    />
                                    <IconButton
                                      aria-label="Remove attendee"
                                      icon={<Icon as={FiTrash2} />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={() => openDeleteDialog(attendee._id)}
                                    />
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
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Delete Attendee Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Attendee
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Are you sure you want to remove this attendee from the event? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAttendee} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default EventDetail;
