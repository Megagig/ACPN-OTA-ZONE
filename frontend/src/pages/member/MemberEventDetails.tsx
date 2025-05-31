import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  SimpleGrid,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  ListIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Image,
  IconButton,
  Tooltip,
  Flex,
  Heading,
  VStack,
  HStack,
  Icon,
  useToast,
  Link as ChakraLink,
  Divider,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaShareAlt,
  FaCalendarAlt,
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa';
import { EventService } from '../../services/event.service';
import type {
  Event,
  EventType,
  EventRegistration,
} from '../../types/event.types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { format, isPast } from 'date-fns';

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

const MemberEventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] =
    useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const [eventData, registrations] = await Promise.all([
        EventService.getEventById(eventId),
        EventService.getUserRegistrations(user?._id, 1, 100),
      ]);

      setEvent(eventData);

      // Find user's registration for this event
      const userReg = registrations.data.find((reg) => reg.eventId === eventId);
      setUserRegistration(userReg || null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId, user?._id]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  const handleDirectRegister = async () => {
    if (!event || !user) return;

    try {
      setRegistering(true);
      setError(null);

      const registrationData = {
        eventId: event._id,
        notes: '', // Add any default notes if necessary
      };

      const registration = await EventService.registerForEvent(
        event._id,
        registrationData
      );
      setUserRegistration(registration);
      toast({
        title: 'Registration Successful',
        description: `You have successfully registered for ${event.title}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      loadEventDetails(); // Refresh event details
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message || 'Failed to register for event';
      setError(errorMessage);
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!event || !userRegistration) return; // Ensure there's a registration to cancel

    try {
      setRegistering(true);
      setError(null); // Clear previous errors
      await EventService.unregisterFromEvent(event._id);
      setUserRegistration(null);
      toast({
        title: 'Unregistration Successful',
        description: `You have successfully unregistered from ${event.title}.`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      loadEventDetails(); // Refresh event details
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message || 'Failed to unregister from event';
      setError(errorMessage);
      toast({
        title: 'Unregistration Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRegistering(false);
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
    toast({
      title: favorite ? 'Removed from favorites' : 'Added to favorites',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    // TODO: Implement favorite API call
  };

  const handleShare = () => {
    if (navigator.share && event) {
      navigator
        .share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        })
        .then(() => {
          toast({
            title: 'Event Shared!',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          // If sharing fails, or is cancelled by user, it might throw an error or just not resolve.
          // We can choose to show a toast or not, depending on desired UX.
          // For now, let's assume if it fails, it's often user cancellation, so no error toast.
          console.error('Error sharing:', error);
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Event link copied to clipboard.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getEventStatusLabel = () => {
    if (!event) return '';
    if (event.status === 'cancelled') return 'Cancelled';
    if (isPast(new Date(event.endDate))) return 'Completed';
    if (isPast(new Date(event.startDate))) return 'Ongoing';
    return 'Upcoming';
  };

  const getStatusColorScheme = (): string => {
    if (!event) return 'gray';
    if (event.status === 'cancelled') return 'red';
    if (isPast(new Date(event.endDate))) return 'gray';
    if (isPast(new Date(event.startDate))) return 'orange';
    return 'green';
  };

  const canRegister = () => {
    if (!event || !user) return false;
    if (!event.requiresRegistration) return false;
    if (event.status !== 'published') return false;
    if (userRegistration) return false;
    if (
      event.registrationDeadline &&
      isPast(new Date(event.registrationDeadline))
    )
      return false;
    if (isPast(new Date(event.startDate))) return false;
    return true;
  };

  const isRegistrationFull = () => {
    if (!event || !event.capacity) return false;
    const registeredCount =
      event.registrations?.filter((r) => r.status === 'confirmed').length || 0;
    return registeredCount >= event.capacity;
  };

  const getRegistrationStatusInfo = () => {
    if (!userRegistration) return null;

    const statusLabels: Record<string, string> = {
      pending: 'Registration Pending',
      confirmed: 'Registered',
      registered: 'Registered', // Adding 'registered' as a possible backend status
      waitlist: 'On Waitlist',
      cancelled: 'Registration Cancelled',
    };

    const statusColors: Record<string, string> = {
      pending: 'yellow',
      confirmed: 'green',
      registered: 'green',
      waitlist: 'blue',
      cancelled: 'red',
    };

    return {
      label:
        statusLabels[userRegistration.status.toLowerCase()] ||
        userRegistration.status,
      colorScheme:
        statusColors[userRegistration.status.toLowerCase()] || 'gray',
    };
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error && !event) {
    return (
      <Box p={4}>
        <Alert status="error" mb={3}>
          <AlertIcon />
          <AlertTitle>Error Loading Event!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate('/member/events')}
          variant="outline"
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box p={4}>
        <Alert status="info" mb={3}>
          <AlertIcon />
          <AlertDescription>
            Event not found or could not be loaded.
          </AlertDescription>
        </Alert>
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate('/member/events')}
          variant="outline"
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  const registrationStatusInfo = getRegistrationStatusInfo();

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Breadcrumb mb={4} separator="/">
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/member/events">
            Events
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{event.title}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex align="center" gap={2} mb={4}>
        <IconButton
          aria-label="Back to events"
          icon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate('/member/events')}
          variant="ghost"
        />
        <Heading size="lg" flexGrow={1}>
          {event.title}
        </Heading>
        <Tooltip
          label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IconButton
            aria-label="Toggle favorite"
            icon={
              favorite ? (
                <Icon as={FaHeart} color="red.500" />
              ) : (
                <Icon as={FaRegHeart} />
              )
            }
            onClick={toggleFavorite}
            variant="ghost"
          />
        </Tooltip>
        <Tooltip label="Share event">
          <IconButton
            aria-label="Share event"
            icon={<Icon as={FaShareAlt} />}
            onClick={handleShare}
            variant="ghost"
          />
        </Tooltip>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Main Content */}
        <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
          {event.imageUrl && (
            <Card mb={6} variant="outline">
              <Image
                src={event.imageUrl}
                alt={event.title}
                objectFit="cover"
                maxH="400px"
                w="100%"
              />
            </Card>
          )}

          <Card mb={6} variant="outline">
            <CardBody>
              <Heading size="md" mb={2}>
                About This Event
              </Heading>
              <Text color="gray.600" mb={4} whiteSpace="pre-wrap">
                {event.description}
              </Text>

              {event.tags && event.tags.length > 0 && (
                <Box mt={4}>
                  <Heading size="sm" mb={2}>
                    Tags:
                  </Heading>
                  <HStack spacing={2} wrap="wrap">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} colorScheme="blue" variant="subtle">
                        {tag}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </CardBody>
          </Card>

          <Card variant="outline">
            <CardBody>
              <Heading size="md" mb={4}>
                Event Schedule & Location
              </Heading>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={FaCalendarAlt} color="blue.500" />
                  <Text display="inline" fontWeight="bold">
                    Start:
                  </Text>
                  <Text ml={2} display="inline">
                    {format(
                      new Date(event.startDate),
                      'EEEE, MMMM dd, yyyy • h:mm a'
                    )}
                  </Text>
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCalendarAlt} color="blue.500" />
                  <Text display="inline" fontWeight="bold">
                    End:
                  </Text>
                  <Text ml={2} display="inline">
                    {format(
                      new Date(event.endDate),
                      'EEEE, MMMM dd, yyyy • h:mm a'
                    )}
                  </Text>
                </ListItem>
                <ListItem>
                  <ListIcon as={FaMapMarkerAlt} color="blue.500" />
                  <Text display="inline" fontWeight="bold">
                    Location:
                  </Text>
                  <Text ml={2} display="inline">
                    {event.location.virtual
                      ? 'Virtual Event'
                      : `${event.location.name}, ${
                          event.location.address || ''
                        }, ${event.location.city}, ${event.location.state}`}
                  </Text>
                </ListItem>
                {event.location.virtual && event.location.meetingLink && (
                  <ListItem>
                    <ListIcon as={FaInfoCircle} color="blue.500" />
                    <Text display="inline" fontWeight="bold">
                      Meeting Link:
                    </Text>
                    <Text ml={2} display="inline">
                      Link will be shared with registered participants.
                    </Text>
                  </ListItem>
                )}
              </List>
            </CardBody>
          </Card>
        </Box>

        {/* Sidebar */}
        <VStack spacing={6} align="stretch">
          {registrationStatusInfo && (
            <Card variant="outline">
              <CardBody>
                <HStack mb={2} align="center">
                  <Icon
                    as={FaCheckCircle}
                    color={`${registrationStatusInfo.colorScheme}.500`}
                  />
                  <Heading size="sm">Registration Status</Heading>
                </HStack>
                <Badge
                  colorScheme={registrationStatusInfo.colorScheme}
                  variant="solid"
                  mb={3}
                  p={2}
                  borderRadius="md"
                  w="full"
                  textAlign="center"
                >
                  {registrationStatusInfo.label}
                </Badge>
                {userRegistration?.paymentStatus === 'pending' &&
                  event.registrationFee && (
                    <Alert status="warning" variant="subtle" mb={3}>
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Payment Pending</AlertTitle>
                        <AlertDescription>
                          ₦{event.registrationFee.toLocaleString()}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                {(userRegistration?.status.toLowerCase() === 'confirmed' ||
                  userRegistration?.status.toLowerCase() === 'registered') && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    onClick={handleUnregister}
                    isLoading={registering}
                    loadingText="Unregistering"
                    w="full"
                  >
                    Unregister
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          <Card variant="outline">
            <CardBody>
              <Heading size="sm" mb={3}>
                Event Information
              </Heading>
              <VStack spacing={3} align="stretch">
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">
                    Type
                  </Text>
                  <Badge colorScheme="teal" variant="subtle">
                    {eventTypeLabels[event.eventType] || event.eventType}
                  </Badge>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">
                    Status
                  </Text>
                  <Badge colorScheme={getStatusColorScheme()} variant="solid">
                    {getEventStatusLabel()}
                  </Badge>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">
                    Organizer
                  </Text>
                  <Text textAlign="right">{event.organizer}</Text>
                </Flex>
                <Divider />
                {typeof event.registrationFee === 'number' && (
                  <>
                    <Flex justify="space-between">
                      <Text fontWeight="medium" color="gray.600">
                        Registration Fee
                      </Text>
                      <Text fontWeight="bold" color="blue.600">
                        ₦{event.registrationFee.toLocaleString()}
                      </Text>
                    </Flex>
                    <Divider />
                  </>
                )}
                {typeof event.capacity === 'number' && (
                  <>
                    <Flex justify="space-between">
                      <Text fontWeight="medium" color="gray.600">
                        Capacity
                      </Text>
                      <Text>
                        {(
                          event.registrations?.filter(
                            (r) =>
                              r.status.toLowerCase() === 'confirmed' ||
                              r.status.toLowerCase() === 'registered'
                          ).length || 0
                        ).toString()}{' '}
                        / {event.capacity}
                      </Text>
                    </Flex>
                    <Divider />
                  </>
                )}
                {event.registrationDeadline && (
                  <>
                    <Flex justify="space-between">
                      <Text fontWeight="medium" color="gray.600">
                        Reg. Deadline
                      </Text>
                      <Text>
                        {format(
                          new Date(event.registrationDeadline),
                          'MMM dd, yyyy'
                        )}
                      </Text>
                    </Flex>
                    <Divider />
                  </>
                )}
                {event.isAttendanceRequired && (
                  <Alert status="info" variant="subtle" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      Attendance tracking is enabled for this event.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {canRegister() && (
            <Card variant="outline">
              <CardBody>
                <Heading size="sm" mb={3}>
                  Register for Event
                </Heading>
                {isRegistrationFull() ? (
                  <Alert
                    status="warning"
                    variant="subtle"
                    mb={3}
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <AlertDescription>
                      Event is full. You can join the waitlist.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Text color="gray.600" mb={3}>
                    Secure your spot for this event.
                  </Text>
                )}
                <Button
                  colorScheme="blue"
                  onClick={handleDirectRegister} // Changed to handleDirectRegister
                  isLoading={registering}
                  loadingText="Registering..."
                  isDisabled={isRegistrationFull() || !canRegister()}
                  w="full"
                >
                  {isRegistrationFull() ? 'Event Full' : 'Register for Event'}
                </Button>
                {typeof event.registrationFee === 'number' &&
                  event.registrationFee > 0 && (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      mt={2}
                      textAlign="center"
                    >
                      Registration fee: ₦
                      {event.registrationFee.toLocaleString()}
                    </Text>
                  )}
              </CardBody>
            </Card>
          )}
        </VStack>
      </SimpleGrid>
    </Box>
  );
};

export default MemberEventDetails;
